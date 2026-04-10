const User = require('../auth/auth.model');

const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const skip = (page - 1) * limit;

        const users = await User.find({}).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.status(200).json({ success: true, count: users.length, page, limit, users });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const updateInstructorStatus = async (req, res, next) => {
    try {
        const { approvalStatus } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid approval status' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'instructor') {
            return res.status(400).json({ success: false, message: 'Only instructor accounts can be approved or rejected' });
        }

        user.approvalStatus = approvalStatus;
        await user.save();

        res.status(200).json({ success: true, message: `Instructor ${approvalStatus} successfully`, user });
    } catch (error) {
        next(error);
    }
};

const exportUsersCSV = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });

        let csv = 'Name,Email,Role,College,Branch,Semester,Phone,Status,Joined Date\n';

        users.forEach((u) => {
            const name = `"${String(u.name || '').replace(/"/g, '""')}"`;
            const email = `"${String(u.email || '').replace(/"/g, '""')}"`;
            const role = `"${String(u.role || '').replace(/"/g, '""')}"`;
            const college = `"${String(u.college || '').replace(/"/g, '""')}"`;
            const branch = `"${String(u.branch || '').replace(/"/g, '""')}"`;
            const semester = `"${String(u.semester || '').replace(/"/g, '""')}"`;
            const phone = `"${String(u.phone || '').replace(/"/g, '""')}"`;
            const status = `"${String(u.approvalStatus || '').replace(/"/g, '""')}"`;
            const date = u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '';

            csv += `${name},${email},${role},${college},${branch},${semester},${phone},${status},${date}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

const verifyAadhaar = async (req, res, next) => {
    try {
        const { aadhaarVerified } = req.body;
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.aadhaarVerified = aadhaarVerified;
        await user.save();
        
        res.status(200).json({ success: true, message: 'Aadhaar status updated', user });
    } catch (error) {
        next(error);
    }
};

const addInstructor = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const instructor = await User.create({
            name,
            email,
            password,
            phone,
            role: 'instructor',
            approvalStatus: 'approved'
        });

        res.status(201).json({
            success: true,
            message: 'Instructor created successfully',
            instructor: {
                _id: instructor._id,
                name: instructor.name,
                email: instructor.email,
                role: instructor.role
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getUsers, deleteUser, updateInstructorStatus, exportUsersCSV, verifyAadhaar, addInstructor };
