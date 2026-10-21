import express from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { fail } from '../middleware/auth.js';
import { sendMail } from '../utils/mailer.js';

const router = express.Router();

function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

// ── POST /api/otp/send ───────────────────────────────────────────────────────
router.post('/send', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return fail(res, 400, 'Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(res, 400, 'Invalid email address format');
    }

    // Check if user already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return fail(res, 409, 'Email is already registered. Please sign in instead.');
    }

    await pool.execute('DELETE FROM otps WHERE email = ?', [email]);

    const code = generateOtpCode();
    await pool.execute(
      `INSERT INTO otps (email, code, attempts, expiresAt, createdAt)
       VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())`,
      [email, code]
    );

    const mailResult = await sendMail({
      to: email,
      subject: 'Your CRISMATECH Verification Code',
      text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2 style="color: #0d9488;">CRISMATECH Education</h2>
          <p>Please enter the following 6-digit verification code to complete your registration:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; color: #0f766e; background: #f0fdfa; padding: 16px; border-radius: 8px; text-align: center; display: inline-block;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'OTP sent to your email',
      ...(mailResult?.simulated ? { devCode: code } : {}),
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/otp/verify ─────────────────────────────────────────────────────
router.post('/verify', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();

    if (!email || !code) return fail(res, 400, 'Email and verification code are required');

    const [rows] = await pool.execute('SELECT id, code, attempts, expiresAt FROM otps WHERE email = ?', [email]);
    const otp = rows[0];

    if (!otp) {
      return fail(res, 400, 'No verification code found for this email. Please request a new code.');
    }

    if (new Date() > new Date(otp.expiresAt)) {
      await pool.execute('DELETE FROM otps WHERE email = ?', [email]);
      return fail(res, 400, 'Verification code has expired. Please request a new one.');
    }

    const newAttempts = Number(otp.attempts) + 1;
    if (newAttempts > 5) {
      await pool.execute('DELETE FROM otps WHERE email = ?', [email]);
      return fail(res, 429, 'Too many incorrect attempts. Please request a new OTP.');
    }

    if (String(otp.code) !== code) {
      await pool.execute('UPDATE otps SET attempts = ? WHERE id = ?', [newAttempts, otp.id]);
      const remaining = 5 - newAttempts;
      return fail(res, 400, `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // Success: Delete OTP so it cannot be reused
    await pool.execute('DELETE FROM otps WHERE email = ?', [email]);

    const secret = process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env';
    const verificationToken = jwt.sign(
      { email, purpose: 'email_verification' },
      secret,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      verificationToken,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
