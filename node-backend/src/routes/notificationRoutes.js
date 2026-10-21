import express from 'express';
import { pool } from '../db.js';
import { authenticate, fail } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE user = ? ORDER BY createdAt DESC LIMIT 50',
      [req.user.id]
    );

    const [unreadRows] = await pool.execute(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user = ? AND isRead = 0',
      [req.user.id]
    );

    const formatted = notifications.map((n) => ({
      id: n.id,
      _id: String(n.id),
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    res.json({
      success: true,
      notifications: formatted,
      unreadCount: Number(unreadRows[0]?.unreadCount || 0),
    });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notifId = req.params.id;
    const [rows] = await pool.execute('SELECT id FROM notifications WHERE id = ? AND user = ?', [
      notifId,
      req.user.id,
    ]);

    if (!rows[0]) return fail(res, 404, 'Notification not found');

    await pool.execute('UPDATE notifications SET isRead = 1, updatedAt = NOW() WHERE id = ?', [notifId]);
    const [updated] = await pool.execute('SELECT * FROM notifications WHERE id = ?', [notifId]);

    const n = updated[0];
    n._id = String(n.id);
    n.isRead = Boolean(n.isRead);

    res.json({ success: true, notification: n });
  } catch (error) {
    next(error);
  }
});

// ── PUT /api/notifications/read-all ──────────────────────────────────────────
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.execute('UPDATE notifications SET isRead = 1, updatedAt = NOW() WHERE user = ? AND isRead = 0', [
      req.user.id,
    ]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
