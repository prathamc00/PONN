const mongoose = require('mongoose');

const MAX_OTP_ATTEMPTS = 5;

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // Document automatically expires after 5 minutes
    },
});

module.exports = mongoose.model('Otp', otpSchema);
module.exports.MAX_OTP_ATTEMPTS = MAX_OTP_ATTEMPTS;
