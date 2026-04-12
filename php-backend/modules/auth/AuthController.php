<?php
/**
 * Auth Controller
 * Full PHP port of modules/auth/auth.controller.js
 */

require_once __DIR__ . '/../../helpers/mailer.php';

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUserPayload(array $user): array
{
    return [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'college' => $user['college'] ?? null,
        'branch' => $user['branch'] ?? null,
        'semester' => $user['semester'] ?? null,
        'phone' => $user['phone'] ?? null,
        'role' => $user['role'],
        'approvalStatus' => $user['approvalStatus'] ?? 'approved',
        'aadhaarVerified' => (bool) ($user['aadhaarVerified'] ?? false),
        'createdAt' => $user['createdAt'] ?? null,
    ];
}

function getResetBaseUrl(): string
{
    $resetUrl = env('RESET_PASSWORD_URL', '');
    if ($resetUrl)
        return rtrim($resetUrl, '/');

    $appUrl = env('APP_URL', '');
    if ($appUrl)
        return rtrim($appUrl, '/') . '/reset-password';

    $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    return "{$proto}://{$_SERVER['HTTP_HOST']}/reset-password";
}

function hashPassword(string $password): string
{
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

function verifyPassword(string $plain, string $hash): bool
{
    return password_verify($plain, $hash);
}

// ── register ──────────────────────────────────────────────────────────────────
function register(string $forcedRole = ''): void
{
    $body = getBody();
    $name = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $college = trim($body['college'] ?? '');
    $branch = trim($body['branch'] ?? '');
    $semester = isset($body['semester']) ? (int) $body['semester'] : null;
    $phone = trim($body['phone'] ?? '');
    $role = $forcedRole ?: ($body['role'] === 'instructor' ? 'instructor' : 'student');

    if (!$name || !$email || !$password) {
        errorResponse('Please provide name, email, and password');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Please provide a valid email');
    }
    if (strlen($password) < 8) {
        errorResponse('Password must be at least 8 characters');
    }
    if ($phone && !preg_match('/^\+?[\d\s\-]{10,15}$/', $phone)) {
        errorResponse('Phone must be a valid number (10-15 digits)');
    }
    if ($semester !== null && ($semester < 1 || $semester > 8)) {
        errorResponse('Semester must be between 1 and 8');
    }

    $db = getDb();

    // Check duplicate
    $dup = $db->prepare('SELECT id FROM users WHERE email = ?');
    $dup->execute([$email]);
    if ($dup->fetch()) {
        errorResponse('Email is already registered', 409);
    }

    $hashed = hashPassword($password);
    $approvalStatus = $role === 'instructor' ? 'pending' : 'approved';

    $ins = $db->prepare('INSERT INTO users (name, email, password, college, branch, semester, phone, role, approvalStatus, aadhaarVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())');
    $ins->execute([$name, $email, $hashed, $college, $branch, $semester, $phone, $role, $approvalStatus]);
    $userId = (int) $db->lastInsertId();

    $user = loadUserById($userId);

    if ($role === 'instructor') {
        jsonResponse([
            'success' => true,
            'message' => 'Instructor registration submitted. Your account is pending admin approval.',
            'requiresApproval' => true,
            'user' => buildUserPayload($user),
        ], 201);
    }

    $token = jwtSign($userId, env('JWT_EXPIRES_IN', '7d'));
    jsonResponse([
        'success' => true,
        'message' => 'Registration successful',
        'token' => $token,
        'user' => buildUserPayload($user),
    ], 201);
}

function registerInstructor(): void
{
    register('instructor');
}

// ── login ─────────────────────────────────────────────────────────────────────
function login(string $requiredRole = ''): void
{
    $body = getBody();
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        errorResponse('Please provide email and password');
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT id, name, email, password, college, branch, semester, phone, role, approvalStatus, aadhaarVerified, aadhaarCardPath, createdAt FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password'])) {
        errorResponse('Invalid email or password', 401);
    }

    if ($requiredRole && $user['role'] !== $requiredRole) {
        errorResponse('This login is only for ' . $requiredRole . ' accounts.', 403);
    }

    $approvalStatus = $user['approvalStatus'] ?? 'approved';
    if ($user['role'] === 'instructor' && $approvalStatus !== 'approved') {
        $msg = $approvalStatus === 'rejected'
            ? 'Your instructor account has been rejected. Please contact the admin.'
            : 'Your instructor account is pending admin approval.';
        jsonResponse(['success' => false, 'message' => $msg, 'approvalStatus' => $approvalStatus], 403);
    }

    $token = jwtSign((int) $user['id'], env('JWT_EXPIRES_IN', '7d'));
    jsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => buildUserPayload($user),
    ]);
}

