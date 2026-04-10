const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const {
    getAssignments,
    getManagedAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getSubmissions,
    getMySubmissions,
    gradeSubmission,
} = require('./assignment.controller');
const { protect, staffOnly } = require('../../middlewares/auth.middleware');

// Assignment file upload config
const assignmentStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads', 'assignments')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `submission_${req.user.id}_${Date.now()}${ext}`);
    },
});
const assignmentUpload = multer({
    storage: assignmentStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        // Only allow document and archive types — NO executable code files
        const allowed = ['.pdf', '.doc', '.docx', '.txt', '.zip'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('File type not allowed. Accepted: PDF, DOC, DOCX, TXT, ZIP'));
    },
});

router.get('/', getAssignments);
router.get('/manage', protect, staffOnly, getManagedAssignments);
router.get('/my-submissions', protect, getMySubmissions);
router.get('/:id', getAssignmentById);
router.post('/', protect, staffOnly, createAssignment);
router.put('/:id', protect, staffOnly, updateAssignment);
router.delete('/:id', protect, staffOnly, deleteAssignment);
router.post('/:id/submit', protect, assignmentUpload.single('file'), submitAssignment);
router.get('/:id/submissions', protect, staffOnly, getSubmissions);
router.put('/submissions/:id/grade', protect, staffOnly, gradeSubmission);

module.exports = router;
