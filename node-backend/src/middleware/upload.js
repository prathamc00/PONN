import multer from 'multer';
import path from 'node:path';
import { aadhaarUploadDir, submissionUploadDir, thumbnailUploadDir, courseUploadDir } from '../db.js';

// Allowed extensions
const allowedDocExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.rar', '.txt', '.png', '.jpg', '.jpeg'];
const allowedImgExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
const allowedMediaExtensions = [
  '.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi',
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt',
  '.png', '.jpg', '.jpeg', '.webp', '.svg'
];

const aadhaarStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, aadhaarUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || 'anon';
    cb(null, `aadhaar_${userId}_${Date.now()}${ext}`);
  },
});

const submissionStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, submissionUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || 'anon';
    cb(null, `sub_${userId}_${Date.now()}${ext}`);
  },
});

const thumbnailStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, thumbnailUploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `thumb_${Date.now()}${ext}`);
  },
});

const courseStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, courseUploadDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `course_${Date.now()}_${safeName}${ext}`);
  },
});

export const uploadAadhaarFile = multer({
  storage: aadhaarStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedDocExtensions.includes(ext)) {
      return cb(new Error(`Invalid file type. Allowed: ${allowedDocExtensions.join(', ')}`));
    }
    cb(null, true);
  },
});

export const uploadSubmissionFile = multer({
  storage: submissionStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedDocExtensions.includes(ext)) {
      return cb(new Error(`Invalid file type. Allowed: ${allowedDocExtensions.join(', ')}`));
    }
    cb(null, true);
  },
});

export const uploadThumbnailFile = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedImgExtensions.includes(ext)) {
      return cb(new Error(`Invalid image type. Allowed: ${allowedImgExtensions.join(', ')}`));
    }
    cb(null, true);
  },
});

export const uploadCourseFile = multer({
  storage: courseStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMediaExtensions.includes(ext)) {
      return cb(new Error(`Invalid file type ${ext}. Allowed: ${allowedMediaExtensions.join(', ')}`));
    }
    cb(null, true);
  },
});

export const uploadLessonMedia = uploadCourseFile.fields([
  { name: 'video', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'notes', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