function loginInstructor(): void
{
    login('instructor');
}

// ── getMe ─────────────────────────────────────────────────────────────────────
function getMe(): void
{
    $user = getAuthUser();
    $db = getDb();

    // Fetch user's enrolled courses
    $stmt = $db->prepare('
        SELECT c.id, c.title, c.category, c.level
        FROM courses c
        JOIN user_courses uc ON uc.courseId = c.id
        WHERE uc.userId = ?
    ');
    $stmt->execute([$user['id']]);
    $enrolledCourses = $stmt->fetchAll();

    $payload = buildUserPayload($user);
    $payload['aadhaarCardPath'] = $user['aadhaarCardPath'] ?? null;
    $payload['enrolledCourses'] = $enrolledCourses;

    jsonResponse(['success' => true, 'user' => $payload]);
}

// ── updateProfile ─────────────────────────────────────────────────────────────
function updateProfile(): void
{
    $user = getAuthUser();
    $body = getBody();
    $allowed = ['name', 'phone', 'college', 'branch', 'semester'];
    $sets = [];
    $params = [];

    foreach ($allowed as $field) {
        if (isset($body[$field])) {
            $sets[] = "{$field} = ?";
            $params[] = $body[$field];
        }
    }

    if (empty($sets)) {
        errorResponse('No fields to update');
    }

    $params[] = $user['id'];
    $db = getDb();
    $db->prepare('UPDATE users SET ' . implode(', ', $sets) . ', updatedAt = NOW() WHERE id = ?')->execute($params);

    $updated = loadUserById((int) $user['id']);
    jsonResponse(['success' => true, 'message' => 'Profile updated successfully', 'user' => buildUserPayload($updated)]);
}

// ── uploadAadhaar ─────────────────────────────────────────────────────────────
function uploadAadhaar(): void
{
    $user = getAuthUser();

    if (empty($_FILES['aadhaarCard']) || $_FILES['aadhaarCard']['error'] !== UPLOAD_ERR_OK) {
        errorResponse('Please upload an Aadhaar card file');
    }

    $file = $_FILES['aadhaarCard'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['pdf', 'jpg', 'jpeg', 'png'];
    $mimes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!in_array($ext, $allowed, true) || !in_array($file['type'], $mimes, true)) {
        errorResponse('Only PDF, JPG, or PNG files are allowed');
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        errorResponse('File size must be under 5MB');
    }

    $dir = __DIR__ . '/../../uploads/aadhaar/';
    if (!is_dir($dir))
        mkdir($dir, 0755, true);

    $filename = 'aadhaar_' . $user['id'] . '_' . time() . '.' . $ext;
    $dest = $dir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        errorResponse('Failed to save file', 500);
    }

    $filePath = 'uploads/aadhaar/' . $filename;
    $db = getDb();
    $db->prepare('UPDATE users SET aadhaarCardPath = ?, aadhaarVerified = 0, updatedAt = NOW() WHERE id = ?')
        ->execute([$filePath, $user['id']]);

    jsonResponse(['success' => true, 'message' => 'Aadhaar card uploaded successfully. Verification pending.', 'aadhaarCardPath' => $filePath]);
}

