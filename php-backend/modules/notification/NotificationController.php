<?php
/**
 * Notification Controller
 * PHP port of notification.controller.js
 * NOTE: Socket.io real-time push is replaced with REST polling.
 * The frontend polls GET /api/notifications every 10-15 seconds.
 */

// ── createNotificationHelper (called internally by course/test controllers) ────
function createNotificationHelper(int $userId, string $title, string $message, string $type = 'info', ?string $link = null): void {
    try {
        $db = getDb();
        $db->prepare('INSERT INTO notifications (user, title, message, type, link, isRead, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())')
           ->execute([$userId, $title, $message, $type, $link]);
    } catch (Exception $e) {
        // Silently fail — notification failure should not break the main flow
    }
}

// ── getMyNotifications ────────────────────────────────────────────────────────
function getMyNotifications(): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('SELECT * FROM notifications WHERE user = ? ORDER BY createdAt DESC LIMIT 50');
    $stmt->execute([$user['id']]);
    $notifications = $stmt->fetchAll();

    $unreadStmt = $db->prepare('SELECT COUNT(*) FROM notifications WHERE user = ? AND isRead = 0');
    $unreadStmt->execute([$user['id']]);
    $unreadCount = (int) $unreadStmt->fetchColumn();

    jsonResponse(['success' => true, 'notifications' => $notifications, 'unreadCount' => $unreadCount]);
}

// ── markAsRead ────────────────────────────────────────────────────────────────
function markAsRead(int $id): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('SELECT id FROM notifications WHERE id = ? AND user = ?');
    $stmt->execute([$id, $user['id']]);
    if (!$stmt->fetch()) errorResponse('Notification not found', 404);

    $db->prepare('UPDATE notifications SET isRead = 1, updatedAt = NOW() WHERE id = ?')->execute([$id]);

    $row = $db->prepare('SELECT * FROM notifications WHERE id = ?');
    $row->execute([$id]);
    jsonResponse(['success' => true, 'notification' => $row->fetch()]);
}

// ── markAllAsRead ─────────────────────────────────────────────────────────────
function markAllAsRead(): void {
    $user = getAuthUser();
    $db   = getDb();
    $db->prepare('UPDATE notifications SET isRead = 1, updatedAt = NOW() WHERE user = ? AND isRead = 0')->execute([$user['id']]);
    jsonResponse(['success' => true, 'message' => 'All notifications marked as read']);
}
