import { pool } from '../db.js';

export async function createNotification(userId, title, message, type = 'info', link = null) {
  try {
    await pool.execute(
      `INSERT INTO notifications (user, title, message, type, link, isRead, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [userId, title, message, type, link]
    );
  } catch (error) {
    // Non-blocking notification failure
    console.warn('Failed to insert notification:', error.message);
  }
}
