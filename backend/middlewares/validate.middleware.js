const { validationResult } = require('express-validator');

/**
 * Runs gathered express-validator rules and returns 422 with
 * a structured errors array if any validation failed.
 *
 * Usage:
 *   router.post('/login', [body('email').isEmail(), ...], validate, handler)
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

module.exports = { validate };
