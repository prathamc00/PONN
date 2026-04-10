const { Course, CourseProgress, Attendance } = require('../../models');
const path = require('path');

const canManageCourse = (course, user) => user.role === 'admin' || String(course.createdBy) === String(user.id);

const ensureCourseAccess = (course, user) => {
    if (!canManageCourse(course, user)) {
        const error = new Error('You can only manage courses that you created');
        error.statusCode = 403;
        throw error;
    }
};

const getManagedCourses = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const offset = (page - 1) * limit;

        const where = req.user.role === 'admin' ? {} : { createdBy: req.user.id };
        const { count, rows: courses } = await Course.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });
        res.status(200).json({ success: true, count, page, limit, courses });
    } catch (error) {
        next(error);
    }
};

const getCourses = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const offset = (page - 1) * limit;

        const { count, rows: courses } = await Course.findAndCountAll({
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });
        res.status(200).json({ success: true, count, page, limit, courses });
    } catch (error) {
        next(error);
    }
};

const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: ['enrolledStudents'] // using the association from index.js
        });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        const obj = course.toJSON();
        const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'instructor');
        
        let isEnrolled = false;
        if (req.user && obj.enrolledStudents) {
            isEnrolled = obj.enrolledStudents.some(s => String(s.id) === String(req.user.id));
        }

        // Attach isEnrolled flag for authenticated students
        if (req.user) {
            obj.isEnrolled = isEnrolled;
            obj.enrolledCount = obj.enrolledStudents ? obj.enrolledStudents.length : 0;
        }

        // Avoid sending full user objects
        delete obj.enrolledStudents;

        // Strip video/notes URLs for non-enrolled, non-staff users
        if (!isStaff && !isEnrolled && obj.modules) {
            obj.modules = obj.modules.map(m => ({
                id: m.id || m._id, // Handle potential old string IDs temporarily
                title: m.title,
                description: m.description,
                duration: m.duration,
                order: m.order,
                // videoUrl and notesUrl intentionally omitted
            }));
        }                                                 

        res.status(200).json({ success: true, course: obj });
    } catch (error) {
        next(error);
    }
};

const createCourse = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (req.user) {
            data.createdBy = req.user.id;
            if (req.user.role === 'instructor') {
                data.instructor = req.user.name;
            }
        }
        const course = await Course.create(data);
        res.status(201).json({ success: true, message: 'Course created', course });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'ValidationError') {
            const messages = error.errors.map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        next(error);
    }
};

const updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseAccess(course, req.user);

        Object.assign(course, req.body);
        if (req.user.role === 'instructor') {
            course.instructor = req.user.name;
        }

        await course.save();
        res.status(200).json({ success: true, message: 'Course updated', course });
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

const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseAccess(course, req.user);
        await course.destroy();
        res.status(200).json({ success: true, message: 'Course deleted' });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const getModules = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, { attributes: ['title', 'modules'] });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const modules = course.modules || [];
        const sorted = [...modules].sort((a, b) => a.order - b.order);
        res.status(200).json({ success: true, courseTitle: course.title, count: sorted.length, modules: sorted });
    } catch (error) {
        next(error);
    }
};

