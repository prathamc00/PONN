const { Attendance, Course, User } = require('../../models');

const trackActivity = async (req, res, next) => {
    try {
        const { courseId, activityType, details } = req.body;

        if (!activityType) {
            return res.status(400).json({ success: false, message: 'Activity type is required' });
        }

        const record = await Attendance.create({
            student: req.user.id,
            course: courseId || null,
            activityType,
            details: typeof details === 'string' ? details.trim().substring(0, 500) : '',
        });

        res.status(201).json({ success: true, message: 'Activity tracked', record });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.findAll({
            where: { student: req.user.id },
            include: [{ model: Course, attributes: ['title'] }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

const getCourseAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.findAll({
            where: { course: req.params.courseId },
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: Course, attributes: ['title'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

const getAllAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.findAll({
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: Course, attributes: ['title'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

module.exports = { trackActivity, getMyAttendance, getCourseAttendance, getAllAttendance };
