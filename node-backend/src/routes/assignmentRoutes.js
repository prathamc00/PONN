import express from 'express';
import { pool } from '../db.js';
import { authenticate, staffOnly, fail, isAdmin } from '../middleware/auth.js';
import { uploadSubmissionFile } from '../middleware/upload.js';
import { createNotification } from '../utils/notification.js';

const router = express.Router();

function normalizeAssignment(row, submission = null) {
  return {
    id: row.id,
    _id: String(row.id),
    title: row.title,
    description: row.description || '',
    type: row.type || 'file_upload',
    course: {
      id: row.course,
      _id: String(row.course),
      title: row.courseTitle || '',
    },
    dueDate: row.dueDate,
    maxMarks: Number(row.maxMarks || 100),
    createdBy: row.createdBy,
    submissionCount: Number(row.submissionCount || 0),
    submission,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeSubmission(row) {
  return {
    id: row.id,
    _id: String(row.id),
    assignment: row.assignment,
    student: {
      id: row.student,
      _id: String(row.student),
      name: row.studentName || '',
      email: row.studentEmail || '',
      college: row.studentCollege || '',
      branch: row.studentBranch || '',
    },
    type: row.type,
    textContent: row.textContent || null,
    codeContent: row.codeContent || null,
    filePath: row.filePath || null,
    grade: row.grade !== null && row.grade !== undefined ? Number(row.grade) : null,
    feedback: row.feedback || null,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── GET /api/assignments/manage ──────────────────────────────────────────────
router.get('/manage', authenticate, staffOnly, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM assignments';
    let dataQuery = `
      SELECT a.*, c.title as courseTitle, 
             (SELECT COUNT(*) FROM submissions s WHERE s.assignment = a.id) as submissionCount
      FROM assignments a
      LEFT JOIN courses c ON c.id = a.course
      ORDER BY a.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    let queryParams = [limit, offset];

    if (!isAdmin(req.user)) {
      countQuery = 'SELECT COUNT(*) as total FROM assignments WHERE createdBy = ?';
      dataQuery = `
        SELECT a.*, c.title as courseTitle,
               (SELECT COUNT(*) FROM submissions s WHERE s.assignment = a.id) as submissionCount
        FROM assignments a
        LEFT JOIN courses c ON c.id = a.course
        WHERE a.createdBy = ?
        ORDER BY a.createdAt DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [req.user.id, limit, offset];
    }

    const [countRows] = await pool.query(countQuery, !isAdmin(req.user) ? [req.user.id] : []);
    const [assignments] = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      count: countRows[0]?.total || 0,
      page,
      limit,
      assignments: assignments.map((a) => normalizeAssignment(a)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/assignments/my-submissions ──────────────────────────────────────
router.get('/my-submissions', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, a.title as assignmentTitle, a.maxMarks, a.type as assignmentType, c.title as courseTitle
       FROM submissions s
       JOIN assignments a ON a.id = s.assignment
       LEFT JOIN courses c ON c.id = a.course
       WHERE s.student = ?
       ORDER BY s.submittedAt DESC`,
      [req.user.id]
    );

    const submissions = rows.map((r) => ({
      ...normalizeSubmission(r),
      assignment: {
        id: r.assignment,
        _id: String(r.assignment),
        title: r.assignmentTitle,
        maxMarks: Number(r.maxMarks || 100),
        course: { title: r.courseTitle || '' },
      },
    }));

    res.json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/assignments ─────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    let rows;
    if (req.user.role === 'student') {
      [rows] = await pool.execute(
        `SELECT a.*, c.title as courseTitle,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment = a.id) as submissionCount
         FROM assignments a
         JOIN user_courses uc ON uc.courseId = a.course
         LEFT JOIN courses c ON c.id = a.course
         WHERE uc.userId = ?
         ORDER BY a.createdAt DESC`,
        [req.user.id]
      );
    } else {
      [rows] = await pool.execute(
        `SELECT a.*, c.title as courseTitle,
                (SELECT COUNT(*) FROM submissions s WHERE s.assignment = a.id) as submissionCount
         FROM assignments a
         LEFT JOIN courses c ON c.id = a.course
         ORDER BY a.createdAt DESC`
      );
    }

    // Attach student submission if student
    const [mySubs] = await pool.execute('SELECT * FROM submissions WHERE student = ?', [req.user.id]);
    const subMap = new Map(mySubs.map((s) => [s.assignment, s]));

    res.json({
      success: true,
      count: rows.length,
      assignments: rows.map((a) => normalizeAssignment(a, subMap.get(a.id) ? normalizeSubmission(subMap.get(a.id)) : null)),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/assignments ────────────────────────────────────────────────────
router.post('/', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { title, description = '', course, type = 'file_upload', dueDate = null, maxMarks = 100 } = req.body || {};
    if (!title || !course) return fail(res, 400, 'Title and course ID are required');

    const [courses] = await pool.execute('SELECT id, title FROM courses WHERE id = ?', [course]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    const [result] = await pool.execute(
      `INSERT INTO assignments (title, description, course, type, dueDate, maxMarks, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        String(title).trim(),
        String(description).trim(),
        course,
        type,
        dueDate ? new Date(dueDate) : null,
        Number(maxMarks) || 100,
        req.user.id,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT a.*, c.title as courseTitle FROM assignments a LEFT JOIN courses c ON c.id = a.course WHERE a.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: normalizeAssignment(rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/assignments/:id ─────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT a.*, c.title as courseTitle FROM assignments a LEFT JOIN courses c ON c.id = a.course WHERE a.id = ?`,
      [assignmentId]
    );

    if (!rows[0]) return fail(res, 404, 'Assignment not found');

    const [subs] = await pool.execute('SELECT * FROM submissions WHERE assignment = ? AND student = ?', [
      assignmentId,
      req.user.id,
    ]);

    res.json({
      success: true,
      assignment: normalizeAssignment(rows[0], subs[0] ? normalizeSubmission(subs[0]) : null),
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/assignments/:id ─────────────────────────────────────────────────
router.put('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!rows[0]) return fail(res, 404, 'Assignment not found');

    if (!isAdmin(req.user) && String(rows[0].createdBy) !== String(req.user.id)) {
      return fail(res, 403, 'You can only update assignments you created');
    }

    const { title, description, course, type, dueDate, maxMarks } = req.body || {};
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
    if (course !== undefined) {
      sets.push('course = ?');
      params.push(course);
    }
    if (type !== undefined) {
      sets.push('type = ?');
      params.push(type);
    }
    if (dueDate !== undefined) {
      sets.push('dueDate = ?');
      params.push(dueDate ? new Date(dueDate) : null);
    }
    if (maxMarks !== undefined) {
      sets.push('maxMarks = ?');
      params.push(Number(maxMarks) || 100);
    }

    params.push(assignmentId);
    await pool.execute(`UPDATE assignments SET ${sets.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.execute(
      `SELECT a.*, c.title as courseTitle FROM assignments a LEFT JOIN courses c ON c.id = a.course WHERE a.id = ?`,
      [assignmentId]
    );

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: normalizeAssignment(updated[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/assignments/:id ──────────────────────────────────────────────
router.delete('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    if (!rows[0]) return fail(res, 404, 'Assignment not found');

    if (!isAdmin(req.user) && String(rows[0].createdBy) !== String(req.user.id)) {
      return fail(res, 403, 'You can only delete assignments you created');
    }

    await pool.execute('DELETE FROM assignments WHERE id = ?', [assignmentId]);
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/assignments/:id/submit ─────────────────────────────────────────
router.post('/:id/submit', authenticate, (req, res, next) => {
  uploadSubmissionFile.single('file')(req, res, async (err) => {
    if (err) return fail(res, 400, err.message);

    try {
      const assignmentId = req.params.id;
      const [assignments] = await pool.execute('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
      if (!assignments[0]) return fail(res, 404, 'Assignment not found');

      const assignment = assignments[0];

      // Check for existing submission
      const [existing] = await pool.execute('SELECT id FROM submissions WHERE assignment = ? AND student = ?', [
        assignmentId,
        req.user.id,
      ]);
      if (existing.length) {
        return fail(res, 409, 'You have already submitted this assignment');
      }

      let filePath = null;
      let textContent = null;
      let codeContent = null;

      if (assignment.type === 'file_upload') {
        if (!req.file) return fail(res, 400, 'Please attach a file for this submission');
        filePath = `uploads/submissions/${req.file.filename}`;
      } else if (assignment.type === 'case_study') {
        textContent = req.body?.textContent ? String(req.body.textContent).trim() : null;
        if (!textContent) return fail(res, 400, 'Written case study text content is required');
      } else if (assignment.type === 'code') {
        codeContent = req.body?.codeContent ? String(req.body.codeContent).trim() : null;
        if (!codeContent) return fail(res, 400, 'Code snippet is required for this submission');
      }

      const [result] = await pool.execute(
        `INSERT INTO submissions (assignment, student, type, textContent, codeContent, filePath, submittedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [assignmentId, req.user.id, assignment.type, textContent, codeContent, filePath]
      );

      // Track attendance activity
      await pool.execute(
        `INSERT INTO attendances (student, course, activityType, details, createdAt, updatedAt)
         VALUES (?, ?, 'assignment_submit', ?, NOW(), NOW())`,
        [req.user.id, assignment.course, `Submitted assignment: ${assignment.title}`]
      );

      const [subRows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [result.insertId]);

      res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully',
        submission: normalizeSubmission(subRows[0]),
      });
    } catch (error) {
      next(error);
    }
  });
});

// ── GET /api/assignments/:id/submissions ─────────────────────────────────────
router.get('/:id/submissions', authenticate, staffOnly, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT s.*, u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch
       FROM submissions s
       JOIN users u ON u.id = s.student
       WHERE s.assignment = ?
       ORDER BY s.submittedAt DESC`,
      [assignmentId]
    );

    res.json({
      success: true,
      count: rows.length,
      submissions: rows.map((s) => normalizeSubmission(s)),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
