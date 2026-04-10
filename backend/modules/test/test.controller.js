const Test = require('./test.model');
const Course = require('../course/course.model');
const QuizAttempt = require('./quizAttempt.model');
const { autoIssueCertificate } = require('../certificate/certificate.controller');

const canManageTest = (test, user) => user.role === 'admin' || String(test.createdBy) === String(user._id);

const ensureTestAccess = (test, user) => {
    if (!canManageTest(test, user)) {
        const error = new Error('You can only manage quizzes that you created');
        error.statusCode = 403;
        throw error;
    }
};

const ensureCourseOwnership = (course, user) => {
    if (user.role === 'admin') {
        return;
    }

    if (String(course.createdBy) !== String(user._id)) {
        const error = new Error('You can only create quizzes for your own courses');
        error.statusCode = 403;
        throw error;
    }
};

const getManagedTests = async (req, res, next) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const tests = await Test.find(filter).populate('course', 'title').sort({ startTime: -1 });
        res.status(200).json({ success: true, count: tests.length, tests });
    } catch (error) {
        next(error);
    }
};

const getTests = async (req, res, next) => {
    try {
        const tests = await Test.find({}).populate('course', 'title').sort({ startTime: -1 });
        const isAdmin = req.user && req.user.role === 'admin';
        const sanitized = tests.map((t) => {
            const obj = t.toObject();
            if (!isAdmin) {
                obj.questions = obj.questions.map(({ question, options }) => ({ question, options }));
            }
            return obj;
        });
        res.status(200).json({ success: true, count: sanitized.length, tests: sanitized });
    } catch (error) {
        next(error);
    }
};

const getTestById = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id).populate('course', 'title');
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        const obj = test.toObject();
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAdmin) {
            obj.questions = obj.questions.map(({ question, options }) => ({ question, options }));
        }
        res.status(200).json({ success: true, test: obj });
    } catch (error) {
        next(error);
    }
};

const createTest = async (req, res, next) => {
    try {
        const data = { ...req.body };
        const course = await Course.findById(data.course);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseOwnership(course, req.user);
        if (req.user) data.createdBy = req.user._id;
        
        // Auto-compute totalQuestions based on the provided questions array
        if (data.questions && Array.isArray(data.questions)) {
            data.totalQuestions = data.questions.length;
        }

        const test = await Test.create(data);
        res.status(201).json({ success: true, message: 'Test created', test });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const updateTest = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        ensureTestAccess(test, req.user);

        if (req.body.course && String(req.body.course) !== String(test.course)) {
            const course = await Course.findById(req.body.course);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
            ensureCourseOwnership(course, req.user);
        }

        // Auto-compute totalQuestions based on the provided questions array
        if (req.body.questions && Array.isArray(req.body.questions)) {
            req.body.totalQuestions = req.body.questions.length;
        }

        Object.assign(test, req.body);
        await test.save();
        res.status(200).json({ success: true, message: 'Test updated', test });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const deleteTest = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        ensureTestAccess(test, req.user);
        await test.deleteOne();
        await QuizAttempt.deleteMany({ quiz: req.params.id });
        res.status(200).json({ success: true, message: 'Test deleted' });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const startQuiz = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id).populate('course', 'title');
        if (!test) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const now = new Date();
        if (now < new Date(test.startTime)) {
            return res.status(400).json({ success: false, message: 'Quiz has not started yet' });
        }
        if (now > new Date(test.endTime)) {
            return res.status(400).json({ success: false, message: 'Quiz has ended' });
        }

        const existing = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user._id });
        
        const questions = test.questions.map((q, i) => ({
            index: i,
            question: q.question,
            options: q.options,
        }));

        if (existing) {
            if (existing.completedAt) {
                return res.status(409).json({ success: false, message: 'You have already completed this quiz.', attempt: existing });
            }
            // Resume active attempt
            return res.status(200).json({
                success: true,
                message: 'Quiz resumed',
                attemptId: existing._id,
                startedAt: existing.startedAt,
                quizTitle: test.title,
                courseName: test.course ? test.course.title : '',
                durationMinutes: test.durationMinutes,
                endTime: test.endTime,
                questions,
            });
        }

        const attempt = await QuizAttempt.create({
            quiz: req.params.id,
            student: req.user._id,
            startedAt: new Date(),
        });

        res.status(200).json({
            success: true,
            message: 'Quiz started',
            attemptId: attempt._id,
            startedAt: attempt.startedAt,
            quizTitle: test.title,
            courseName: test.course ? test.course.title : '',
            durationMinutes: test.durationMinutes,
            endTime: test.endTime,
            questions,
        });
    } catch (error) {
        next(error);
    }
};