const addModule = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseAccess(course, req.user);

        const modules = [...(course.modules || [])];
        const moduleData = {
            id: require('crypto').randomUUID(), // fake id for embedded JSON array items
            title: req.body.title,
            description: req.body.description || '',
            duration: req.body.duration || '',
            order: req.body.order !== undefined ? Number(req.body.order) : modules.length,
        };

        if (req.files && req.files.video && req.files.video[0]) {
            moduleData.videoUrl = 'uploads/videos/' + req.files.video[0].filename;
        }

        if (req.files && req.files.notes && req.files.notes[0]) {
            moduleData.notesUrl = 'uploads/notes/' + req.files.notes[0].filename;
        }

        modules.push(moduleData);
        course.modules = modules;
        course.lessons = modules.length;
        await course.save();

        res.status(201).json({ success: true, message: 'Lesson added', course });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const updateModule = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseAccess(course, req.user);

        let modules = [...(course.modules || [])];
        const modIndex = modules.findIndex(m => m.id === req.params.moduleId || m._id === req.params.moduleId);
        
        if (modIndex === -1) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        const mod = modules[modIndex];

        if (req.body.title !== undefined) mod.title = req.body.title;
        if (req.body.description !== undefined) mod.description = req.body.description;
        if (req.body.duration !== undefined) mod.duration = req.body.duration;
        if (req.body.order !== undefined) mod.order = Number(req.body.order);

        if (req.files && req.files.video && req.files.video[0]) {
            mod.videoUrl = 'uploads/videos/' + req.files.video[0].filename;
        }

        if (req.files && req.files.notes && req.files.notes[0]) {
            mod.notesUrl = 'uploads/notes/' + req.files.notes[0].filename;
        }

        modules[modIndex] = mod;
        course.modules = modules;
        
        // Sequelize needs explicit notification that JSON changed
        course.changed('modules', true);
        await course.save();
        
        res.status(200).json({ success: true, message: 'Lesson updated', course });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const deleteModule = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseAccess(course, req.user);

        let modules = [...(course.modules || [])];
        modules = modules.filter((m) => String(m.id || m._id) !== String(req.params.moduleId));
        modules.forEach((m, i) => { m.order = i; });
        course.modules = modules;
        course.lessons = modules.length || 0;
        
        course.changed('modules', true);
        await course.save();

        res.status(200).json({ success: true, message: 'Lesson deleted', course });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const reorderModules = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        ensureCourseAccess(course, req.user);

        const { moduleOrder } = req.body;
        if (!Array.isArray(moduleOrder)) {
            return res.status(400).json({ success: false, message: 'moduleOrder must be an array of module IDs' });
        }

        let modules = [...(course.modules || [])];
        moduleOrder.forEach((id, idx) => {
            const mod = modules.find(m => String(m.id || m._id) === String(id));
            if (mod) mod.order = idx;
        });

        course.modules = modules;
        course.changed('modules', true);
        await course.save();
        
        const sorted = [...course.modules].sort((a, b) => a.order - b.order);
        res.status(200).json({ success: true, message: 'Lessons reordered', modules: sorted });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const enrollCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        const hasEnrolled = await course.hasEnrolledStudent(req.user.id);
        if (hasEnrolled) {
            return res.status(409).json({ success: false, message: 'Already enrolled in this course' });
        }
        
        await course.addEnrolledStudent(req.user.id);

        // Track attendance for this enrollment event
        await Attendance.create({
            student: req.user.id,
            course: course.id,
            activityType: 'login',
            details: `Enrolled in course: ${course.title}`,
        });

        // Fire Real-Time Notification via WebSockets
        const { createNotification } = require('../notification/notification.controller');
        await createNotification(
            req.user.id, 
            'Course Enrolled 🎉', 
            `You have successfully enrolled in ${course.title}. Start learning now!`,
            'success',
            `/courses/${course.id}`
        );
        
        const enrolledCount = await course.countEnrolledStudents();

        res.status(200).json({ success: true, message: 'Enrolled successfully', enrolledCount });
    } catch (error) {
        next(error);
    }
};

const unenrollCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        await course.removeEnrolledStudent(req.user.id);
        res.status(200).json({ success: true, message: 'Unenrolled successfully' });
    } catch (error) {
        next(error);
    }
};

const getMyEnrollments = async (req, res, next) => {
    try {
        // Query courses through the User model's association
        const { User } = require('../../models');
        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Course,
                as: 'enrolledCourses',
                through: { attributes: [] }
            }]
        });
        const courses = user ? user.enrolledCourses : [];
        res.status(200).json({ success: true, count: courses.length, courses });
    } catch (error) {
        next(error);
    }
};

const getCourseProgress = async (req, res, next) => {
    try {
        const progress = await CourseProgress.findOne({ where: { student: req.user.id, course: req.params.id } });
        res.status(200).json({ success: true, completedModules: progress ? progress.completedModules : [] });
    } catch (error) {
        next(error);
    }
};

const markModuleComplete = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        const modules = course.modules || [];
        const mod = modules.find(m => String(m.id || m._id) === String(req.params.moduleId));
        if (!mod) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        let progress = await CourseProgress.findOne({ where: { student: req.user.id, course: req.params.id } });
        if (!progress) {
            progress = await CourseProgress.create({ student: req.user.id, course: req.params.id, completedModules: [] });
        }

        const alreadyDone = progress.completedModules.some(mid => String(mid) === String(req.params.moduleId));
        if (!alreadyDone) {
            let completed = [...progress.completedModules];
            completed.push(req.params.moduleId);
            progress.completedModules = completed;
            progress.changed('completedModules', true);
            await progress.save();
        }

        res.status(200).json({ success: true, message: 'Module marked as complete', completedModules: progress.completedModules });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCourses, getManagedCourses, getCourseById, createCourse, updateCourse, deleteCourse, getModules, addModule, updateModule, deleteModule, reorderModules, enrollCourse, unenrollCourse, getMyEnrollments, getCourseProgress, markModuleComplete };
