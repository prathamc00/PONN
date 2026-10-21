import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const toUser = (row) => ({
  id: row.id,
  _id: String(row.id),
  name: row.name,
  email: row.email,
  role: row.role,
  approvalStatus: row.approvalStatus,
  college: row.college || '',
  branch: row.branch || '',
  semester: row.semester ?? null,
  phone: row.phone || '',
  emailVerified: Boolean(row.emailVerified),
  aadhaarVerified: Boolean(row.aadhaarVerified),
  aadhaarCardPath: row.aadhaarCardPath || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const tokenFor = (user) => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign({ sub: user.id, id: user.id, role: user.role }, secret, { expiresIn });
};

export const fail = (res, status, message) => res.status(status).json({ success: false, message });

export const isStaff = (user) => user && (user.role === 'admin' || user.role === 'instructor');
export const isAdmin = (user) => user && user.role === 'admin';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return fail(res, 401, 'Authentication required');
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env';
    const payload = jwt.verify(token, secret);
    const userId = payload.sub || payload.id;

    const [rows] = await pool.execute(
      `SELECT id, name, email, role, approvalStatus, college, branch, semester, phone, 
              emailVerified, aadhaarVerified, aadhaarCardPath, passwordChangedAt, createdAt, updatedAt 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!rows[0]) {
      return fail(res, 401, 'Account no longer exists');
    }

    if (rows[0].approvalStatus === 'rejected' || rows[0].approvalStatus === 'suspended') {
      return fail(res, 403, 'Your account has been suspended or deactivated');
    }

    if (rows[0].passwordChangedAt && payload.iat) {
      const changedTime = new Date(rows[0].passwordChangedAt).getTime();
      if (payload.iat * 1000 < changedTime - 1000) {
        return fail(res, 401, 'Password was recently changed. Please sign in again.');
      }
    }

    req.user = toUser(rows[0]);
    next();
  } catch (error) {
    return fail(res, 401, 'Invalid or expired session');
  }
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-replace-in-env';
    const payload = jwt.verify(token, secret);
    const userId = payload.sub || payload.id;

    const [rows] = await pool.execute(
      `SELECT id, name, email, role, approvalStatus, college, branch, semester, phone, 
              emailVerified, aadhaarVerified, aadhaarCardPath, passwordChangedAt, createdAt, updatedAt 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (rows[0]) {
      const isSuspended = rows[0].approvalStatus === 'rejected' || rows[0].approvalStatus === 'suspended';
      const isPasswordOutdated = rows[0].passwordChangedAt && payload.iat && (payload.iat * 1000 < new Date(rows[0].passwordChangedAt).getTime() - 1000);
      req.user = (isSuspended || isPasswordOutdated) ? null : toUser(rows[0]);
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

export function staffOnly(req, res, next) {
  if (!req.user) return fail(res, 401, 'Authentication required');
  if (!isStaff(req.user)) return fail(res, 403, 'Staff access required (instructor or admin)');
  next();
}

export function adminOnly(req, res, next) {
  if (!req.user) return fail(res, 401, 'Authentication required');
  if (!isAdmin(req.user)) return fail(res, 403, 'Administrator access required');
  next();
}
