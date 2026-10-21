import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authenticate, fail, toUser, tokenFor } from '../middleware/auth.js';
import { uploadAadhaarFile } from '../middleware/upload.js';
import { sendMail } from '../utils/mailer.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

// Precomputed bcrypt hash for constant-time comparison against nonexistent accounts
const DUMMY_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoO9yq0wSgT3tN7y0wSgT3tN7y0wSgT3tN';

// Strict rate limiter for login endpoints: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
    });
  },
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, college, branch, semester, phone, emailVerificationToken, verificationToken } = req.body || {};
    if (!name || !email || !password) return fail(res, 400, 'Name, email, and password are required');
    if (String(password).length < 6) return fail(res, 400, 'Password must be at least 6 characters');

    const normalizedEmail = String(email).trim().toLowerCase();

    // Enforce email verification token
    const token = emailVerificationToken || verificationToken;
    let isEmailVerified = 0;

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env';
        const decoded = jwt.verify(token, secret);
        if (decoded.email !== normalizedEmail || decoded.purpose !== 'email_verification') {
          return fail(res, 400, 'Invalid email verification token for this email address');
        }
        isEmailVerified = 1;
      } catch {
        return fail(res, 400, 'Email verification token is invalid or expired. Please verify your email again.');
      }
    } else if (process.env.NODE_ENV === 'production') {
      return fail(res, 400, 'Email verification is required before registration. Please verify your email with OTP.');
    } else {
      isEmailVerified = 1; // Allow dev/demo bypass in development mode
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) return fail(res, 409, 'An account already exists for this email');

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, college, branch, semester, phone, role, approvalStatus, emailVerified, aadhaarVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'student', 'approved', ?, 0, NOW(), NOW())`,
      [
        String(name).trim(),
        normalizedEmail,
        hash,
        college ? String(college).trim() : null,
        branch ? String(branch).trim() : null,
        semester ? Number(semester) : null,
        phone ? String(phone).trim() : null,
        isEmailVerified,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = toUser(rows[0]);
    res.status(201).json({ success: true, token: tokenFor(user), user });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return fail(res, 400, 'Email and password are required');

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
    const account = rows[0];

    // Constant-time hash check prevents email enumeration side-channel timing attacks
    const passwordToCompare = account ? account.password : DUMMY_HASH;
    const match = await bcrypt.compare(password, passwordToCompare);

    if (!account || !match) {
      return fail(res, 401, 'Invalid email or password');
    }

    if (account.approvalStatus === 'rejected' || account.approvalStatus === 'suspended') {
      return fail(res, 403, 'Your account has been deactivated or suspended. Please contact support.');
    }

    if (account.role === 'instructor' && account.approvalStatus !== 'approved') {
      return fail(res, 403, 'Your instructor account is awaiting approval by the administrator');
    }

    const user = toUser(account);
    res.json({ success: true, token: tokenFor(user), user });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/instructor/register ───────────────────────────────────────
router.post('/instructor/register', async (req, res, next) => {
  try {
    const { name, email, password, college, branch, phone } = req.body || {};
    if (!name || !email || !password) return fail(res, 400, 'Name, email, and password are required');
    if (String(password).length < 6) return fail(res, 400, 'Password must be at least 6 characters');

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) return fail(res, 409, 'An account already exists for this email');

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, college, branch, phone, role, approvalStatus, emailVerified, aadhaarVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'instructor', 'pending', 1, 0, NOW(), NOW())`,
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
    const user = toUser(rows[0]);
    res.status(201).json({
      success: true,
      message: 'Instructor account registered. It will be activated once approved by an administrator.',
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/instructor/login ──────────────────────────────────────────
router.post('/instructor/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return fail(res, 400, 'Email and password are required');

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ? AND role IN ('instructor', 'admin')", [
      String(email).trim().toLowerCase(),
    ]);
    const account = rows[0];

    const passwordToCompare = account ? account.password : DUMMY_HASH;
    const match = await bcrypt.compare(password, passwordToCompare);

    if (!account || !match) {
      return fail(res, 401, 'Invalid email or password');
    }

    if (account.approvalStatus === 'rejected' || account.approvalStatus === 'suspended') {
      return fail(res, 403, 'Your account has been deactivated or suspended. Please contact support.');
    }

    if (account.role === 'instructor' && account.approvalStatus !== 'approved') {
      return fail(res, 403, 'Your instructor account is awaiting approval by the administrator');
    }

    const user = toUser(account);
    res.json({ success: true, token: tokenFor(user), user });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── PUT /api/auth/me ─────────────────────────────────────────────────────────
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, college, branch, semester, phone } = req.body || {};
    const sets = ['updatedAt = NOW()'];
    const params = [];

    if (name !== undefined) {
      sets.push('name = ?');
      params.push(String(name).trim());
    }
    if (college !== undefined) {
      sets.push('college = ?');
      params.push(String(college).trim());
    }
    if (branch !== undefined) {
      sets.push('branch = ?');
      params.push(String(branch).trim());
    }
    if (semester !== undefined) {
      sets.push('semester = ?');
      params.push(semester ? Number(semester) : null);
    }
    if (phone !== undefined) {
      sets.push('phone = ?');
      params.push(String(phone).trim());
    }

    params.push(req.user.id);
    await pool.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Profile updated successfully', user: toUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/me/aadhaar ────────────────────────────────────────────────
