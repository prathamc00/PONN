import express from 'express';
import { pool } from '../db.js';
import { authenticate, staffOnly, adminOnly, fail } from '../middleware/auth.js';

const router = express.Router();

function normalizeAttendance(r) {
  return {
    id: r.id,
    _id: String(r.id),
    activityType: r.activityType,
    details: r.details || '',
    student: {
      id: r.student,
      _id: String(r.student),
      name: r.studentName || '',
      email: r.studentEmail || '',
    },
    course: r.course
      ? {
          id: r.course,
          _id: String(r.course),
          title: r.courseTitle || '',
        }
      : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ── POST /api/attendance ─────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { activityType, courseId = null, details = '' } = req.body || {};
    if (!activityType) return fail(res, 400, 'Activity type is required');

    const [result] = await pool.execute(
      `INSERT INTO attendances (student, course, activityType, details, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [req.user.id, courseId ? Number(courseId) : null, String(activityType).trim(), String(details).trim()]
    );

    const [rows] = await pool.execute('SELECT * FROM attendances WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Activity recorded successfully',
      record: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/attendance/my ───────────────────────────────────────────────────
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as studentName, u.email as studentEmail, c.title as courseTitle
       FROM attendances a
       JOIN users u ON u.id = a.student
       LEFT JOIN courses c ON c.id = a.course
       WHERE a.student = ?
       ORDER BY a.createdAt DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: rows.length,
      records: rows.map((r) => normalizeAttendance(r)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/attendance/course/:courseId ─────────────────────────────────────
router.get('/course/:courseId', authenticate, staffOnly, async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const [rows] = await pool.execute(
      `SELECT a.*, u.name as studentName, u.email as studentEmail, c.title as courseTitle
       FROM attendances a
       JOIN users u ON u.id = a.student
       LEFT JOIN courses c ON c.id = a.course
       WHERE a.course = ?
       ORDER BY a.createdAt DESC`,
      [courseId]
    );

    res.json({
      success: true,
      count: rows.length,
      records: rows.map((r) => normalizeAttendance(r)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/attendance (Admin all activities) ────────────────────────────────
router.get('/', authenticate, adminOnly, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.*, u.name as studentName, u.email as studentEmail, c.title as courseTitle
      FROM attendances a
      JOIN users u ON u.id = a.student
      LEFT JOIN courses c ON c.id = a.course
      ORDER BY a.createdAt DESC
      LIMIT 200
    `);

    res.json({
      success: true,
      count: rows.length,
      records: rows.map((r) => normalizeAttendance(r)),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
