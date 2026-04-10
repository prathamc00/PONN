const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = 'Invalid resource ID specified';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }

    // CORS error
    if (err.message && err.message.startsWith('CORS:')) {
        statusCode = 403;
        message = 'Request blocked by CORS policy';
    }

    // Always log the real error server-side
    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.originalUrl} — ${err.message}`, { stack: err.stack });
        // In production hide internals from client
        if (process.env.NODE_ENV === 'production') {
            message = 'Internal Server Error';
        }
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = { errorHandler };

