const Attendance = require('./attendance.model');

const trackActivity = async (req, res, next) => {
    try {
        const { courseId, activityType, details } = req.body;

        if (!activityType) {
            return res.status(400).json({ success: false, message: 'Activity type is required' });
        }

        const record = await Attendance.create({
            student: req.user._id,
            course: courseId || null,
            activityType,
            // Coerce to string and cap length to prevent NoSQL injection / oversized payloads
            details: typeof details === 'string' ? details.trim().substring(0, 500) : '',
        });

        res.status(201).json({ success: true, message: 'Activity tracked', record });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const getMyAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.find({ student: req.user._id })
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

const getCourseAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.find({ course: req.params.courseId })
            .populate('student', 'name email')
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

const getAllAttendance = async (req, res, next) => {
    try {
        const records = await Attendance.find({})
            .populate('student', 'name email')
            .populate('course', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: records.length, records });
    } catch (error) {
        next(error);
    }
};

module.exports = { trackActivity, getMyAttendance, getCourseAttendance, getAllAttendance };
