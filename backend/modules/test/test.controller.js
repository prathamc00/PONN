const { Test, Course, QuizAttempt, User } = require('../../models');
const { autoIssueCertificate } = require('../certificate/certificate.controller');

const canManageTest = (test, user) => user.role === 'admin' || String(test.createdBy) === String(user.id);

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

    if (String(course.createdBy) !== String(user.id)) {
        const error = new Error('You can only create quizzes for your own courses');
        error.statusCode = 403;
        throw error;
    }
};

const getManagedTests = async (req, res, next) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
        const tests = await Test.findAll({
            where: filter,
            include: [{ model: Course, attributes: ['title'] }],
            order: [['startTime', 'DESC']]
        });
        res.status(200).json({ success: true, count: tests.length, tests });
    } catch (error) {
        next(error);
    }
};

const getTests = async (req, res, next) => {
    try {
        const tests = await Test.findAll({
            include: [{ model: Course, attributes: ['title'] }],
            order: [['startTime', 'DESC']]
        });
        
        const isAdmin = req.user && req.user.role === 'admin';
        const sanitized = tests.map((t) => {
            const obj = t.toJSON();
            if (!isAdmin) {
                obj.questions = (obj.questions || []).map(({ question, options }) => ({ question, options }));
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
        const test = await Test.findByPk(req.params.id, {
            include: [{ model: Course, attributes: ['title'] }]
        });
        
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        
        const obj = test.toJSON();
        const isAdmin = req.user && req.user.role === 'admin';
        
        if (!isAdmin) {
            obj.questions = (obj.questions || []).map(({ question, options }) => ({ question, options }));
        }
        
        res.status(200).json({ success: true, test: obj });
    } catch (error) {
        next(error);
    }
};

const createTest = async (req, res, next) => {
    try {
        const data = { ...req.body };
        const course = await Course.findByPk(data.course);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseOwnership(course, req.user);
        if (req.user) data.createdBy = req.user.id;
        
        if (data.questions && Array.isArray(data.questions)) {
            data.totalQuestions = data.questions.length;
        }

        const test = await Test.create(data);
        res.status(201).json({ success: true, message: 'Test created', test });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const updateTest = async (req, res, next) => {
    try {
        const test = await Test.findByPk(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        ensureTestAccess(test, req.user);

        if (req.body.course && String(req.body.course) !== String(test.course)) {
            const course = await Course.findByPk(req.body.course);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
            ensureCourseOwnership(course, req.user);
        }

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
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const deleteTest = async (req, res, next) => {
    try {
        const test = await Test.findByPk(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        ensureTestAccess(test, req.user);
        await test.destroy();
        await QuizAttempt.destroy({ where: { quiz: req.params.id } });
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
        const test = await Test.findByPk(req.params.id, {
            include: [{ model: Course, attributes: ['title'] }]
        });
        
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

        const existing = await QuizAttempt.findOne({ where: { quiz: req.params.id, student: req.user.id } });
        
        const questions = (test.questions || []).map((q, i) => ({
            index: i,
            question: q.question,
            options: q.options,
        }));

        if (existing) {
            if (existing.completedAt) {
                return res.status(409).json({ success: false, message: 'You have already completed this quiz.', attempt: existing });
            }
            return res.status(200).json({
                success: true,
                message: 'Quiz resumed',
                attemptId: existing.id,
                startedAt: existing.startedAt,
                quizTitle: test.title,
                courseName: test.Course ? test.Course.title : '',
                durationMinutes: test.durationMinutes,
                endTime: test.endTime,
                questions,
            });
        }

        const attempt = await QuizAttempt.create({
            quiz: req.params.id,
            student: req.user.id,
            startedAt: new Date(),
        });

        res.status(200).json({
            success: true,
            message: 'Quiz started',
            attemptId: attempt.id,
            startedAt: attempt.startedAt,
            quizTitle: test.title,
            courseName: test.Course ? test.Course.title : '',
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

        const test = await Test.findByPk(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const attempt = await QuizAttempt.findOne({ where: { quiz: req.params.id, student: req.user.id } });
        if (!attempt) {
            return res.status(400).json({ success: false, message: 'No active attempt found. Start the quiz first.' });
        }

        if (attempt.completedAt) {
            return res.status(409).json({ success: false, message: 'Quiz already submitted' });
        }

        let score = 0;
        const totalMarks = test.questions ? test.questions.length : 0;
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

        let certificate = null;
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
        if (percentage >= 40) {
            certificate = await autoIssueCertificate(req.user.id, req.params.id);
            const { createNotification } = require('../notification/notification.controller');
            await createNotification(
                req.user.id,
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
            certificate: certificate ? { id: certificate.id, certificateId: certificate.certificateId, grade: certificate.grade } : null,
        });
    } catch (error) {
        next(error);
    }
};

const retakeQuiz = async (req, res, next) => {
    try {
        const attempt = await QuizAttempt.findOne({ 
            where: { quiz: req.params.id, student: req.user.id },
            order: [['completedAt', 'DESC']]
        });
        
        if (!attempt || !attempt.completedAt) {
            return res.status(400).json({ success: false, message: 'No completed attempt found to retake' });
        }
        
        const percentage = attempt.totalMarks > 0 ? (attempt.score / attempt.totalMarks) * 100 : 0;
        if (percentage >= 45) {
            return res.status(403).json({ success: false, message: 'You scored 45% or higher and cannot reattempt this quiz.' });
        }

        await QuizAttempt.destroy({ where: { quiz: req.params.id, student: req.user.id } });
        
        res.status(200).json({ success: true, message: 'Previous attempt cleared. You can now retake the quiz.' });
    } catch (error) {
        next(error);
    }
};

const getMyAttempts = async (req, res, next) => {
    try {
        const attempts = await QuizAttempt.findAll({ 
            where: { student: req.user.id },
            include: [{
                model: Test,
                attributes: ['title', 'course', 'durationMinutes', 'startTime', 'endTime', 'totalQuestions'],
                include: [{ model: Course, attributes: ['title'] }]
            }],
            order: [['completedAt', 'DESC']]
        });

        res.status(200).json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        next(error);
    }
};

const getQuizResults = async (req, res, next) => {
    try {
        const test = await Test.findByPk(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        ensureTestAccess(test, req.user);

        const attempts = await QuizAttempt.findAll({ 
            where: { quiz: req.params.id },
            include: [{ model: User, attributes: ['name', 'email'] }],
            order: [['score', 'DESC']]
        });

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
