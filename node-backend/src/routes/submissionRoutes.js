import express from 'express';
import { pool } from '../db.js';
import { authenticate, staffOnly, fail } from '../middleware/auth.js';
import { createNotification } from '../utils/notification.js';

const router = express.Router();

// ── GET /api/submissions (Grading Queue) ──────────────────────────────────────
router.get('/', authenticate, staffOnly, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.*, 
             u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch,
             a.title as assignmentTitle, a.maxMarks, a.type as assignmentType,
             c.title as courseTitle
      FROM submissions s
      JOIN users u ON u.id = s.student
      JOIN assignments a ON a.id = s.assignment
      LEFT JOIN courses c ON c.id = a.course
      ORDER BY s.submittedAt DESC
    `);

    const submissions = rows.map((r) => ({
      id: r.id,
      _id: String(r.id),
      assignment: {
        id: r.assignment,
        _id: String(r.assignment),
        title: r.assignmentTitle,
        maxMarks: Number(r.maxMarks || 100),
        type: r.assignmentType,
        course: { title: r.courseTitle || '' },
      },
      student: {
        id: r.student,
        _id: String(r.student),
        name: r.studentName,
        email: r.studentEmail,
        college: r.studentCollege,
        branch: r.studentBranch,
      },
      type: r.type,
      textContent: r.textContent,
      codeContent: r.codeContent,
      filePath: r.filePath,
      grade: r.grade !== null && r.grade !== undefined ? Number(r.grade) : null,
      feedback: r.feedback,
      submittedAt: r.submittedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/submissions/:id/grade ───────────────────────────────────────────
router.put('/:id/grade', authenticate, staffOnly, async (req, res, next) => {
  try {
    const submissionId = req.params.id;
    const { grade, feedback } = req.body || {};

    if (grade === undefined || grade === null) {
      return fail(res, 400, 'Grade marks are required');
    }

    const [rows] = await pool.execute(
      `SELECT s.*, a.title as assignmentTitle, a.maxMarks 
       FROM submissions s 
       JOIN assignments a ON a.id = s.assignment 
       WHERE s.id = ?`,
      [submissionId]
    );

    if (!rows[0]) return fail(res, 404, 'Submission not found');
    const submission = rows[0];

    const numericGrade = Number(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > Number(submission.maxMarks || 100)) {
      return fail(res, 400, `Grade must be a number between 0 and ${submission.maxMarks || 100}`);
    }

    await pool.execute(
      'UPDATE submissions SET grade = ?, feedback = ?, updatedAt = NOW() WHERE id = ?',
      [numericGrade, feedback ? String(feedback).trim() : null, submissionId]
    );

    await createNotification(
      submission.student,
      'Assignment Graded 📝',
      `Your submission for "${submission.assignmentTitle}" has been graded: ${numericGrade}/${submission.maxMarks}.`,
      'info',
      '/assignments'
    );

    const [updatedRows] = await pool.execute('SELECT * FROM submissions WHERE id = ?', [submissionId]);
    const updated = updatedRows[0];
    updated._id = String(updated.id);

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
