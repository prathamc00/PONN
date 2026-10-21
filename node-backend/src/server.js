import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool, initDatabase, uploadDir, aadhaarUploadDir } from './db.js';
import { authenticate, adminOnly, fail } from './middleware/auth.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import testRoutes, { getAllAttemptsHandler } from './routes/testRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Server timestamp: 2026-10-22T02:36:10
const app = express();
const port = process.env.PORT || 5000;

// Validate required environment configurations in production
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('fallback'))) {
  console.error('FATAL SECURITY ERROR: JWT_SECRET must be securely set in environment variables for production.');
  process.exit(1);
}

// Security Headers
app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin access to uploaded static assets
  })
);

// CORS configuration
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://crismatech.com',
  'https://www.crismatech.com',
  'https://crismatech.in',
  'https://www.crismatech.in',
  'https://mistyrose-stinkbug-181981.hostingersite.com',
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isCrismatechDomain = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?crismatech\.(?:com|in)(?::\d+)?$/.test(origin);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        isCrismatechDomain;
      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.options('*', cors());

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Block anonymous public access to government ID documents (Aadhaar cards)
app.use('/uploads/aadhaar', authenticate, adminOnly, express.static(aadhaarUploadDir));

// Static uploads serving for public course assets & thumbnails
app.use('/uploads', express.static(uploadDir));

// Rate limiter JSON response helper
const rateLimitJsonHandler = (message) => (_req, res) => {
  res.status(429).json({ success: false, message });
};

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitJsonHandler('Too many requests. Please wait a few minutes before trying again.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitJsonHandler('Too many authentication attempts. Please wait 15 minutes before retrying.'),
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitJsonHandler('Too many OTP verification requests. Please wait 5 minutes before trying again.'),
});

const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitJsonHandler('Assistant rate limit reached. Please wait a moment before sending more messages.'),
});

// Health check endpoints
app.get('/', (_req, res) => res.json({ success: true, service: 'CRISMATECH Node API', status: 'running' }));
app.get('/api', (_req, res) => res.json({ success: true, service: 'CRISMATECH Node API', status: 'running' }));
const healthCheck = async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, service: 'CRISMATECH Node API', db: 'connected' });
  } catch (error) {
    res.status(503).json({ success: false, service: 'CRISMATECH Node API', db: 'disconnected', error: error.message });
  }
};
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Mount module routes (supporting both /api/* and /* for reverse proxy / Passenger flexibility)
const mountModuleRoutes = (prefix = '') => {
  const p = prefix ? `/${prefix.replace(/^\/+|\/+$/g, '')}` : '';
  if (p) app.use(p, generalLimiter);
  app.use(`${p}/auth`, authLimiter, authRoutes);
  app.use(`${p}/otp`, otpLimiter, otpRoutes);
  app.use(`${p}/courses`, courseRoutes);
  app.use(`${p}/assignments`, assignmentRoutes);
  app.use(`${p}/submissions`, submissionRoutes);
  app.use(`${p}/tests`, testRoutes);
  app.use(`${p}/quiz-attempts`, authenticate, adminOnly, getAllAttemptsHandler);
  app.use(`${p}/certificates`, certificateRoutes);
  app.use(`${p}/users`, userRoutes);
  app.use(`${p}/attendance`, attendanceRoutes);
  app.use(`${p}/notifications`, notificationRoutes);
  app.use(`${p}/chat`, chatLimiter, chatRoutes);
};

mountModuleRoutes('api');
mountModuleRoutes('');

// 404 Route Not Found
app.use((_req, res) => fail(res, 404, 'Route not found'));

// Global Error Handler
app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error);
  res.status(error.status || error.statusCode || 500).json({
    success: false,
    message: error.message || 'An unexpected server error occurred',
  });
});

// Initialize database and start server
async function startServer() {
  await initDatabase();
  app.listen(port, () => {
    console.log(`🚀 CRISMATECH Node API is running on http://localhost:${port}`);
    console.log(`📡 Health check available at http://localhost:${port}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
});
