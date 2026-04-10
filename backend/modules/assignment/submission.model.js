const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
    {
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment',
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['case_study', 'file_upload', 'code'],
            required: true,
        },
        textContent: {
            type: String,
            trim: true,
        },
        filePath: {
            type: String,
        },
        codeContent: {
            type: String,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        grade: {
            type: Number,
            min: 0,
        },
        feedback: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