router.post('/me/aadhaar', authenticate, uploadAadhaarFile.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return fail(res, 400, 'Please select a document or image file to upload');
    }

    const relPath = `uploads/aadhaar/${req.file.filename}`;
    await pool.execute('UPDATE users SET aadhaarCardPath = ?, aadhaarVerified = 0, updatedAt = NOW() WHERE id = ?', [
      relPath,
      req.user.id,
    ]);

    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({
      success: true,
      message: 'Aadhaar document uploaded successfully. Awaiting administrator verification.',
      user: toUser(rows[0]),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/me/enroll/:courseId ───────────────────────────────────────
router.post('/me/enroll/:courseId', authenticate, async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const [courses] = await pool.execute('SELECT id, title FROM courses WHERE id = ?', [courseId]);
    if (!courses[0]) return fail(res, 404, 'Course not found');

    await pool.execute(
      'INSERT IGNORE INTO user_courses (userId, courseId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
      [req.user.id, courseId]
    );

    // Initialize course progress record if not exists
    await pool.execute(
      `INSERT IGNORE INTO course_progress (student, course, completedModules, createdAt, updatedAt)
       VALUES (?, ?, '[]', NOW(), NOW())`,
      [req.user.id, courseId]
    );

    res.status(201).json({ success: true, message: `Successfully enrolled in ${courses[0].title}` });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const [rows] = await pool.execute('SELECT id, email, name FROM users WHERE email = ?', [email]);
    const account = rows[0];

    if (account) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await pool.execute('DELETE FROM password_reset_tokens WHERE userId = ? OR expiresAt < NOW()', [account.id]);
      await pool.execute(
        'INSERT INTO password_reset_tokens (userId, tokenHash, expiresAt, createdAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())',
        [account.id, tokenHash]
      );

      const resetBaseUrl = process.env.RESET_PASSWORD_URL || (process.env.NODE_ENV === 'production' ? 'https://crismatech.com/portal/reset-password' : 'http://localhost:3000/portal/reset-password');
      const cleanResetBaseUrl = resetBaseUrl.replace(/\/$/, '');
      const resetUrl = `${cleanResetBaseUrl}?token=${rawToken}`;

      await sendMail({
        to: account.email,
        subject: 'Reset your CRISMATECH portal password',
        text: `Hello ${account.name},\n\nYou requested a password reset for your CRISMATECH Learning Portal account. Please use the link below within 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px;">
            <h2 style="color: #07241a; font-family: Georgia, serif;">CRISMATECH Education</h2>
            <p>Hello <strong>${account.name}</strong>,</p>
            <p>You requested a password reset for your CRISMATECH Learning Portal account. Please click the button below within 15 minutes to set a new password:</p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #07241a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #07241a; word-break: break-all;">${resetUrl}</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; pt: 12px;">This link will expire in 15 minutes. If you did not make this request, your account is safe and you can ignore this email.</p>
          </div>
        `,
      });
    }

    res.json({ success: true, message: 'If that account exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/auth/reset-password/validate ────────────────────────────────────
router.get('/reset-password/validate', async (req, res, next) => {
  try {
    const token = String(req.query?.token || '').trim();
    if (!token) return fail(res, 400, 'Token is required');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [tokens] = await pool.execute(
      'SELECT id, userId, expiresAt FROM password_reset_tokens WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > NOW()',
      [tokenHash]
    );

    if (!tokens[0]) return fail(res, 400, 'This password reset link is invalid or has expired');

    res.json({ success: true, message: 'Token is valid' });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || String(newPassword).length < 6) {
      return fail(res, 400, 'A valid token and a password of at least 6 characters are required');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [tokens] = await pool.execute(
      'SELECT id, userId FROM password_reset_tokens WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > NOW()',
      [tokenHash]
    );

    if (!tokens[0]) return fail(res, 400, 'This reset link is invalid or has expired');

    const hash = await bcrypt.hash(newPassword, 10);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        'UPDATE users SET password = ?, passwordChangedAt = NOW(), updatedAt = NOW() WHERE id = ?',
        [hash, tokens[0].userId]
      );
      await conn.execute('UPDATE password_reset_tokens SET usedAt = NOW() WHERE id = ?', [tokens[0].id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    next(error);
  }
});

export default router;
