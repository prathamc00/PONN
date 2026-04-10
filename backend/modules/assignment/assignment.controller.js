const Assignment = require('./assignment.model');
const Course = require('../course/course.model');
const Submission = require('./submission.model');

const canManageAssignment = (assignment, user) => user.role === 'admin' || String(assignment.createdBy) === String(user._id);

const ensureAssignmentAccess = (assignment, user) => {
    if (!canManageAssignment(assignment, user)) {
        const error = new Error('You can only manage assignments that you created');
        error.statusCode = 403;
        throw error;
    }
};

const ensureCourseOwnership = (course, user) => {
    if (user.role === 'admin') {
        return;
    }

    if (String(course.createdBy) !== String(user._id)) {
        const error = new Error('You can only create assignments for your own courses');
        error.statusCode = 403;
        throw error;
    }
};

const getManagedAssignments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const skip = (page - 1) * limit;

        const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const assignments = await Assignment.find(filter).populate('course', 'title').sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.status(200).json({ success: true, count: assignments.length, page, limit, assignments });
    } catch (error) {
        next(error);
    }
};

const getAssignments = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const skip = (page - 1) * limit;

        const assignments = await Assignment.find({}).populate('course', 'title').sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.status(200).json({ success: true, count: assignments.length, page, limit, assignments });
    } catch (error) {
        next(error);
    }
};

const getAssignmentById = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id).populate('course', 'title');
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }
        res.status(200).json({ success: true, assignment });
    } catch (error) {
        next(error);
    }
};

const createAssignment = async (req, res, next) => {
    try {
        const data = { ...req.body };
        const course = await Course.findById(data.course);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseOwnership(course, req.user);
        if (req.user) data.createdBy = req.user._id;
        const assignment = await Assignment.create(data);
        res.status(201).json({ success: true, message: 'Assignment created', assignment });
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

const updateAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        ensureAssignmentAccess(assignment, req.user);

        if (req.body.course && String(req.body.course) !== String(assignment.course)) {
            const course = await Course.findById(req.body.course);
            if (!course) {
                return res.status(404).json({ success: false, message: 'Course not found' });
            }
            ensureCourseOwnership(course, req.user);
        }

        Object.assign(assignment, req.body);
        await assignment.save();
        res.status(200).json({ success: true, message: 'Assignment updated', assignment });
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

const deleteAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        ensureAssignmentAccess(assignment, req.user);
        await assignment.deleteOne();
        await Submission.deleteMany({ assignment: req.params.id });
        res.status(200).json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const submitAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        const existing = await Submission.findOne({ assignment: req.params.id, student: req.user._id });
        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already submitted this assignment' });
        }

        const submissionData = {
            assignment: req.params.id,
            student: req.user._id,
            type: assignment.type,
        };

        if (assignment.type === 'case_study') {
            submissionData.textContent = req.body.textContent;
        } else if (assignment.type === 'code') {
            submissionData.codeContent = req.body.codeContent;
        } else if (assignment.type === 'file_upload' && req.file) {
            submissionData.filePath = req.file.path.replace(/\\/g, '/');
        }

        const submission = await Submission.create(submissionData);
        res.status(201).json({ success: true, message: 'Assignment submitted successfully', submission });
    } catch (error) {
        next(error);
    }
};

const getSubmissions = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        ensureAssignmentAccess(assignment, req.user);

        const submissions = await Submission.find({ assignment: req.params.id })
            .populate('student', 'name email')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, count: submissions.length, submissions });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getMySubmissions = async (req, res, next) => {
    try {
        const submissions = await Submission.find({ student: req.user._id })
            .populate('assignment', 'title course type dueDate maxMarks')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, count: submissions.length, submissions });
    } catch (error) {
        next(error);
    }
};

const gradeSubmission = async (req, res, next) => {
    try {
        const { grade, feedback } = req.body;
        const submission = await Submission.findById(req.params.id).populate('assignment');

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        ensureAssignmentAccess(submission.assignment, req.user);

        submission.grade = grade;
        submission.feedback = feedback;
        await submission.save();

        res.status(200).json({ success: true, message: 'Submission graded', submission });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

module.exports = {
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
};
