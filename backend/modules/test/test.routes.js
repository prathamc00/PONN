const express = require('express');
const router = express.Router();
const {
    getTests,
    getManagedTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    startQuiz,
    submitQuiz,
    retakeQuiz,
    getMyAttempts,
    getQuizResults,
} = require('./test.controller');
const { protect, optionalAuth, staffOnly } = require('../../middlewares/auth.middleware');

router.get('/', optionalAuth, getTests);
router.get('/manage', protect, staffOnly, getManagedTests);
router.get('/my-attempts', protect, getMyAttempts);
router.get('/:id', optionalAuth, getTestById);
router.post('/', protect, staffOnly, createTest);
router.put('/:id', protect, staffOnly, updateTest);
router.delete('/:id', protect, staffOnly, deleteTest);
router.post('/:id/start', protect, startQuiz);
router.post('/:id/submit', protect, submitQuiz);
router.post('/:id/retake', protect, retakeQuiz);
router.get('/:id/results', protect, staffOnly, getQuizResults);

module.exports = router;
