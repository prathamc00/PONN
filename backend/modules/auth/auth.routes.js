const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const router = express.Router();
const {
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
} = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');

// ── Validation rule sets ──────────────────────────────────────────────────────

const registerRules = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional({ checkFalsy: true }).matches(/^\+?[\d\s-]{10,15}$/).withMessage('Phone must be a valid number (10-15 digits)'),
    body('semester').optional({ checkFalsy: true }).isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
];

const loginRules = [
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
    body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

const resetPasswordRules = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

// ── File upload ───────────────────────────────────────────────────────────────

const ALLOWED_AADHAAR_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_AADHAAR_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

const aadhaarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads', 'aadhaar')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `aadhaar_${req.user.id}_${Date.now()}${ext}`);
    },
});

const aadhaarUpload = multer({
    storage: aadhaarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeOk = ALLOWED_AADHAAR_MIMES.includes(file.mimetype);
        const extOk = ALLOWED_AADHAAR_EXTENSIONS.includes(ext);

        if (mimeOk && extOk) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, or PNG files are allowed'));
        }
    },
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/instructor/register', registerRules, validate, registerInstructor);
router.post('/instructor/login', loginRules, validate, loginInstructor);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.post('/me/aadhaar', protect, aadhaarUpload.single('aadhaarCard'), uploadAadhaar);
router.post('/me/enroll/:courseId', protect, enrollCourse);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.get('/reset-password/validate', validateResetToken);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);

module.exports = router;
