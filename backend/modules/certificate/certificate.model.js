const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required'],
        },
        title: {
            type: String,
            required: [true, 'Certificate title is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['course_completion', 'quiz_pass'],
            default: 'course_completion',
        },
        grade: {
            type: String,
            trim: true,
        },
        scorePercent: {
            type: Number,
            min: 0,
            max: 100,
        },
        earnedDate: {
            type: Date,
            default: Date.now,
        },
        certificateId: {
            type: String,
            unique: true,
        },
    },
    { timestamps: true }
);

// One certificate per user per course per type
certificateSchema.index({ user: 1, course: 1, type: 1 }, { unique: true });

// Auto-generate a unique certificate ID
certificateSchema.pre('save', function (next) {
    if (!this.certificateId) {
        const prefix = 'CRSM';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.certificateId = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
