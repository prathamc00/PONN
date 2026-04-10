const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Assignment title is required'],
            trim: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required'],
        },
        type: {
            type: String,
            enum: ['case_study', 'file_upload', 'code'],
            required: [true, 'Assignment type is required'],
        },
        instructions: {
            type: String,
            trim: true,
        },
        module: {
            type: String,
            trim: true,
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        maxMarks: {
            type: Number,
            min: 1,
            default: 100,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
