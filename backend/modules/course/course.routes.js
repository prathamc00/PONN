const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect, staffOnly, optionalAuth } = require('../../middlewares/auth.middleware');
const { getCourses, getManagedCourses, getCourseById, createCourse, updateCourse, deleteCourse, getModules, addModule, updateModule, deleteModule, reorderModules, enrollCourse, unenrollCourse, getMyEnrollments, getCourseProgress, markModuleComplete } = require('./course.controller');

// Media upload config
const mediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'video') {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'videos'));
        } else if (file.fieldname === 'notes') {
            cb(null, path.join(__dirname, '..', '..', 'uploads', 'notes'));
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}_${Date.now()}${ext}`);
    },
});
const ALLOWED_MEDIA = {
    video: {
        extensions: ['.mp4', '.mkv', '.avi', '.webm', '.mov'],
        mimes: ['video/mp4', 'video/x-matroska', 'video/x-msvideo', 'video/webm', 'video/quicktime'],
    },
    notes: {
        extensions: ['.pdf'],
        mimes: ['application/pdf'],
    },
};

const mediaUpload = multer({
    storage: mediaStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const fieldConfig = ALLOWED_MEDIA[file.fieldname];
        if (!fieldConfig) return cb(new Error('Invalid field name'));

        const ext = path.extname(file.originalname).toLowerCase();
        const extOk = fieldConfig.extensions.includes(ext);
        const mimeOk = fieldConfig.mimes.includes(file.mimetype);

        if (extOk && mimeOk) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${fieldConfig.extensions.join(', ')}`));
        }
    },
});


// Course CRUD
router.get('/', getCourses);
router.get('/manage', protect, staffOnly, getManagedCourses);
router.get('/my-enrollments', protect, getMyEnrollments);
router.get('/:id', optionalAuth, getCourseById);
router.post('/', protect, staffOnly, createCourse);
router.put('/:id', protect, staffOnly, updateCourse);
router.delete('/:id', protect, staffOnly, deleteCourse);

// Enrollment
router.post('/:id/enroll', protect, enrollCourse);
router.delete('/:id/enroll', protect, unenrollCourse);

// Progress tracking
router.get('/:id/progress', protect, getCourseProgress);
router.post('/:id/modules/:moduleId/complete', protect, markModuleComplete);

// Module / Video management
router.get('/:id/modules', getModules);
router.post('/:id/modules', protect, staffOnly, mediaUpload.fields([{ name: 'video', maxCount: 1 }, { name: 'notes', maxCount: 1 }]), addModule);
router.put('/:id/modules/reorder', protect, staffOnly, reorderModules);
router.put('/:id/modules/:moduleId', protect, staffOnly, mediaUpload.fields([{ name: 'video', maxCount: 1 }, { name: 'notes', maxCount: 1 }]), updateModule);
router.delete('/:id/modules/:moduleId', protect, staffOnly, deleteModule);

module.exports = router;
