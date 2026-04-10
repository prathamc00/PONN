const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    videoUrl: { type: String },
    notesUrl: { type: String },
    duration: { type: String, default: '' }, // e.g. "12:30" or "1h 15m"
    order: { type: Number, default: 0 },
});

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        instructor: {
            type: String,
            required: [true, 'Instructor is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner',
        },
        lessons: {
            type: Number,
            min: 1,
            default: 1,
        },
        durationHours: {
            type: Number,
            min: 1,
            default: 1,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        modules: [moduleSchema],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        enrolledStudents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
