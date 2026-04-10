const { User, Course } = require('../../models');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const logger = require('../../config/logger');

// Helper: generate signed JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// Email transporter (shared with otpController)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const buildUserPayload = (user) => ({
    id: user.id || user._id, // Fallback just in case
    name: user.name,
    email: user.email,
    college: user.college,
    branch: user.branch,
    semester: user.semester,
    phone: user.phone,
    role: user.role,
    approvalStatus: user.approvalStatus || 'approved',
    aadhaarVerified: user.aadhaarVerified,
    createdAt: user.createdAt,
});

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const getResetPageBaseUrl = (req) => {
    if (process.env.RESET_PASSWORD_URL) {
        return trimTrailingSlash(process.env.RESET_PASSWORD_URL);
    }

    if (process.env.APP_URL) {
        return `${trimTrailingSlash(process.env.APP_URL)}/reset-password`;
    }

    return `${req.protocol}://${req.get('host')}/reset-password`;
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, college, branch, semester, phone, role } = req.body;
        const normalizedRole = role === 'instructor' ? 'instructor' : 'student';

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email is already registered' });
        }

        const approvalStatus = normalizedRole === 'instructor' ? 'pending' : 'approved';
        const user = await User.create({ name, email, password, college, branch, semester, phone, role: normalizedRole, approvalStatus });

        if (normalizedRole === 'instructor') {
            return res.status(201).json({
                success: true,
                message: 'Instructor registration submitted. Your account is pending admin approval.',
                requiresApproval: true,
                user: buildUserPayload(user),
            });
        }

        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: buildUserPayload(user),
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.scope('withPassword').findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const approvalStatus = user.approvalStatus || 'approved';

        if (user.role === 'instructor' && approvalStatus !== 'approved') {
            const message = approvalStatus === 'rejected'
                ? 'Your instructor account has been rejected. Please contact the admin.'
                : 'Your instructor account is pending admin approval.';

            return res.status(403).json({ success: false, message, approvalStatus });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: buildUserPayload(user),
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Course,
                as: 'enrolledCourses',
                attributes: ['id', 'title', 'category', 'level'],
                through: { attributes: [] }
            }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            user: {
                ...buildUserPayload(user),
                aadhaarCardPath: user.aadhaarCardPath,
                enrolledCourses: user.enrolledCourses,
            },
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'phone', 'college', 'branch', 'semester'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        await User.update(updates, {
            where: { id: req.user.id }
        });

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: buildUserPayload(user),
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const uploadAadhaar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an Aadhaar card file' });
        }

        const filePath = 'uploads/aadhaar/' + req.file.filename;

        await User.update(
            { aadhaarCardPath: filePath, aadhaarVerified: false },
            { where: { id: req.user.id } }
        );

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Aadhaar card uploaded successfully. Verification pending.',
            aadhaarCardPath: filePath,
        });
    } catch (error) {
        next(error);
    }
};

const enrollCourse = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // With Sequelize many-to-many, we use helper methods
        const courseId = req.params.courseId;
        const hasCourse = await user.hasEnrolledCourse(courseId);

        if (hasCourse) {
            return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
        }

        await user.addEnrolledCourse(courseId);

        res.status(200).json({ success: true, message: 'Enrolled successfully' });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email address' });
        }

        const user = await User.scope('withPassword').findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with that email address. Please check for typos or register a new account.'
            });
        }

        const secret = process.env.JWT_SECRET + user.password;
        const resetToken = jwt.sign({ id: user.id }, secret, { expiresIn: '15m' });
        const resetLink = `${getResetPageBaseUrl(req)}?token=${encodeURIComponent(resetToken)}`;

        logger.debug(`[Password Reset] Reset link generated for ${email}`);

        await transporter.sendMail({
            from: `"CRISMATECH Portal" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your CRISMATECH Password',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 32px; background: #ffffff; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h2 style="color: #1A1A2E; font-size: 22px; margin: 0 0 8px;">Password Reset</h2>
                    </div>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6C63FF, #7C3AED); color: #ffffff; text-decoration: none; border-radius: 10px;">
                            Reset Password
                        </a>
                    </div>
                </div>
            `,
        });

        res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email. Link expires in 15 minutes.',
        });
    } catch (error) {
        logger.error('[Password Reset] Error sending email:', { message: error.message });
        res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.' });
    }
};

const validateResetToken = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Reset token is required' });
        }

        const decodedUnverified = jwt.decode(token);
        if (!decodedUnverified || !decodedUnverified.id) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const user = await User.scope('withPassword').findByPk(decodedUnverified.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Invalid or expired reset token' });
        }

        try {
            const secret = process.env.JWT_SECRET + user.password;
            jwt.verify(token, secret);
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        return res.status(200).json({ success: true, message: 'Reset token is valid' });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Token and new password are required' });
        }

        const decodedUnverified = jwt.decode(token);
        if (!decodedUnverified || !decodedUnverified.id) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const user = await User.scope('withPassword').findByPk(decodedUnverified.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Invalid or expired reset token' });
        }

        try {
            const secret = process.env.JWT_SECRET + user.password;
            jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Change password directly and fire hook
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.',
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((entry) => entry.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const registerInstructor = async (req, res, next) => {
    req.body.role = 'instructor';
    return register(req, res, next);
};

const loginInstructor = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.scope('withPassword').findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        if (user.role !== 'instructor') {
            return res.status(403).json({ success: false, message: 'This login is only for instructor accounts.' });
        }

        const approvalStatus = user.approvalStatus || 'approved';
        if (approvalStatus !== 'approved') {
            const message = approvalStatus === 'rejected'
                ? 'Your instructor account has been rejected. Please contact the admin.'
                : 'Your instructor account is pending admin approval.';

            return res.status(403).json({ success: false, message, approvalStatus });
        }

        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: buildUserPayload(user),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    registerInstructor,
    login,
    loginInstructor,
    getMe,
    updateProfile,
    uploadAadhaar,
    enrollCourse,
    forgotPassword,
    validateResetToken,
    resetPassword,
};
