const { Certificate, QuizAttempt, Test, Course, User } = require('../../models');

// Student: get my certificates
const getMyCertificates = async (req, res, next) => {
    try {
        const certificates = await Certificate.findAll({
            where: { student: req.user.id }, // changed 'user' to 'student' to match index.js association
            include: [{ model: Course, attributes: ['title', 'category', 'instructor', 'level'] }],
            order: [['earnedDate', 'DESC']]
        });
        res.status(200).json({ success: true, count: certificates.length, certificates });
    } catch (error) {
        next(error);
    }
};

// Admin: get all certificates
const getCertificates = async (req, res, next) => {
    try {
        const certificates = await Certificate.findAll({
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: Course, attributes: ['title', 'category'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, count: certificates.length, certificates });
    } catch (error) {
        next(error);
    }
};

const getCertificateById = async (req, res, next) => {
    try {
        const certificate = await Certificate.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['name', 'email', 'college', 'branch'] },
                { model: Course, attributes: ['title', 'category', 'instructor', 'level'] }
            ]
        });
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        res.status(200).json({ success: true, certificate });
    } catch (error) {
        next(error);
    }
};

// Verify a certificate by its public certificateId
const verifyCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findOne({
            where: { certificateId: req.params.certId },
            include: [
                { model: User, attributes: ['name', 'email', 'college'] },
                { model: Course, attributes: ['title', 'category', 'instructor'] }
            ]
        });
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
        }
        res.status(200).json({ success: true, certificate });
    } catch (error) {
        next(error);
    }
};

// Helper: compute letter grade from percentage
const getGrade = (percent) => {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B+';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C';
    return 'D';
};

// Auto-issue certificate after quiz completion (called from test controller)
const autoIssueCertificate = async (userId, quizId) => {
    try {
        const attempt = await QuizAttempt.findOne({ where: { quiz: quizId, student: userId } });
        if (!attempt || !attempt.completedAt) return null;

        const test = await Test.findByPk(quizId, {
            include: [{ model: Course, attributes: ['title'] }]
        });
        if (!test || !test.course) return null;

        const scorePercent = attempt.totalMarks > 0
            ? Math.round((attempt.score / attempt.totalMarks) * 100)
            : 0;

        // Only issue certificate if student scored >= 40%
        if (scorePercent < 40) return null;

        // Check if certificate already exists
        const existing = await Certificate.findOne({
            where: {
                student: userId,
                course: test.course,
                type: 'quiz_pass',
            }
        });
        if (existing) return existing;

        const cert = await Certificate.create({
            student: userId,
            course: test.course,
            title: `${test.Course ? test.Course.title : 'Course'} — Quiz Completion`,
            type: 'quiz_pass',
            grade: getGrade(scorePercent),
            scorePercent,
            earnedDate: new Date(),
        });

        return cert;
    } catch (error) {
        console.error('[Certificate] Auto-issue error:', error.message);
        return null;
    }
};

// Admin: manually create certificate
const createCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.create(req.body);
        res.status(201).json({ success: true, message: 'Certificate created', certificate });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Certificate already exists for this user/course/type' });
        }
        next(error);
    }
};

const deleteCertificate = async (req, res, next) => {
    try {
        const certificate = await Certificate.findByPk(req.params.id);
        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }
        await certificate.destroy();
        res.status(200).json({ success: true, message: 'Certificate deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCertificates,
    getMyCertificates,
    getCertificateById,
    verifyCertificate,
    createCertificate,
    deleteCertificate,
    autoIssueCertificate,
};
