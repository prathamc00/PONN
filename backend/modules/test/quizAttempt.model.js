const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
    {
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test',
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        answers: [
            {
                questionIndex: { type: Number, required: true },
                selectedAnswer: { type: Number, required: true },
            },
        ],
        score: {
            type: Number,
            min: 0,
            default: 0,
        },
        totalMarks: {
            type: Number,
            min: 0,
            default: 0,
        },
        tabSwitchCount: {
            type: Number,
            default: 0,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// One attempt per student per quiz
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
