const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const { errorHandler } = require('./middlewares/error.middleware');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const otpRoutes = require('./modules/otp/otp.routes');
const courseRoutes = require('./modules/course/course.routes');
const assignmentRoutes = require('./modules/assignment/assignment.routes');
const submissionRoutes = require('./modules/assignment/submission.routes');
const testRoutes = require('./modules/test/test.routes');
const quizAttemptRoutes = require('./modules/test/quizAttempt.routes');
const certificateRoutes = require('./modules/certificate/certificate.routes');
const userRoutes = require('./modules/user/user.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const notificationRoutes = require('./modules/notification/notification.routes');

const app = express();
const frontendDir = path.join(__dirname, '..', 'frontend');

// --- Middleware ---
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow serving uploads cross-origin
}));
app.use(mongoSanitize());
app.use(compression());

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (curl, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// General API limiter (less strict than auth limiter)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict OTP limiter: 5 requests per 5 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many OTP requests, please wait 5 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/otp', otpLimiter, otpRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/quiz-attempts', quizAttemptRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);

// --- Static Pages ---
app.get('/password/forgot.html', (req, res) => {
    res.sendFile(path.join(frontendDir, 'password', 'forgot.html'));
});

app.get('/password/reset.html', (req, res) => {
    res.sendFile(path.join(frontendDir, 'password', 'reset.html'));
});

app.get('/', (req, res) => {
    res.json({ message: 'Student Learning Portal API is running' });
});

app.use('/frontend', express.static(frontendDir));
app.use(express.static(frontendDir));

// --- Error Handling ---
app.use(errorHandler);

module.exports = app;
