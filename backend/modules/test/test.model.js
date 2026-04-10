const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true, min: 0 },
});

const testSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Test title is required'],
            trim: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required'],
        },
        questions: [questionSchema],
        totalQuestions: {
            type: Number,
            min: 1,
            required: true,
        },
        durationMinutes: {
            type: Number,
            min: 1,
            required: true,
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
        },
        status: {
            type: String,
            enum: ['upcoming', 'active', 'completed'],
            default: 'upcoming',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Test', testSchema);
