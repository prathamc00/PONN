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
        'emailVerified' => (bool) ($user['emailVerified'] ?? false),
        'approvalStatus' => $user['approvalStatus'] ?? 'approved',
        'aadhaarVerified' => (bool) ($user['aadhaarVerified'] ?? false),
        'createdAt' => $user['createdAt'] ?? null,
    ];
}

function getEmailVerificationSecret(): string
{
    $fallback = requireJwtSecret('JWT_SECRET');
    return requireJwtSecret('EMAIL_VERIFICATION_SECRET', $fallback);
}

function ensureAuthSecuritySchema(): void
{
    $db = getDb();

    // Run lightweight idempotent migrations needed by hardened auth flows.
    $db->exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerified TINYINT(1) NOT NULL DEFAULT 0');
    $db->exec('ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordChangedAt DATETIME NULL');

    $db->exec("UPDATE users SET emailVerified = 1 WHERE emailVerified IS NULL OR emailVerified = 0");
    $db->exec("UPDATE users SET passwordChangedAt = COALESCE(passwordChangedAt, updatedAt, createdAt, NOW())");

    $db->exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        tokenHash CHAR(64) NOT NULL,
        expiresAt DATETIME NOT NULL,
        usedAt DATETIME DEFAULT NULL,
        createdAt DATETIME NOT NULL,
        UNIQUE KEY uq_token_hash (tokenHash),
        INDEX idx_user (userId),
        INDEX idx_expires (expiresAt),
        CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function verifyEmailVerificationToken(string $email, string $token): void
{
    if ($token === '') {
        errorResponse('Email verification token is required', 400);
    }

    try {
        $payload = jwtVerifyPayloadWithSecret($token, getEmailVerificationSecret());
        $purpose = $payload['purpose'] ?? '';
        $tokenEmail = strtolower(trim((string) ($payload['email'] ?? '')));

        if ($purpose !== 'email_verification' || $tokenEmail === '' || !hash_equals($tokenEmail, strtolower($email))) {
            errorResponse('Invalid email verification token', 400);
        }
    } catch (RuntimeException $e) {
        errorResponse($e->getMessage() ?: 'Invalid email verification token', 400);
    }
}

function buildLoginRateKey(string $email): string
{
    $normalized = strtolower(trim($email));
    return 'login_' . substr(hash('sha256', $normalized), 0, 48);
}

function passwordHashAlgo(): string|int
{
    return defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
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
    $algo = passwordHashAlgo();

    if ($algo === PASSWORD_ARGON2ID) {
        return password_hash($password, PASSWORD_ARGON2ID);
    }

    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verifyPassword(string $plain, string $hash): bool
{
    return password_verify($plain, $hash);
}

// ── register ──────────────────────────────────────────────────────────────────
function register(string $forcedRole = ''): void
{
    ensureAuthSecuritySchema();

    $body = getBody();
    $name = trim($body['name'] ?? '');
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    $emailVerificationToken = trim((string) ($body['emailVerificationToken'] ?? ''));
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

    verifyEmailVerificationToken($email, $emailVerificationToken);

    $db = getDb();

    // Check duplicate
    $dup = $db->prepare('SELECT id FROM users WHERE email = ?');
    $dup->execute([$email]);
    if ($dup->fetch()) {
        errorResponse('Email is already registered', 409);
    }

    $hashed = hashPassword($password);
    $approvalStatus = $role === 'instructor' ? 'pending' : 'approved';

    $ins = $db->prepare('INSERT INTO users (name, email, password, college, branch, semester, phone, role, approvalStatus, emailVerified, aadhaarVerified, passwordChangedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW(), NOW())');
    $ins->execute([$name, $email, $hashed, $college, $branch, $semester, $phone, $role, $approvalStatus]);
    $userId = (int) $db->lastInsertId();

    $user = loadUserById($userId);

    if ($role === 'instructor') {
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_register_success', 'info', ['role' => $role], 201, (int) $user['id']);
        }

        jsonResponse([
            'success' => true,
            'message' => 'Instructor registration submitted. Your account is pending admin approval.',
            'requiresApproval' => true,
            'user' => buildUserPayload($user),
        ], 201);
    }

    $token = jwtSign($userId, env('JWT_EXPIRES_IN', '8h'));
    if (function_exists('logSecurityEvent')) {
        logSecurityEvent('auth_register_success', 'info', ['role' => $role], 201, $userId);
    }

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
    ensureAuthSecuritySchema();

    $body = getBody();
    $email = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        errorResponse('Please provide email and password');
    }

    checkRateLimit(buildLoginRateKey($email), 8, 15 * 60);

    $db = getDb();
    $stmt = $db->prepare('SELECT id, name, email, password, college, branch, semester, phone, role, approvalStatus, emailVerified, aadhaarVerified, aadhaarCardPath, createdAt FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password'])) {
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_login_failed', 'warning', [
                'reason' => 'invalid_credentials',
                'emailHash' => hash('sha256', $email),
            ], 401);
        }
        errorResponse('Invalid email or password', 401);
    }

    if ((int) ($user['emailVerified'] ?? 0) !== 1) {
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_login_blocked', 'warning', [
                'reason' => 'email_not_verified',
                'emailHash' => hash('sha256', $email),
            ], 403, (int) $user['id']);
        }
        errorResponse('Please verify your email before logging in.', 403);
    }

    if (password_needs_rehash($user['password'], passwordHashAlgo())) {
        $db->prepare('UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?')
            ->execute([hashPassword($password), $user['id']]);
    }

    if ($requiredRole && $user['role'] !== $requiredRole) {
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_login_blocked', 'warning', [
                'reason' => 'role_mismatch',
                'requiredRole' => $requiredRole,
                'actualRole' => $user['role'],
            ], 403, (int) $user['id']);
        }
        errorResponse('This login is only for ' . $requiredRole . ' accounts.', 403);
    }

    $approvalStatus = $user['approvalStatus'] ?? 'approved';
    if ($user['role'] === 'instructor' && $approvalStatus !== 'approved') {
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_login_blocked', 'warning', [
                'reason' => 'instructor_not_approved',
                'approvalStatus' => $approvalStatus,
            ], 403, (int) $user['id']);
        }

        $msg = $approvalStatus === 'rejected'
            ? 'Your instructor account has been rejected. Please contact the admin.'
            : 'Your instructor account is pending admin approval.';
        jsonResponse(['success' => false, 'message' => $msg, 'approvalStatus' => $approvalStatus], 403);
    }

    $token = jwtSign((int) $user['id'], env('JWT_EXPIRES_IN', '8h'));
    if (function_exists('logSecurityEvent')) {
        logSecurityEvent('auth_login_success', 'info', ['role' => $user['role']], 200, (int) $user['id']);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'sessionExpiresIn' => env('JWT_EXPIRES_IN', '8h'),
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
    ensureAuthSecuritySchema();
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
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_forgot_password_unknown_email', 'warning', [
                'emailHash' => hash('sha256', $email),
            ], 200);
        }

        jsonResponse(['success' => true, 'message' => 'If an account with that email exists, a reset link has been sent.']);
    }

    $db->prepare('DELETE FROM password_reset_tokens WHERE userId = ? OR expiresAt < NOW() OR usedAt IS NOT NULL')
        ->execute([(int) $user['id']]);

    $resetToken = bin2hex(random_bytes(32));
    $tokenHash = hash_hmac('sha256', $resetToken, requireJwtSecret('JWT_SECRET'));
    $expiresAt = date('Y-m-d H:i:s', time() + 15 * 60);

    $db->prepare('INSERT INTO password_reset_tokens (userId, tokenHash, expiresAt, usedAt, createdAt) VALUES (?, ?, ?, NULL, NOW())')
        ->execute([(int) $user['id'], $tokenHash, $expiresAt]);

    $resetLink = getResetBaseUrl() . '?token=' . urlencode($resetToken);

    try {
        sendMail($email, 'Reset Your CRISMATECH Password', buildResetEmail($resetLink));
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_forgot_password_sent', 'info', [], 200, (int) $user['id']);
        }
        jsonResponse(['success' => true, 'message' => 'Password reset link has been sent to your email. Link expires in 15 minutes.']);
    } catch (RuntimeException $e) {
        if (function_exists('logSecurityEvent')) {
            logSecurityEvent('auth_forgot_password_send_failed', 'error', ['error' => $e->getMessage()], 500, (int) $user['id']);
        }
        jsonResponse(['success' => false, 'message' => 'Failed to send reset email. Please try again.'], 500);
    }
}

