<?php
/**
 * Email helper using PHPMailer
 * Replaces Nodemailer's transporter in auth.controller.js and otp.controller.js
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

/**
 * Send an HTML email via SMTP.
 * Returns true on success, throws RuntimeException on failure.
 */
function sendMail(string $toEmail, string $subject, string $htmlBody): bool
{
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = env('SMTP_HOST', 'smtp.gmail.com');
        $mail->SMTPAuth = true;
        $mail->Username = env('SMTP_USER', '');
        $mail->Password = env('SMTP_PASS', '');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = (int) env('SMTP_PORT', '587');
        $mail->CharSet = 'UTF-8';

        $fromName = 'CRISMATECH Portal';
        $fromEmail = env('SMTP_USER', '');
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($toEmail);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlBody;

        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        throw new RuntimeException('Failed to send email: ' . $mail->ErrorInfo);
    }
}

/**
 * Build the OTP email HTML body — same as otp.controller.js template
 */
function buildOtpEmail(string $code): string
{
    return <<<HTML
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
    <h2 style="color: #0056D2; margin-bottom: 16px;">Email Verification</h2>
    <p>Your verification code is:</p>
    <div style="background: #f0f4ff; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0056D2;">$code</span>
    </div>
    <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
</div>
HTML;
}

/**
 * Build the password reset email HTML body — same as auth.controller.js template
 */
function buildResetEmail(string $resetLink): string
{
    return <<<HTML
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border-radius: 16px;">
    <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="color: #1A1A2E; font-size: 22px; margin: 0 0 8px;">Password Reset</h2>
    </div>
    <div style="text-align: center; margin: 32px 0;">
        <a href="$resetLink" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6C63FF, #7C3AED); color: #ffffff; text-decoration: none; border-radius: 10px;">
            Reset Password
        </a>
    </div>
    <p style="color: #666; font-size: 13px; text-align: center;">This link expires in 15 minutes.</p>
</div>
HTML;
}
