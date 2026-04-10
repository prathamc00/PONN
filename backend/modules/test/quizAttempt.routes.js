const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const QuizAttempt = require('./quizAttempt.model');

// @desc    Get all quiz attempts (for current user or admin)
// @route   GET /api/quiz-attempts
router.get('/', protect, async (req, res, next) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { student: req.user._id };
        const attempts = await QuizAttempt.find(filter)
            .populate({
                path: 'quiz',
                select: 'title course durationMinutes startTime endTime totalQuestions',
                populate: { path: 'course', select: 'title' },
            })
            .populate('student', 'name email')
            .sort({ completedAt: -1 });

        res.status(200).json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
