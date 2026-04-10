const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const Submission = require('./submission.model');

// @desc    Get all submissions (for current user or admin)
// @route   GET /api/submissions
router.get('/', protect, async (req, res, next) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { student: req.user._id };
        const submissions = await Submission.find(filter)
            .populate('assignment', 'title course type dueDate maxMarks')
            .populate('student', 'name email')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, count: submissions.length, submissions });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
