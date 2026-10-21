import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { authenticate, adminOnly, fail, toUser } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/users ───────────────────────────────────────────────────────────
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 100);
    const offset = (page - 1) * limit;

    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = countRows[0]?.total || 0;

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.college, u.branch, u.semester, u.phone, 
              u.role, u.approvalStatus, u.aadhaarVerified, u.aadhaarCardPath, u.createdAt,
              (SELECT GROUP_CONCAT(uc.courseId) FROM user_courses uc WHERE uc.userId = u.id) AS enrolledCourseIds
       FROM users u
       ORDER BY u.createdAt DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const formattedUsers = users.map((u) => {
      const idsCsv = String(u.enrolledCourseIds || '').trim();
      const enrolledCourses = idsCsv ? idsCsv.split(',').filter(Boolean) : [];
      return {
        id: u.id,
        _id: String(u.id),
        name: u.name,
        email: u.email,
        college: u.college || '',
        branch: u.branch || '',
        semester: u.semester ?? null,
        phone: u.phone || '',
        role: u.role,
        approvalStatus: u.approvalStatus,
        aadhaarVerified: Boolean(u.aadhaarVerified),
        aadhaarCardPath: u.aadhaarCardPath || null,
        enrolledCourses,
        createdAt: u.createdAt,
      };
    });

    res.json({
      success: true,
      count: total,
      page,
      limit,
      users: formattedUsers,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/users/instructor ───────────────────────────────────────────────
router.post('/instructor', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, email, password, college, branch, phone } = req.body || {};
    if (!name || !email || !password) return fail(res, 400, 'Name, email, and password are required');

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) return fail(res, 409, 'An account already exists for this email');

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, college, branch, phone, role, approvalStatus, emailVerified, aadhaarVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'instructor', 'approved', 1, 0, NOW(), NOW())`,
      [
        String(name).trim(),
        normalizedEmail,
        hash,
        college ? String(college).trim() : null,
        branch ? String(branch).trim() : null,
        phone ? String(phone).trim() : null,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      user: toUser(rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/users/bulk-import ──────────────────────────────────────────────
router.post('/bulk-import', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { students = [], courseId = null } = req.body || {};
    if (!Array.isArray(students) || !students.length) {
      return fail(res, 400, 'A non-empty list of student records is required.');
    }

    let insertedCount = 0;
    let enrolledCount = 0;
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const name = String(s.name || '').trim();
      const email = String(s.email || '').trim().toLowerCase();
      const college = String(s.college || '').trim() || 'CRISMATECH Academy';
      const branch = String(s.branch || '').trim() || 'Computer Science';
      const phone = String(s.phone || '').trim() || null;
      const rawPassword = String(s.password || '').trim() || 'Crismatech@2026';

      if (!name || !email || !email.includes('@')) {
        errors.push(`Row ${i + 1}: Invalid name or email address.`);
        continue;
      }

      try {
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        let userId;

        if (existing.length) {
          userId = existing[0].id;
        } else {
          const hash = await bcrypt.hash(rawPassword, 10);
          const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, college, branch, phone, role, approvalStatus, emailVerified, aadhaarVerified, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 'student', 'approved', 1, 0, NOW(), NOW())`,
            [name, email, hash, college, branch, phone]
          );
          userId = result.insertId;
          insertedCount++;
        }

        if (courseId && userId) {
          const [enrRes] = await pool.execute(
            'INSERT IGNORE INTO user_courses (userId, courseId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
            [userId, courseId]
          );
          if (enrRes.affectedRows > 0) {
            enrolledCount++;
          }
        }
      } catch (rowErr) {
        errors.push(`Row ${i + 1} (${email}): ${rowErr.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${students.length} student records (${insertedCount} new accounts created, ${enrolledCount} enrolled in course).`,
      insertedCount,
      enrolledCount,
      totalProcessed: students.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!rows[0]) return fail(res, 404, 'User not found');

    if (String(rows[0].id) === String(req.user.id)) {
      return fail(res, 400, 'You cannot delete your own account');
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/users/:id/approval ──────────────────────────────────────────────
router.put('/:id/approval', authenticate, adminOnly, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { approvalStatus } = req.body || {};

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return fail(res, 400, 'Invalid approval status. Must be approved, rejected, or pending.');
    }

    const [rows] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!rows[0]) return fail(res, 404, 'User not found');
    if (rows[0].role !== 'instructor') return fail(res, 400, 'Only instructor accounts have approval status');

    await pool.execute('UPDATE users SET approvalStatus = ?, updatedAt = NOW() WHERE id = ?', [
      approvalStatus,
      userId,
    ]);

    const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({
      success: true,
      message: `Instructor ${approvalStatus} successfully`,
      user: toUser(updated[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/users/:id/aadhaar-verify ─────────────────────────────────────────
router.put('/:id/aadhaar-verify', authenticate, adminOnly, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const aadhaarVerified = req.body?.aadhaarVerified !== undefined ? Number(req.body.aadhaarVerified) : 1;

    const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (!rows[0]) return fail(res, 404, 'User not found');

    await pool.execute('UPDATE users SET aadhaarVerified = ?, updatedAt = NOW() WHERE id = ?', [
      aadhaarVerified,
      userId,
    ]);

    const [updated] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({
      success: true,
      message: aadhaarVerified ? 'Aadhaar document verified successfully' : 'Aadhaar verification status revoked',
      user: toUser(updated[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/users/:id/quiz-attempts/reset ──────────────────────────────────
router.post('/:id/quiz-attempts/reset', authenticate, adminOnly, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { quizId } = req.body || {};

    if (quizId) {
      await pool.execute('DELETE FROM quiz_attempts WHERE student = ? AND quiz = ?', [userId, quizId]);
    } else {
      await pool.execute('DELETE FROM quiz_attempts WHERE student = ?', [userId]);
    }

    res.json({ success: true, message: 'Quiz attempts reset successfully for student' });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/users/export/csv ────────────────────────────────────────────────
router.get('/export/csv', authenticate, adminOnly, async (_req, res, next) => {
  try {
    const [users] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.college, u.branch, u.semester, u.phone, 
             u.approvalStatus, u.aadhaarVerified, u.createdAt
      FROM users u
      ORDER BY u.createdAt DESC
    `);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');

    const headers = ['ID', 'Name', 'Email', 'Role', 'College', 'Branch', 'Semester', 'Phone', 'Approval', 'Aadhaar Verified', 'Joined Date'];
    let csv = headers.join(',') + '\n';

    // Neutralize spreadsheet formula injection characters (=, +, -, @, \t, \r)
    const sanitizeCsvCell = (val) => {
      let str = String(val ?? '');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    users.forEach((u) => {
      const row = [
        u.id,
        sanitizeCsvCell(u.name),
        sanitizeCsvCell(u.email),
        u.role,
        sanitizeCsvCell(u.college),
        sanitizeCsvCell(u.branch),
        u.semester ?? '',
        sanitizeCsvCell(u.phone),
        u.approvalStatus,
        u.aadhaarVerified ? 'Yes' : 'No',
        u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      ];
      csv += row.join(',') + '\n';
    });

    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
