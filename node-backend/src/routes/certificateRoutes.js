import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { authenticate, adminOnly, fail } from '../middleware/auth.js';

const router = express.Router();

function normalizeCert(row) {
  return {
    id: row.id,
    _id: String(row.id),
    certificateId: row.certificateId,
    title: row.title,
    type: row.type || 'completion',
    grade: row.grade || 'A',
    scorePercent: Number(row.scorePercent || 0),
    earnedDate: row.earnedDate || row.createdAt,
    student: {
      id: row.student,
      _id: String(row.student),
      name: row.studentName || '',
      email: row.studentEmail || '',
      college: row.studentCollege || '',
      branch: row.studentBranch || '',
    },
    user: {
      id: row.student,
      _id: String(row.student),
      name: row.studentName || '',
      email: row.studentEmail || '',
      college: row.studentCollege || '',
      branch: row.studentBranch || '',
    },
    course: {
      id: row.course,
      _id: String(row.course),
      title: row.courseTitle || '',
      category: row.courseCategory || '',
      instructor: row.courseInstructor || '',
      level: row.courseLevel || '',
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── GET /api/certificates/my-certificates ────────────────────────────────────
router.get('/my-certificates', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT cert.*, 
              u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch,
              c.title as courseTitle, c.category as courseCategory, c.instructor as courseInstructor, c.level as courseLevel
       FROM certificates cert
       JOIN users u ON u.id = cert.student
       LEFT JOIN courses c ON c.id = cert.course
       WHERE cert.student = ?
       ORDER BY cert.earnedDate DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: rows.length,
      certificates: rows.map((c) => normalizeCert(c)),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/certificates/verify/:certId (Public) ─────────────────────────────
router.get('/verify/:certId', async (req, res, next) => {
  try {
    const certCode = req.params.certId;
    const [rows] = await pool.execute(
      `SELECT cert.*, 
              u.name as studentName, u.college as studentCollege, u.branch as studentBranch,
              c.title as courseTitle, c.category as courseCategory, c.instructor as courseInstructor
       FROM certificates cert
       JOIN users u ON u.id = cert.student
       LEFT JOIN courses c ON c.id = cert.course
       WHERE cert.certificateId = ?`,
      [certCode]
    );

    if (!rows[0]) {
      return fail(res, 404, 'Certificate not found or verification code is invalid');
    }

    const cert = normalizeCert(rows[0]);
    // Protect student privacy on public endpoints (no private email exposure)
    cert.student.email = '';
    cert.user.email = '';

    res.json({
      success: true,
      verified: true,
      certificate: cert,
      message: `Verified: Issued by CRISMATECH Education to ${cert.student.name} for ${cert.course.title}`,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/certificates (Admin) ─────────────────────────────────────────────
router.get('/', authenticate, adminOnly, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT cert.*, 
             u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch,
             c.title as courseTitle, c.category as courseCategory, c.instructor as courseInstructor, c.level as courseLevel
      FROM certificates cert
      JOIN users u ON u.id = cert.student
      LEFT JOIN courses c ON c.id = cert.course
      ORDER BY cert.createdAt DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      certificates: rows.map((c) => normalizeCert(c)),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/certificates (Admin manual issue) ───────────────────────────────
router.post('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { student, course, title, type = 'completion', grade = 'A', scorePercent = 100 } = req.body || {};
    if (!student || !course) return fail(res, 400, 'Student ID and Course ID are required');

    const certUniqueCode = `CRT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const [result] = await pool.execute(
      `INSERT INTO certificates (student, course, title, type, grade, scorePercent, certificateId, earnedDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [student, course, title || 'Certificate of Completion', type, grade, Number(scorePercent) || 0, certUniqueCode]
    );

    const [rows] = await pool.execute(
      `SELECT cert.*, 
              u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch,
              c.title as courseTitle, c.category as courseCategory, c.instructor as courseInstructor, c.level as courseLevel
       FROM certificates cert
       JOIN users u ON u.id = cert.student
       LEFT JOIN courses c ON c.id = cert.course
       WHERE cert.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      certificate: normalizeCert(rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/certificates/:id ────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT cert.*, 
              u.name as studentName, u.email as studentEmail, u.college as studentCollege, u.branch as studentBranch,
              c.title as courseTitle, c.category as courseCategory, c.instructor as courseInstructor, c.level as courseLevel
       FROM certificates cert
       JOIN users u ON u.id = cert.student
       LEFT JOIN courses c ON c.id = cert.course
       WHERE cert.id = ?`,
      [req.params.id]
    );

    if (!rows[0]) return fail(res, 404, 'Certificate not found');
    res.json({ success: true, certificate: normalizeCert(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/certificates/:id ─────────────────────────────────────────────
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM certificates WHERE id = ?', [req.params.id]);
    if (!rows[0]) return fail(res, 404, 'Certificate not found');

    await pool.execute('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Certificate revoked and deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
