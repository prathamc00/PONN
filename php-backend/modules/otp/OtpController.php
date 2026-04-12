<?php
/**
 * OTP Controller
 * Full PHP port of modules/otp/otp.controller.js
 */

require_once __DIR__ . '/../../helpers/mailer.php';


function generateOtpCode(): string {
    return str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
}

// ── sendEmailOtp ──────────────────────────────────────────────────────────────
function sendEmailOtp(): void {
    checkRateLimit('otp', 20, 5 * 60);
    $body  = getBody();
    $email = strtolower(trim($body['email'] ?? ''));

    if (!$email) {
        errorResponse('Email is required');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email address format');
    }

    $db = getDb();

    // Check if user already exists
    $check = $db->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        errorResponse('Email is already registered', 409);
    }

    // Ensure OTP table exists
    $db->exec("
        CREATE TABLE IF NOT EXISTS otps (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            email      VARCHAR(255) NOT NULL,
            code       VARCHAR(6)   NOT NULL,
            attempts   INT          NOT NULL DEFAULT 0,
            expiresAt  DATETIME     NOT NULL,
            createdAt  DATETIME     NOT NULL,
            UNIQUE KEY uq_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Delete any old OTP
    $db->prepare('DELETE FROM otps WHERE email = ?')->execute([$email]);

    $code      = generateOtpCode();
    $expiresAt = date('Y-m-d H:i:s', time() + 5 * 60);
    $now       = date('Y-m-d H:i:s');

    $db->prepare('INSERT INTO otps (email, code, attempts, expiresAt, createdAt) VALUES (?, ?, 0, ?, ?)')
       ->execute([$email, $code, $expiresAt, $now]);

    try {
        sendMail($email, 'Your CRISMATECH Verification Code', buildOtpEmail($code));
        jsonResponse(['success' => true, 'message' => 'OTP sent to your email']);
    } catch (RuntimeException $e) {
        jsonResponse(['success' => false, 'message' => 'Failed to send OTP. Please try again.'], 500);
    }
}

// ── verifyEmailOtp ────────────────────────────────────────────────────────────
function verifyEmailOtp(): void {
    $body  = getBody();
    $email = strtolower(trim($body['email'] ?? ''));
    $code  = trim($body['code'] ?? '');

    if (!$email || !$code) {
        errorResponse('Email and code are required');
    }

    $db   = getDb();
    $stmt = $db->prepare('SELECT id, code, attempts, expiresAt FROM otps WHERE email = ?');
    $stmt->execute([$email]);
    $otp = $stmt->fetch();

    if (!$otp) {
        errorResponse('Invalid or expired OTP code. Please request a new one.');
    }

    if (new DateTime() > new DateTime($otp['expiresAt'])) {
        $db->prepare('DELETE FROM otps WHERE email = ?')->execute([$email]);
        errorResponse('OTP code has expired. Please request a new one.');
    }

    $MAX_ATTEMPTS = 5;
    $newAttempts  = (int) $otp['attempts'] + 1;

    if ($newAttempts > $MAX_ATTEMPTS) {
        $db->prepare('DELETE FROM otps WHERE email = ?')->execute([$email]);
        errorResponse('Too many incorrect attempts. Please request a new OTP.', 429);
    }

    if ($otp['code'] !== $code) {
        $db->prepare('UPDATE otps SET attempts = ? WHERE id = ?')->execute([$newAttempts, $otp['id']]);
        $remaining = $MAX_ATTEMPTS - $newAttempts;
        errorResponse("Invalid OTP code. {$remaining} attempt" . ($remaining === 1 ? '' : 's') . ' remaining.');
    }

    // Correct — delete and return success
    $db->prepare('DELETE FROM otps WHERE email = ?')->execute([$email]);
    jsonResponse(['success' => true, 'message' => 'Email verified successfully']);
}
