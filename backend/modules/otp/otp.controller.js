const { randomInt } = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../auth/auth.model');
const Otp = require('./otp.model');
const { MAX_OTP_ATTEMPTS } = require('./otp.model');
const logger = require('../../config/logger');

// Educational email domain validation
const EDUCATIONAL_DOMAINS = ['.edu', '.ac.in', '.edu.in', '.ac.uk', '.edu.au'];

function isEducationalEmail(email) {
    const lower = email.toLowerCase();
    return EDUCATIONAL_DOMAINS.some((domain) => lower.endsWith(domain));
}

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Generate cryptographically secure 6-digit OTP
function generateOtp() {
    return String(randomInt(100000, 1000000));
}

const sendEmailOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format' });
        }

        if (!isEducationalEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Only educational email addresses are allowed (e.g., .edu, .ac.in)',
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email is already registered' });
        }

        // Delete any previous OTPs for this email before issuing a fresh one
        await Otp.deleteMany({ email: email.toLowerCase() });

        const code = generateOtp();
        await Otp.create({ email: email.toLowerCase(), code });

        await transporter.sendMail({
            from: `"CRISMATECH Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your CRISMATECH Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                    <h2 style="color: #0056D2; margin-bottom: 16px;">Email Verification</h2>
                    <p>Your verification code is:</p>
                    <div style="background: #f0f4ff; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0056D2;">${code}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
                </div>
            `,
        });

        res.status(200).json({ success: true, message: 'OTP sent to your email' });
    } catch (error) {
        logger.error('OTP send error', { message: error.message });
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
};

const verifyEmailOtp = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and code are required' });
        }

        const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new one.' });
        }

        // Increment attempt counter
        otpRecord.attempts += 1;

        // Lockout after max attempts — destroy the OTP so attacker cannot keep guessing
        if (otpRecord.attempts > MAX_OTP_ATTEMPTS) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts. Please request a new OTP.',
            });
        }

        if (otpRecord.code !== code) {
            await otpRecord.save();
            const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts;
            return res.status(400).json({
                success: false,
                message: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
            });
        }

        // Correct code — delete the OTP record and return success
        await Otp.deleteOne({ _id: otpRecord._id });
        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendEmailOtp, verifyEmailOtp };
