<?php
/**
 * Attendance Controller
 * Full PHP port of modules/attendance/attendance.controller.js
 */

// ── trackActivity ─────────────────────────────────────────────────────────────
function trackActivity(): void {
    $user = getAuthUser();
    $body = getBody();

    $activityType = $body['activityType'] ?? '';
    if (!$activityType) errorResponse('Activity type is required');

    $courseId = isset($body['courseId']) ? (int) $body['courseId'] : null;
    $details  = isset($body['details']) ? trim(substr($body['details'], 0, 500)) : '';

    $db = getDb();
    $db->prepare('INSERT INTO attendances (student, course, activityType, details, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())')
       ->execute([$user['id'], $courseId, $activityType, $details]);

    $recordId = (int) $db->lastInsertId();
    $row      = $db->prepare('SELECT * FROM attendances WHERE id = ?');
    $row->execute([$recordId]);
    jsonResponse(['success' => true, 'message' => 'Activity tracked', 'record' => $row->fetch()], 201);
}

// ── getMyAttendance ───────────────────────────────────────────────────────────
function getMyAttendance(): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('
        SELECT a.*, c.title AS courseTitle
        FROM attendances a
        LEFT JOIN courses c ON c.id = a.course
        WHERE a.student = ?
        ORDER BY a.createdAt DESC
    ');
    $stmt->execute([$user['id']]);
    $records = $stmt->fetchAll();
    jsonResponse(['success' => true, 'count' => count($records), 'records' => $records]);
}

// ── getCourseAttendance ───────────────────────────────────────────────────────
function getCourseAttendance(int $courseId): void {
    $db   = getDb();
    $stmt = $db->prepare('
        SELECT a.*, u.name AS studentName, u.email AS studentEmail, c.title AS courseTitle
        FROM attendances a
        LEFT JOIN users u ON u.id = a.student
        LEFT JOIN courses c ON c.id = a.course
        WHERE a.course = ?
        ORDER BY a.createdAt DESC
    ');
    $stmt->execute([$courseId]);
    $records = $stmt->fetchAll();
    jsonResponse(['success' => true, 'count' => count($records), 'records' => $records]);
}

// ── getAllAttendance ───────────────────────────────────────────────────────────
function getAllAttendance(): void {
    $db   = getDb();
    $stmt = $db->query('
        SELECT a.*, u.name AS studentName, u.email AS studentEmail, c.title AS courseTitle
        FROM attendances a
        LEFT JOIN users u ON u.id = a.student
        LEFT JOIN courses c ON c.id = a.course
        ORDER BY a.createdAt DESC
    ');
    $records = $stmt->fetchAll();
    jsonResponse(['success' => true, 'count' => count($records), 'records' => $records]);
}