const submitQuiz = async (req, res, next) => {
    try {
        const { answers, tabSwitchCount } = req.body;

        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user._id });
        if (!attempt) {
            return res.status(400).json({ success: false, message: 'No active attempt found. Start the quiz first.' });
        }

        if (attempt.completedAt) {
            return res.status(409).json({ success: false, message: 'Quiz already submitted' });
        }

        let score = 0;
        const totalMarks = test.questions.length;
        if (Array.isArray(answers)) {
            answers.forEach((ans) => {
                const q = test.questions[ans.questionIndex];
                if (q && ans.selectedAnswer === q.correctAnswer) {
                    score++;
                }
            });
        }

        attempt.answers = answers || [];
        attempt.score = score;
        attempt.totalMarks = totalMarks;
        attempt.tabSwitchCount = tabSwitchCount || 0;
        attempt.completedAt = new Date();
        await attempt.save();

        // Auto-issue certificate if score >= 40%
        let certificate = null;
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
        if (percentage >= 40) {
            certificate = await autoIssueCertificate(req.user._id, req.params.id);
            const { createNotification } = require('../notification/notification.controller');
            await createNotification(
                req.user._id,
                'Certificate Earned 🏆',
                `Congratulations! You passed the quiz for ${test.title} with a score of ${percentage}%. Your certificate is ready.`,
                'success',
                '/certificate'
            );
        }

        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully',
            score,
            totalMarks,
            percentage,
            tabSwitchCount: attempt.tabSwitchCount,
            certificate: certificate ? { id: certificate._id, certificateId: certificate.certificateId, grade: certificate.grade } : null,
        });
    } catch (error) {
        next(error);
    }
};

const retakeQuiz = async (req, res, next) => {
    try {
        const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user._id }).sort({ completedAt: -1 });
        if (!attempt || !attempt.completedAt) {
            return res.status(400).json({ success: false, message: 'No completed attempt found to retake' });
        }
        
        const percentage = attempt.totalMarks > 0 ? (attempt.score / attempt.totalMarks) * 100 : 0;
        if (percentage >= 45) {
            return res.status(403).json({ success: false, message: 'You scored 45% or higher and cannot reattempt this quiz.' });
        }

        // Allow retake by deleting previous attempts
        await QuizAttempt.deleteMany({ quiz: req.params.id, student: req.user._id });
        
        res.status(200).json({ success: true, message: 'Previous attempt cleared. You can now retake the quiz.' });
    } catch (error) {
        next(error);
    }
};

const getMyAttempts = async (req, res, next) => {
    try {
        const attempts = await QuizAttempt.find({ student: req.user._id })
            .populate({
                path: 'quiz',
                select: 'title course durationMinutes startTime endTime totalQuestions',
                populate: { path: 'course', select: 'title' },
            })
            .sort({ completedAt: -1 });

        res.status(200).json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        next(error);
    }
};

const getQuizResults = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        ensureTestAccess(test, req.user);

        const attempts = await QuizAttempt.find({ quiz: req.params.id })
            .populate('student', 'name email')
            .sort({ score: -1 });

        res.status(200).json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
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
};