// ── enrollCourseAuth ─────────────────────────────────────────────────────────
function enrollCourseAuth(int $courseId): void
{
    $user = getAuthUser();
    $db = getDb();

    $course = $db->prepare('SELECT id FROM courses WHERE id = ?');
    $course->execute([$courseId]);
    if (!$course->fetch()) {
        errorResponse('Course not found', 404);
    }

    $check = $db->prepare('SELECT 1 FROM user_courses WHERE userId = ? AND courseId = ?');
    $check->execute([$user['id'], $courseId]);
    if ($check->fetch()) {
        errorResponse('Already enrolled in this course', 409);
    }

    $db->prepare('INSERT INTO user_courses (userId, courseId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())')
        ->execute([$user['id'], $courseId]);

    jsonResponse(['success' => true, 'message' => 'Enrolled successfully']);
}

// ── forgotPassword ────────────────────────────────────────────────────────────
function forgotPassword(): void
{
    checkRateLimit('forgot_password', 5, 15 * 60);
    $body = getBody();
    $email = strtolower(trim($body['email'] ?? ''));

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Please provide a valid email address');
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT id, password FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        errorResponse('No account found with that email address. Please check for typos or register a new account.', 404);
    }

    $customSecret = env('JWT_SECRET', '') . $user['password'];
    $resetToken = jwtSignWithSecret((int) $user['id'], $customSecret, '15m');
    $resetLink = getResetBaseUrl() . '?token=' . urlencode($resetToken);

    try {
        sendMail($email, 'Reset Your CRISMATECH Password', buildResetEmail($resetLink));
        jsonResponse(['success' => true, 'message' => 'Password reset link has been sent to your email. Link expires in 15 minutes.']);
    } catch (RuntimeException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to send reset email. Please try again.'], 500);
    }
}

// ── validateResetToken ────────────────────────────────────────────────────────
function validateResetToken(): void
{
    $token = query('token', '');
    if (!$token) {
        errorResponse('Reset token is required');
    }

    $decoded = jwtDecode($token);
    if (!$decoded || empty($decoded['id'])) {
        errorResponse('Invalid or expired reset token');
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT id, password FROM users WHERE id = ?');
    $stmt->execute([(int) $decoded['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        errorResponse('Invalid or expired reset token');
    }

    try {
        $customSecret = env('JWT_SECRET', '') . $user['password'];
        jwtVerifyWithSecret($token, $customSecret);
        jsonResponse(['success' => true, 'message' => 'Reset token is valid']);
    } catch (RuntimeException $e) {
        errorResponse('Invalid or expired reset token');
    }
}

// ── resetPassword ─────────────────────────────────────────────────────────────
function resetPassword(): void
{
    $body = getBody();
    $token = $body['token'] ?? '';
    $newPassword = $body['newPassword'] ?? '';

    if (!$token || !$newPassword) {
        errorResponse('Token and new password are required');
    }
    if (strlen($newPassword) < 8) {
        errorResponse('New password must be at least 8 characters');
    }

    $decoded = jwtDecode($token);
    if (!$decoded || empty($decoded['id'])) {
        errorResponse('Invalid or expired reset token');
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT id, password FROM users WHERE id = ?');
    $stmt->execute([(int) $decoded['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        errorResponse('Invalid or expired reset token');
    }

    try {
        $customSecret = env('JWT_SECRET', '') . $user['password'];
        jwtVerifyWithSecret($token, $customSecret);
    } catch (RuntimeException $e) {
        errorResponse('Invalid or expired reset token');
    }

    $hashed = hashPassword($newPassword);
    $db->prepare('UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?')->execute([$hashed, $user['id']]);

    jsonResponse(['success' => true, 'message' => 'Password has been reset successfully. You can now login with your new password.']);
}
