import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { authenticate, optionalAuth, staffOnly, fail, isAdmin } from '../middleware/auth.js';
import { uploadCourseFile, uploadLessonMedia } from '../middleware/upload.js';
import { createNotification } from '../utils/notification.js';

const router = express.Router();

function parseModules(modulesVal) {
  if (!modulesVal) return [];
  if (Array.isArray(modulesVal)) return modulesVal;
  try {
    return JSON.parse(modulesVal) || [];
  } catch {
    return [];
  }
}

function normalizeCourse(row, isEnrolled = false) {
  const modules = parseModules(row.modules);
  return {
    id: row.id,
    _id: String(row.id),
    title: row.title,
    description: row.description || '',
    category: row.category || '',
    level: row.level || 'beginner',
    instructor: row.instructor || '',
    price: Number(row.price || 0),
    thumbnail: row.thumbnail || '',
    lessons: Number(row.lessons || modules.length),
    duration: row.duration || '',
    modules,
    createdBy: row.createdBy,
    enrolledCount: Number(row.enrolledCount || 0),
    isEnrolled: Boolean(isEnrolled),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── GET /api/courses/manage ──────────────────────────────────────────────────
router.get('/manage', authenticate, staffOnly, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM courses';
    let dataQuery = `
      SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount 
      FROM courses c 
      ORDER BY c.createdAt DESC 
      LIMIT ? OFFSET ?
    `;
    let queryParams = [limit, offset];

    if (!isAdmin(req.user)) {
      countQuery = 'SELECT COUNT(*) as total FROM courses WHERE createdBy = ?';
      dataQuery = `
        SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount 
        FROM courses c 
        WHERE c.createdBy = ? 
        ORDER BY c.createdAt DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams = [req.user.id, limit, offset];
    }

    const [countRows] = await pool.query(countQuery, !isAdmin(req.user) ? [req.user.id] : []);
    const [courses] = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      count: countRows[0]?.total || 0,
      page,
      limit,
      courses: courses.map((c) => normalizeCourse(c)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/courses/my-enrollments ──────────────────────────────────────────
router.get('/my-enrollments', authenticate, async (req, res, next) => {
  try {
    const [courses] = await pool.execute(
      `SELECT c.*, (SELECT COUNT(*) FROM user_courses uc2 WHERE uc2.courseId = c.id) AS enrolledCount
       FROM user_courses uc
       JOIN courses c ON c.id = uc.courseId
       WHERE uc.userId = ?
       ORDER BY uc.createdAt DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => normalizeCourse(c, true)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/courses ─────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [courses] = await pool.execute(`
      SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount
      FROM courses c
      ORDER BY c.createdAt DESC
    `);

    let enrolledSet = new Set();
    if (req.user) {
      const [userEnrollments] = await pool.execute('SELECT courseId FROM user_courses WHERE userId = ?', [
        req.user.id,
      ]);
      enrolledSet = new Set(userEnrollments.map((r) => r.courseId));
    }

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => normalizeCourse(c, enrolledSet.has(c.id))),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/courses/upload-media ──────────────────────────────────────────
router.post('/upload-media', authenticate, staffOnly, (req, res, next) => {
  uploadCourseFile.single('file')(req, res, (err) => {
    if (err) return fail(res, 400, err.message);
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) return fail(res, 400, 'No file was uploaded');
    const relativeUrl = `/uploads/courses/${req.file.filename}`;
    res.json({
      success: true,
      url: relativeUrl,
      filename: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/courses ────────────────────────────────────────────────────────
router.post('/', authenticate, staffOnly, (req, res, next) => {
  uploadCourseFile.single('thumbnail')(req, res, (err) => {
    if (err) return fail(res, 400, err.message);
    next();
  });
}, async (req, res, next) => {
  try {
    let {
      title,
      description = '',
      category = '',
      level = 'beginner',
      instructor = '',
      duration = '',
      durationHours,
      price = 0,
      thumbnail = '',
      modules = [],
      lessons = 0,
    } = req.body || {};

    if (req.file) {
      thumbnail = `/uploads/courses/${req.file.filename}`;
    }

    if (!title) return fail(res, 400, 'Course title is required');

    let parsedModulesList = [];
    if (typeof modules === 'string') {
      try {
        parsedModulesList = JSON.parse(modules);
      } catch {
        parsedModulesList = [];
      }
    } else if (Array.isArray(modules)) {
      parsedModulesList = modules;
    }

    const lessonCount = Number(lessons) || parsedModulesList.length;
    const finalDuration = duration || (durationHours ? `${durationHours} hours` : null);

    const [result] = await pool.execute(
      `INSERT INTO courses (title, description, category, level, instructor, price, thumbnail, modules, lessons, duration, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        String(title).trim(),
        String(description).trim(),
        category ? String(category).trim() : null,
        level,
        instructor ? String(instructor).trim() : req.user.name,
        Number(price) || 0,
        thumbnail || null,
        JSON.stringify(parsedModulesList),
        lessonCount,
        finalDuration ? String(finalDuration).trim() : null,
        req.user.id,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: normalizeCourse(rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/courses/:id ─────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const [courses] = await pool.execute(
      `SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount
       FROM courses c WHERE c.id = ?`,
      [courseId]
    );

    if (!courses[0]) return fail(res, 404, 'Course not found');

    let isEnrolled = false;
    if (req.user) {
      const [enrolled] = await pool.execute('SELECT 1 FROM user_courses WHERE userId = ? AND courseId = ?', [
        req.user.id,
        courseId,
      ]);
      isEnrolled = Boolean(enrolled.length);
    }

    res.json({ success: true, course: normalizeCourse(courses[0], isEnrolled) });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/courses/:id ─────────────────────────────────────────────────────
router.put('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
    const course = courses[0];

    if (!course) return fail(res, 404, 'Course not found');
    if (!isAdmin(req.user) && String(course.createdBy) !== String(req.user.id)) {
      return fail(res, 403, 'You can only update courses that you created');
    }

    const { title, description, category, level, instructor, price, thumbnail, duration, modules, lessons } =
      req.body || {};
    const sets = ['updatedAt = NOW()'];
    const params = [];

    if (title !== undefined) {
      sets.push('title = ?');
      params.push(String(title).trim());
    }
    if (description !== undefined) {
      sets.push('description = ?');
      params.push(String(description).trim());
    }
    if (category !== undefined) {
      sets.push('category = ?');
      params.push(String(category).trim());
    }
    if (level !== undefined) {
      sets.push('level = ?');
      params.push(level);
    }
    if (instructor !== undefined) {
      sets.push('instructor = ?');
      params.push(String(instructor).trim());
    }
    if (price !== undefined) {
      sets.push('price = ?');
      params.push(Number(price) || 0);
    }
    if (thumbnail !== undefined) {
      sets.push('thumbnail = ?');
      params.push(thumbnail);
    }
    if (duration !== undefined) {
      sets.push('duration = ?');
      params.push(String(duration).trim());
    }
    if (modules !== undefined && Array.isArray(modules)) {
      sets.push('modules = ?');
      params.push(JSON.stringify(modules));
      sets.push('lessons = ?');
      params.push(modules.length);
    } else if (lessons !== undefined) {
      sets.push('lessons = ?');
      params.push(Number(lessons) || 0);
    }

    params.push(courseId);
    await pool.execute(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.execute(
      `SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount
       FROM courses c WHERE c.id = ?`,
      [courseId]
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: normalizeCourse(updated[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/courses/:id ──────────────────────────────────────────────────
router.delete('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    if (!isAdmin(req.user) && String(courses[0].createdBy) !== String(req.user.id)) {
      return fail(res, 403, 'You can only delete courses that you created');
    }

    await pool.execute('DELETE FROM courses WHERE id = ?', [courseId]);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/courses/:id/modules ─────────────────────────────────────────────
router.get('/:id/modules', authenticate, async (req, res, next) => {
  try {
    const [courses] = await pool.execute('SELECT modules FROM courses WHERE id = ?', [req.params.id]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    const modules = parseModules(courses[0].modules);
    res.json({ success: true, count: modules.length, modules });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/courses/:id/modules ────────────────────────────────────────────
router.post('/:id/modules', authenticate, staffOnly, (req, res, next) => {
  uploadLessonMedia(req, res, (err) => {
    if (err) return fail(res, 400, err.message);
    next();
  });
}, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    let { title, description = '', videoUrl = '', pdfUrl = '', notesUrl = '', duration = '' } = req.body || {};

    if (req.files?.video?.[0]) {
      videoUrl = `/uploads/courses/${req.files.video[0].filename}`;
    }
    if (req.files?.pdf?.[0]) {
      pdfUrl = `/uploads/courses/${req.files.pdf[0].filename}`;
    }
    if (req.files?.notes?.[0]) {
      notesUrl = `/uploads/courses/${req.files.notes[0].filename}`;
    }
    const finalNotesUrl = (pdfUrl || notesUrl || '').trim();

    if (!title) return fail(res, 400, 'Module title is required');

    const modules = parseModules(courses[0].modules);
    const newModule = {
      id: crypto.randomUUID(),
      _id: crypto.randomUUID(),
      title: String(title).trim(),
      description: String(description).trim(),
      videoUrl: String(videoUrl).trim(),
      pdfUrl: finalNotesUrl,
      notesUrl: finalNotesUrl,
      duration: String(duration).trim() || '20 min',
      createdAt: new Date().toISOString(),
    };

    modules.push(newModule);

    await pool.execute('UPDATE courses SET modules = ?, lessons = ?, updatedAt = NOW() WHERE id = ?', [
      JSON.stringify(modules),
      modules.length,
      courseId,
    ]);

    res.status(201).json({ success: true, message: 'Module added successfully', module: newModule, modules });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/courses/:id/modules/:moduleId ───────────────────────────────────
router.put('/:id/modules/:moduleId', authenticate, staffOnly, (req, res, next) => {
  uploadLessonMedia(req, res, (err) => {
    if (err) return fail(res, 400, err.message);
    next();
  });
}, async (req, res, next) => {
  try {
    const { id: courseId, moduleId } = req.params;
    const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    const modules = parseModules(courses[0].modules);
    const index = modules.findIndex((m) => String(m.id || m._id) === String(moduleId));
    if (index === -1) return fail(res, 404, 'Module not found');

    const updates = { ...req.body };
    if (req.files?.video?.[0]) {
      updates.videoUrl = `/uploads/courses/${req.files.video[0].filename}`;
    }
    if (req.files?.pdf?.[0]) {
      updates.pdfUrl = `/uploads/courses/${req.files.pdf[0].filename}`;
      updates.notesUrl = updates.pdfUrl;
    }
    if (req.files?.notes?.[0]) {
      updates.notesUrl = `/uploads/courses/${req.files.notes[0].filename}`;
      updates.pdfUrl = updates.notesUrl;
    }

    modules[index] = {
      ...modules[index],
      ...updates,
      id: modules[index].id || modules[index]._id || moduleId,
      _id: modules[index]._id || modules[index].id || moduleId,
      updatedAt: new Date().toISOString(),
    };

    await pool.execute('UPDATE courses SET modules = ?, updatedAt = NOW() WHERE id = ?', [
      JSON.stringify(modules),
      courseId,
    ]);

    res.json({ success: true, message: 'Module updated successfully', module: modules[index], modules });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/courses/:id/modules/:moduleId ────────────────────────────────
router.delete('/:id/modules/:moduleId', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { id: courseId, moduleId } = req.params;
    const [courses] = await pool.execute('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    let modules = parseModules(courses[0].modules);
    const initialLength = modules.length;
    modules = modules.filter((m) => String(m.id || m._id) !== String(moduleId));

    if (modules.length === initialLength) return fail(res, 404, 'Module not found');

    await pool.execute('UPDATE courses SET modules = ?, lessons = ?, updatedAt = NOW() WHERE id = ?', [
      JSON.stringify(modules),
      modules.length,
      courseId,
    ]);

    res.json({ success: true, message: 'Module deleted successfully', modules });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/courses/:id/modules/reorder ─────────────────────────────────────
router.put('/:id/modules/reorder', authenticate, staffOnly, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const { modules } = req.body || {};
    if (!Array.isArray(modules)) return fail(res, 400, 'Modules array is required');

    await pool.execute('UPDATE courses SET modules = ?, lessons = ?, updatedAt = NOW() WHERE id = ?', [
      JSON.stringify(modules),
      modules.length,
      courseId,
    ]);

    res.json({ success: true, message: 'Modules reordered successfully', modules });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/courses/:id/enroll ─────────────────────────────────────────────
router.post('/:id/enroll', authenticate, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const [course] = await pool.execute('SELECT id, title FROM courses WHERE id = ?', [courseId]);
    if (!course[0]) return fail(res, 404, 'Course not found');

    await pool.execute(
      'INSERT IGNORE INTO user_courses (userId, courseId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      [req.user.id, courseId]
    );

    await pool.execute(
      `INSERT IGNORE INTO course_progress (student, course, completedModules, createdAt, updatedAt)
       VALUES (?, ?, '[]', NOW(), NOW())`,
      [req.user.id, courseId]
    );

    res.status(201).json({ success: true, message: `Enrolled successfully in ${course[0].title}` });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/courses/:id/enroll ───────────────────────────────────────────
router.delete('/:id/enroll', authenticate, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    await pool.execute('DELETE FROM user_courses WHERE userId = ? AND courseId = ?', [req.user.id, courseId]);
    res.json({ success: true, message: 'Unenrolled successfully' });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/courses/:id/progress ────────────────────────────────────────────
router.get('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const [progressRows] = await pool.execute(
      'SELECT completedModules FROM course_progress WHERE student = ? AND course = ?',
      [req.user.id, courseId]
    );

    const [courseRows] = await pool.execute('SELECT modules FROM courses WHERE id = ?', [courseId]);
    const totalModules = parseModules(courseRows[0]?.modules).length;

    let completedModules = [];
    if (progressRows[0]?.completedModules) {
      try {
        completedModules = JSON.parse(progressRows[0].completedModules) || [];
      } catch {
        completedModules = [];
      }
    }

    const percentage = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

    res.json({
      success: true,
      completedModules,
      completedCount: completedModules.length,
      totalModules,
      percentage,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/courses/:id/modules/:moduleId/complete ─────────────────────────
router.post('/:id/modules/:moduleId/complete', authenticate, async (req, res, next) => {
  try {
    const { id: courseId, moduleId } = req.params;

    const [courseRows] = await pool.execute('SELECT title, modules FROM courses WHERE id = ?', [courseId]);
    if (!courseRows[0]) return fail(res, 404, 'Course not found');

    const allModules = parseModules(courseRows[0].modules);
    const totalModules = allModules.length;

    const [progressRows] = await pool.execute(
      'SELECT id, completedModules FROM course_progress WHERE student = ? AND course = ?',
      [req.user.id, courseId]
    );

    let completedModules = [];
    if (progressRows[0]?.completedModules) {
      try {
        completedModules = JSON.parse(progressRows[0].completedModules) || [];
      } catch {
        completedModules = [];
      }
    }

    if (!completedModules.includes(String(moduleId))) {
      completedModules.push(String(moduleId));
    }

    if (progressRows[0]) {
      await pool.execute(
        'UPDATE course_progress SET completedModules = ?, updatedAt = NOW() WHERE id = ?',
        [JSON.stringify(completedModules), progressRows[0].id]
      );
    } else {
      await pool.execute(
        `INSERT INTO course_progress (student, course, completedModules, createdAt, updatedAt)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [req.user.id, courseId, JSON.stringify(completedModules)]
      );
    }

    // Track attendance activity
    await pool.execute(
      `INSERT INTO attendances (student, course, activityType, details, createdAt, updatedAt)
       VALUES (?, ?, 'lesson_complete', ?, NOW(), NOW())`,
      [req.user.id, courseId, `Completed module: ${moduleId}`]
    );

    const percentage = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

    if (completedModules.length === totalModules && totalModules > 0) {
      await createNotification(
        req.user.id,
        'Course Completed! 🎉',
        `Congratulations! You have completed all lessons in ${courseRows[0].title}. The quiz is now unlocked!`,
        'success',
        `/test`
      );
    }

    res.json({
      success: true,
      message: 'Lesson marked as complete',
      completedModules,
      percentage,
      isFullyCompleted: completedModules.length >= totalModules,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
