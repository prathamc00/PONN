import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { authenticate, staffOnly, adminOnly, fail, isAdmin, isStaff } from '../middleware/auth.js';
import { createNotification } from '../utils/notification.js';

const router = express.Router();

function getCertGrade(percent) {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B+';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  return 'D';
}

function parseQuestions(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val) || [];
  } catch {
    return [];
  }
}

function normalizeTest(row, sanitizeQuestions = true) {
  const allQuestions = parseQuestions(row.questions);
  const questions = sanitizeQuestions
    ? allQuestions.map((q) => ({
        question: q.question,
        options: q.options || [],
      }))
    : allQuestions;

  return {
    id: row.id,
    _id: String(row.id),
    title: row.title,
    course: {
      id: row.course,
      _id: String(row.course),
      title: row.courseTitle || '',
    },
    Course: {
      title: row.courseTitle || '',
    },
    questions,
    totalQuestions: Number(row.totalQuestions || allQuestions.length),
    durationMinutes: Number(row.durationMinutes || 30),
    startTime: row.startTime,
    endTime: row.endTime,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── GET /api/tests/manage ────────────────────────────────────────────────────
router.get('/manage', authenticate, staffOnly, async (req, res, next) => {
  try {
    let query = `
      SELECT t.*, c.title as courseTitle 
      FROM tests t 
      LEFT JOIN courses c ON c.id = t.course 
      ORDER BY t.startTime DESC
    `;
    let params = [];

    if (!isAdmin(req.user)) {
      query = `
        SELECT t.*, c.title as courseTitle 
        FROM tests t 
        LEFT JOIN courses c ON c.id = t.course 
        WHERE t.createdBy = ?
        ORDER BY t.startTime DESC
      `;
      params = [req.user.id];
    }

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      count: rows.length,
      tests: rows.map((t) => normalizeTest(t, false)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tests/my-attempts ───────────────────────────────────────────────
router.get('/my-attempts', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT qa.*, t.title as quizTitle, t.course, c.title as courseTitle
       FROM quiz_attempts qa
       JOIN tests t ON t.id = qa.quiz
       LEFT JOIN courses c ON c.id = t.course
       WHERE qa.student = ?
       ORDER BY qa.startedAt DESC`,
      [req.user.id]
    );

    const attempts = rows.map((r) => ({
      id: r.id,
      _id: String(r.id),
      quiz: {
        id: r.quiz,
        _id: String(r.quiz),
        title: r.quizTitle,
        course: {
          id: r.course,
          _id: String(r.course),
          title: r.courseTitle || '',
        },
      },
      score: r.score !== null ? Number(r.score) : null,
      totalMarks: r.totalMarks !== null ? Number(r.totalMarks) : null,
      percentage: r.totalMarks > 0 ? Math.round((Number(r.score) / Number(r.totalMarks)) * 100) : 0,
      passed: r.totalMarks > 0 ? Math.round((Number(r.score) / Number(r.totalMarks)) * 100) >= 40 : false,
      quizId: r.quiz,
      tabSwitchCount: Number(r.tabSwitchCount || 0),
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tests ───────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT t.*, c.title as courseTitle 
      FROM tests t 
      LEFT JOIN courses c ON c.id = t.course 
      ORDER BY t.startTime DESC
    `);

    const sanitize = !isStaff(req.user);
    res.json({
      success: true,
      count: rows.length,
      tests: rows.map((t) => normalizeTest(t, sanitize)),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/tests ──────────────────────────────────────────────────────────
router.post('/', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { title, course, courseId, questions = [], durationMinutes = 30, startTime = null, endTime = null } = req.body || {};
    const targetCourse = course || courseId;
    if (!title || !targetCourse) return fail(res, 400, 'Quiz title and course ID are required');

    const [courses] = await pool.execute('SELECT id FROM courses WHERE id = ?', [targetCourse]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    const parsedQuestions = Array.isArray(questions) ? questions : [];

    const [result] = await pool.execute(
      `INSERT INTO tests (title, course, questions, totalQuestions, durationMinutes, startTime, endTime, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        String(title).trim(),
        targetCourse,
        JSON.stringify(parsedQuestions),
        parsedQuestions.length,
        Number(durationMinutes) || 30,
        startTime ? new Date(startTime) : null,
        endTime ? new Date(endTime) : null,
        req.user.id,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT t.*, c.title as courseTitle FROM tests t LEFT JOIN courses c ON c.id = t.course WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      test: normalizeTest(rows[0], false),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tests/:id ───────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT t.*, c.title as courseTitle FROM tests t LEFT JOIN courses c ON c.id = t.course WHERE t.id = ?`,
      [testId]
    );

    if (!rows[0]) return fail(res, 404, 'Quiz not found');

    const sanitize = !isStaff(req.user);
    res.json({ success: true, test: normalizeTest(rows[0], sanitize) });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/tests/:id ───────────────────────────────────────────────────────
router.put('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM tests WHERE id = ?', [testId]);
    if (!rows[0]) return fail(res, 404, 'Quiz not found');

    if (!isAdmin(req.user) && String(rows[0].createdBy) !== String(req.user.id)) {
      return fail(res, 403, 'You can only update quizzes you created');
    }

    const { title, course, courseId, questions, durationMinutes, startTime, endTime } = req.body || {};
    const targetCourse = course !== undefined ? course : courseId;
    const sets = ['updatedAt = NOW()'];
    const params = [];

    if (title !== undefined) {
      sets.push('title = ?');
      params.push(String(title).trim());
    }
    if (targetCourse !== undefined) {
      sets.push('course = ?');
      params.push(targetCourse);
    }
    if (questions !== undefined && Array.isArray(questions)) {
      sets.push('questions = ?');
      params.push(JSON.stringify(questions));
      sets.push('totalQuestions = ?');
      params.push(questions.length);
    }
    if (durationMinutes !== undefined) {
      sets.push('durationMinutes = ?');
      params.push(Number(durationMinutes) || 30);
    }
    if (startTime !== undefined) {
      sets.push('startTime = ?');
      params.push(startTime ? new Date(startTime) : null);
    }
    if (endTime !== undefined) {
      sets.push('endTime = ?');
      params.push(endTime ? new Date(endTime) : null);
    }

    params.push(testId);
    await pool.execute(`UPDATE tests SET ${sets.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.execute(
      `SELECT t.*, c.title as courseTitle FROM tests t LEFT JOIN courses c ON c.id = t.course WHERE t.id = ?`,
      [testId]
    );

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      test: normalizeTest(updated[0], false),
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/tests/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM tests WHERE id = ?', [testId]);
    if (!rows[0]) return fail(res, 404, 'Quiz not found');

    if (!isAdmin(req.user) && String(rows[0].createdBy) !== String(req.user.id)) {
      return fail(res, 403, 'You can only delete quizzes you created');
    }

    await pool.execute('DELETE FROM quiz_attempts WHERE quiz = ?', [testId]);
    await pool.execute('DELETE FROM tests WHERE id = ?', [testId]);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/tests/:id/start ────────────────────────────────────────────────
router.post('/:id/start', authenticate, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT t.*, c.title as courseTitle, c.modules 
       FROM tests t 
       LEFT JOIN courses c ON c.id = t.course 
       WHERE t.id = ?`,
      [testId]
    );

    if (!rows[0]) return fail(res, 404, 'Quiz not found');
    const test = rows[0];

    const now = new Date();
    if (test.startTime && now < new Date(test.startTime)) {
      return fail(res, 403, `This quiz is scheduled to open on ${new Date(test.startTime).toLocaleString()}`);
    }
    if (test.endTime && now > new Date(test.endTime)) {
      return fail(res, 403, 'This quiz has expired and is no longer available');
    }

    // Auto-enroll if not enrolled
    const courseId = test.course;
    if (courseId) {
      const [enrolled] = await pool.execute('SELECT 1 FROM user_courses WHERE userId = ? AND courseId = ?', [
        req.user.id,
        courseId,
      ]);
      if (!enrolled.length) {
        await pool.execute('INSERT IGNORE INTO user_courses (userId, courseId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [
          req.user.id,
          courseId,
        ]);
      }
    }

    // Check for existing active (unsubmitted) attempt
    const [existing] = await pool.execute(
      'SELECT * FROM quiz_attempts WHERE quiz = ? AND student = ? AND completedAt IS NULL ORDER BY startedAt DESC LIMIT 1',
      [testId, req.user.id]
    );

    let attemptId;
    if (existing[0]) {
      attemptId = existing[0].id;
    } else {
      const [result] = await pool.execute(
        `INSERT INTO quiz_attempts (quiz, student, startedAt, createdAt, updatedAt)
         VALUES (?, ?, NOW(), NOW(), NOW())`,
        [testId, req.user.id]
      );
      attemptId = result.insertId;
    }

    const allQuestions = parseQuestions(test.questions);
    const questions = allQuestions.map((q, index) => ({
      index,
      question: q.question,
      options: q.options || [],
      points: Number(q.points || 1),
    }));

    res.json({
      success: true,
      message: 'Quiz session started',
      attemptId,
      startedAt: new Date().toISOString(),
      quizTitle: test.title,
      courseName: test.courseTitle || '',
      durationMinutes: Number(test.durationMinutes || 30),
      passingScore: 40,
      totalQuestions: questions.length,
      endTime: test.endTime,
      questions,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tests/:id/my-result ─────────────────────────────────────────────
router.get('/:id/my-result', authenticate, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT t.*, c.title as courseTitle 
       FROM tests t 
       LEFT JOIN courses c ON c.id = t.course 
       WHERE t.id = ?`,
      [testId]
    );
    if (!rows[0]) return fail(res, 404, 'Quiz not found');
    const test = rows[0];

    const [attempts] = await pool.execute(
      `SELECT * FROM quiz_attempts 
       WHERE quiz = ? AND student = ? AND completedAt IS NOT NULL 
       ORDER BY completedAt DESC, startedAt DESC LIMIT 1`,
      [testId, req.user.id]
    );

    if (!attempts[0]) {
      return fail(res, 404, 'No completed attempt found for this quiz.');
    }

    const attempt = attempts[0];
    const questions = parseQuestions(test.questions);
    let userAnswers = [];
    try {
      userAnswers = JSON.parse(attempt.answers) || [];
    } catch {
      userAnswers = [];
    }

    const answersMap = {};
    if (Array.isArray(userAnswers)) {
      userAnswers.forEach((ans) => {
        const idx = ans.questionIndex ?? ans.index;
        if (idx !== undefined) {
          answersMap[idx] = ans.selectedAnswer;
        }
      });
    } else if (typeof userAnswers === 'object' && userAnswers !== null) {
      Object.entries(userAnswers).forEach(([k, v]) => {
        answersMap[Number(k)] = v;
      });
    }

    const questionReview = questions.map((q, idx) => {
      const selected = answersMap[idx] !== undefined ? answersMap[idx] : null;
      const isCorrect = selected !== null && String(selected).trim() === String(q.correctAnswer).trim();
      return {
        index: idx,
        question: q.question,
        options: q.options || [],
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
      };
    });

    const percentage = attempt.totalMarks > 0 ? Math.round((Number(attempt.score) / Number(attempt.totalMarks)) * 100) : 0;
    const passed = percentage >= 40;

    const [certs] = await pool.execute(
      "SELECT * FROM certificates WHERE student = ? AND course = ? AND type = 'quiz_pass'",
      [req.user.id, test.course]
    );

    res.json({
      success: true,
      test: {
        id: test.id,
        _id: String(test.id),
        title: test.title,
        courseTitle: test.courseTitle || '',
        durationMinutes: Number(test.durationMinutes || 30),
        passingScore: 40,
        totalQuestions: questions.length,
      },
      score: Number(attempt.score || 0),
      totalMarks: Number(attempt.totalMarks || questions.length),
      percentage,
      passed,
      tabSwitchCount: Number(attempt.tabSwitchCount || 0),
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      certificate: certs[0] ? {
        id: certs[0].id,
        certificateId: certs[0].certificateId,
        grade: certs[0].grade,
        earnedDate: certs[0].earnedDate,
      } : null,
      questionReview,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/tests/:id/submit ───────────────────────────────────────────────
router.post('/:id/submit', authenticate, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT t.*, c.title as courseTitle 
       FROM tests t 
       LEFT JOIN courses c ON c.id = t.course 
       WHERE t.id = ?`,
      [testId]
    );

    if (!rows[0]) return fail(res, 404, 'Quiz not found');
    const test = rows[0];

    const [attempts] = await pool.execute(
      'SELECT * FROM quiz_attempts WHERE quiz = ? AND student = ? ORDER BY startedAt DESC LIMIT 1',
      [testId, req.user.id]
    );

    let attemptId;
    if (!attempts[0]) {
      // If student direct submitted or started on the fly, create attempt record
      const [resIns] = await pool.execute(
        `INSERT INTO quiz_attempts (quiz, student, startedAt, createdAt, updatedAt)
         VALUES (?, ?, NOW(), NOW(), NOW())`,
        [testId, req.user.id]
      );
      attemptId = resIns.insertId;
    } else {
      attemptId = attempts[0].id;
      if (attempts[0].completedAt) {
        return fail(res, 409, 'Quiz has already been submitted');
      }
    }

    const { answers = {}, tabSwitchCount = 0, tabSwitches = 0, violations = 0 } = req.body || {};
    const violationsLogged = Number(tabSwitchCount || tabSwitches || violations || 0);

    const questions = parseQuestions(test.questions);
    const totalMarks = questions.length;
    let score = 0;

    // Normalize answers format (supports both key-value map and array of objects)
    const answersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        const qIndex = Number(ans.questionIndex ?? ans.index);
        answersMap[qIndex] = ans.selectedAnswer;
      });
    } else if (typeof answers === 'object' && answers !== null) {
      Object.entries(answers).forEach(([k, v]) => {
        answersMap[Number(k)] = v;
      });
    }

    const questionReview = questions.map((q, idx) => {
      const selected = answersMap[idx] !== undefined ? answersMap[idx] : null;
      let isCorrect = false;
      if (selected !== null && q.correctAnswer !== undefined) {
        if (String(selected).trim() === String(q.correctAnswer).trim()) {
          isCorrect = true;
          score += 1;
        }
      }
      return {
        index: idx,
        question: q.question,
        options: q.options || [],
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
      };
    });

    await pool.execute(
      `UPDATE quiz_attempts 
       SET answers = ?, score = ?, totalMarks = ?, tabSwitchCount = ?, completedAt = NOW(), updatedAt = NOW()
       WHERE id = ?`,
      [JSON.stringify(answers), score, totalMarks, violationsLogged, attemptId]
    );

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const passed = percentage >= 40;
    let certificate = null;

    if (passed && test.course) {
      const certGrade = getCertGrade(percentage);
      const certUniqueCode = `CRT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const certTitle = `${test.courseTitle || test.title} — Quiz Completion`;

      const [existingCert] = await pool.execute(
        "SELECT * FROM certificates WHERE student = ? AND course = ? AND type = 'quiz_pass'",
        [req.user.id, test.course]
      );

      if (existingCert[0]) {
        certificate = {
          id: existingCert[0].id,
          _id: String(existingCert[0].id),
          certificateId: existingCert[0].certificateId,
          grade: existingCert[0].grade,
        };
      } else {
        const [certRes] = await pool.execute(
          `INSERT INTO certificates (student, course, title, type, grade, scorePercent, certificateId, earnedDate, createdAt, updatedAt)
           VALUES (?, ?, ?, 'quiz_pass', ?, ?, ?, NOW(), NOW(), NOW())`,
          [req.user.id, test.course, certTitle, certGrade, percentage, certUniqueCode]
        );

        certificate = {
          id: certRes.insertId,
          _id: String(certRes.insertId),
          certificateId: certUniqueCode,
          grade: certGrade,
        };

        await createNotification(
          req.user.id,
          'Certificate Earned',
          `Congratulations! You passed the assessment for "${test.title}" with ${percentage}%. Your certificate (Grade ${certGrade}) is now available in your portal.`,
          'success',
          '/certificate'
        );
      }
    }

    if (test.course) {
      await pool.execute(
        `INSERT INTO attendances (student, course, activityType, details, createdAt, updatedAt)
         VALUES (?, ?, 'quiz_attempt', ?, NOW(), NOW())`,
        [req.user.id, test.course, `Completed quiz: ${test.title} (Score: ${score}/${totalMarks}, ${percentage}%)`]
      );
    }

    res.json({
      success: true,
      message: 'Quiz submitted successfully',
      score,
      totalMarks,
      percentage,
      passed,
      tabSwitchCount: violationsLogged,
      certificate,
      questionReview,
      test: {
        id: test.id,
        _id: String(test.id),
        title: test.title,
        courseTitle: test.courseTitle || '',
        passingScore: 40,
        totalQuestions: questions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/tests/:id/retake ───────────────────────────────────────────────
router.post('/:id/retake', authenticate, async (req, res, next) => {
  try {
    const testId = req.params.id;
    await pool.execute('DELETE FROM quiz_attempts WHERE quiz = ? AND student = ?', [testId, req.user.id]);
    res.json({ success: true, message: 'Previous attempt cleared. You may now retake the quiz.' });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/tests/:id/results ───────────────────────────────────────────────
router.get('/:id/results', authenticate, staffOnly, async (req, res, next) => {
  try {
    const testId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT qa.*, 
              u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch
       FROM quiz_attempts qa
       JOIN users u ON u.id = qa.student
       WHERE qa.quiz = ?
       ORDER BY qa.startedAt DESC`,
      [testId]
    );

    const results = rows.map((r) => ({
      id: r.id,
      _id: String(r.id),
      student: {
        id: r.student,
        _id: String(r.student),
        name: r.studentName,
        email: r.studentEmail,
        college: r.studentCollege,
        branch: r.studentBranch,
      },
      score: r.score !== null ? Number(r.score) : null,
      totalMarks: r.totalMarks !== null ? Number(r.totalMarks) : null,
      percentage: r.totalMarks > 0 ? Math.round((Number(r.score) / Number(r.totalMarks)) * 100) : 0,
      tabSwitchCount: Number(r.tabSwitchCount || 0),
      startedAt: r.startedAt,
      completedAt: r.completedAt,
    }));

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/quiz-attempts (Admin all attempts) ──────────────────────────────
export async function getAllAttemptsHandler(_req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT qa.*, 
             u.name as studentName, u.email as studentEmail,
             t.title as testTitle, t.totalQuestions,
             c.id as courseId, c.title as courseTitle
      FROM quiz_attempts qa
      JOIN tests t ON t.id = qa.quiz
      LEFT JOIN users u ON u.id = qa.student
      LEFT JOIN courses c ON c.id = t.course
      ORDER BY qa.completedAt DESC, qa.startedAt DESC
    `);

    const attempts = rows.map((a) => {
      let answers = [];
      try {
        answers = JSON.parse(a.answers) || [];
      } catch {
        answers = [];
      }
      const percentage = a.totalMarks > 0 ? Math.round((Number(a.score) / Number(a.totalMarks)) * 100) : 0;
      return {
        id: a.id,
        _id: String(a.id),
        score: a.score !== null ? Number(a.score) : null,
        totalMarks: a.totalMarks !== null ? Number(a.totalMarks) : null,
        percentage,
        passed: percentage >= 40,
        tabSwitchCount: Number(a.tabSwitchCount || 0),
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        student: {
          id: a.student,
          _id: String(a.student || ''),
          name: a.studentName || '',
          email: a.studentEmail || '',
        },
        quiz: {
          id: a.quiz,
          _id: String(a.quiz || ''),
          title: a.testTitle || '',
          totalQuestions: Number(a.totalQuestions || 0),
          course: {
            id: a.courseId,
            _id: String(a.courseId || ''),
            title: a.courseTitle || '',
          },
        },
      };
    });

    res.json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    next(error);
  }
}

export default router;
