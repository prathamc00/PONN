const jwt = require('jsonwebtoken');
const { User } = require('../models');

const getTokenFromRequest = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }

    return null;
};

const ensureApprovedAccess = (user) => {
    const approvalStatus = user.approvalStatus || 'approved';

    if (user.role === 'instructor' && approvalStatus !== 'approved') {
        const message = approvalStatus === 'rejected'
            ? 'Your instructor account has been rejected. Please contact the admin.'
            : 'Your instructor account is pending admin approval.';

        const error = new Error(message);
        error.statusCode = 403;
        throw error;
    }
};

const loadUserFromToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 401;
        throw error;
    }

    return user;
};

const protect = async (req, res, next) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        req.user = await loadUserFromToken(token);
        ensureApprovedAccess(req.user);

        next();
    } catch (error) {
        return res.status(error.statusCode || 401).json({ success: false, message: error.message || 'Not authorized, token invalid' });
    }
};

const optionalAuth = async (req, res, next) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return next();
    }

    try {
        req.user = await loadUserFromToken(token);
        ensureApprovedAccess(req.user);
    } catch (_) {
        req.user = null;
    }

    next();
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
};

const staffOnly = (req, res, next) => {
    const approvalStatus = req.user?.approvalStatus || 'approved';
    if (req.user && (req.user.role === 'admin' || (req.user.role === 'instructor' && approvalStatus === 'approved'))) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Approved instructors or admins only.' });
};

const instructorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'instructor') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied. Instructors only.' });
};

/**
 * Flexible role guard factory.
 * Usage: router.get('/path', protect, roleIn('admin', 'instructor'), handler)
 */
const roleIn = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ success: false, message: `Access denied. Required role(s): ${roles.join(', ')}.` });
};

module.exports = { protect, optionalAuth, adminOnly, staffOnly, instructorOnly, roleIn };