// ── validateResetToken ────────────────────────────────────────────────────────
function validateResetToken(): void
{
    ensureAuthSecuritySchema();

    $token = query('token', '');
    if (!$token) {
        errorResponse('Reset token is required');
    }

    $db = getDb();

    $tokenHash = hash_hmac('sha256', $token, requireJwtSecret('JWT_SECRET'));
    $stmt = $db->prepare('SELECT id FROM password_reset_tokens WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > NOW() LIMIT 1');
    $stmt->execute([$tokenHash]);
    $row = $stmt->fetch();

    if (!$row) {
        errorResponse('Invalid or expired reset token');
    }

    jsonResponse(['success' => true, 'message' => 'Reset token is valid']);
}

// ── resetPassword ─────────────────────────────────────────────────────────────
function resetPassword(): void
{
    ensureAuthSecuritySchema();

    $body = getBody();
    $token = $body['token'] ?? '';
    $newPassword = $body['newPassword'] ?? '';

    if (!$token || !$newPassword) {
        errorResponse('Token and new password are required');
    }
    if (strlen($newPassword) < 8) {
        errorResponse('New password must be at least 8 characters');
    }

    $db = getDb();
    $tokenHash = hash_hmac('sha256', $token, requireJwtSecret('JWT_SECRET'));
    $stmt = $db->prepare('SELECT id, userId FROM password_reset_tokens WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > NOW() LIMIT 1');
    $stmt->execute([$tokenHash]);
    $resetRow = $stmt->fetch();

    if (!$resetRow) {
        errorResponse('Invalid or expired reset token');
    }

    $hashed = hashPassword($newPassword);

    $db->beginTransaction();
    try {
        $db->prepare('UPDATE users SET password = ?, passwordChangedAt = NOW(), updatedAt = NOW() WHERE id = ?')
            ->execute([$hashed, (int) $resetRow['userId']]);

        $db->prepare('UPDATE password_reset_tokens SET usedAt = NOW() WHERE id = ?')
            ->execute([(int) $resetRow['id']]);

        $db->prepare('DELETE FROM password_reset_tokens WHERE userId = ?')
            ->execute([(int) $resetRow['userId']]);

        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        errorResponse('Failed to reset password. Please request a new reset link.', 500);
    }

    jsonResponse(['success' => true, 'message' => 'Password has been reset successfully. You can now login with your new password.']);
}
