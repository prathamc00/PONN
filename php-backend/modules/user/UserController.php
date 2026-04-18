<?php
/**
 * User Controller
 * Full PHP port of modules/user/user.controller.js
 */

// ── getUsers ──────────────────────────────────────────────────────────────────
function getUsers(): void {
    $page   = max(1, (int) query('page', 1));
    $limit  = min(100, (int) query('limit', 100));
    $offset = ($page - 1) * $limit;
    $db     = getDb();

    $count = $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $stmt  = $db->prepare('
        SELECT 
            u.id,
            u.name,
            u.email,
            u.college,
            u.branch,
            u.semester,
            u.phone,
            u.role,
            u.approvalStatus,
            u.aadhaarVerified,
            u.aadhaarCardPath,
            u.createdAt,
            (
                SELECT GROUP_CONCAT(uc.courseId)
                FROM user_courses uc
                WHERE uc.userId = u.id
            ) AS enrolledCourseIds
        FROM users u
        ORDER BY u.createdAt DESC
        LIMIT ? OFFSET ?
    ');
    $stmt->execute([$limit, $offset]);
    $users = $stmt->fetchAll();
    foreach ($users as &$u) {
        $u['_id'] = (string) $u['id'];
        $csv = trim((string)($u['enrolledCourseIds'] ?? ''));
        $u['enrolledCourses'] = $csv !== ''
            ? array_map('strval', array_filter(explode(',', $csv), fn($id) => $id !== ''))
            : [];
        unset($u['enrolledCourseIds']);
    }
    unset($u);

    jsonResponse(['success' => true, 'count' => (int) $count, 'page' => $page, 'limit' => $limit, 'users' => $users]);
}

// ── deleteUser ────────────────────────────────────────────────────────────────
function deleteUser(int $id): void {
    $db   = getDb();
    $stmt = $db->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) errorResponse('User not found', 404);

    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'User deleted successfully']);
}

// ── updateInstructorStatus ────────────────────────────────────────────────────
function updateInstructorStatus(int $id): void {
    $body           = getBody();
    $approvalStatus = $body['approvalStatus'] ?? '';

    if (!in_array($approvalStatus, ['approved', 'rejected', 'pending'], true)) {
        errorResponse('Invalid approval status');
    }

    $db   = getDb();
    $stmt = $db->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) errorResponse('User not found', 404);
    if ($user['role'] !== 'instructor') errorResponse('Only instructor accounts can be approved or rejected');

    $db->prepare('UPDATE users SET approvalStatus = ?, updatedAt = NOW() WHERE id = ?')->execute([$approvalStatus, $id]);

    $updated = loadUserById($id);
    jsonResponse(['success' => true, 'message' => "Instructor {$approvalStatus} successfully", 'user' => $updated]);
}

// ── exportUsersCSV ────────────────────────────────────────────────────────────
function exportUsersCSV(): void {
    $db   = getDb();
    $stmt = $db->query('SELECT name, email, role, college, branch, semester, phone, approvalStatus, createdAt FROM users ORDER BY createdAt DESC');
    $users = $stmt->fetchAll();

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename=users_export.csv');
    http_response_code(200);

    $out = fopen('php://output', 'w');
    fputcsv($out, ['Name', 'Email', 'Role', 'College', 'Branch', 'Semester', 'Phone', 'Status', 'Joined Date']);
    foreach ($users as $u) {
        fputcsv($out, [
            $u['name'] ?? '',
            $u['email'] ?? '',
            $u['role'] ?? '',
            $u['college'] ?? '',
            $u['branch'] ?? '',
            $u['semester'] ?? '',
            $u['phone'] ?? '',
            $u['approvalStatus'] ?? '',
            $u['createdAt'] ? (new DateTime($u['createdAt']))->format('Y-m-d') : '',
        ]);
    }
    fclose($out);
    exit;
}

// ── verifyAadhaar ─────────────────────────────────────────────────────────────
function verifyAadhaar(int $id): void {
    $body = getBody();
    $db   = getDb();

    $stmt = $db->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) errorResponse('User not found', 404);

    $aadhaarVerified = isset($body['aadhaarVerified']) ? (int) $body['aadhaarVerified'] : 0;
    $db->prepare('UPDATE users SET aadhaarVerified = ?, updatedAt = NOW() WHERE id = ?')->execute([$aadhaarVerified, $id]);

    $updated = loadUserById($id);
    jsonResponse(['success' => true, 'message' => 'Aadhaar status updated', 'user' => $updated]);
}

// ── addInstructor (admin creates instructor directly) ─────────────────────────
function addInstructor(): void {
    $body     = getBody();
    $name     = trim($body['name'] ?? '');
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $phone    = trim($body['phone'] ?? '');

    if (!$name || !$email || !$password) {
        errorResponse('Please provide name, email, and password');
    }

    $db  = getDb();
    $chk = $db->prepare('SELECT id FROM users WHERE email = ?');
    $chk->execute([$email]);
    if ($chk->fetch()) errorResponse('User already exists');

    $hashed = hashPassword($password);
    $db->prepare('INSERT INTO users (name, email, password, phone, role, approvalStatus, aadhaarVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())')
       ->execute([$name, $email, $hashed, $phone, 'instructor', 'approved']);

    $instructorId = (int) $db->lastInsertId();

    jsonResponse([
        'success'    => true,
        'message'    => 'Instructor created successfully',
        'instructor' => [
            'id'    => $instructorId,
            'name'  => $name,
            'email' => $email,
            'role'  => 'instructor',
        ],
    ], 201);
}
