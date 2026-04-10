const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Import model defining functions
const defineUser = require('../modules/auth/auth.model');
const defineOtp = require('../modules/otp/otp.model');
const defineCourse = require('../modules/course/course.model');
const defineCourseProgress = require('../modules/course/courseProgress.model');
const defineAttendance = require('../modules/attendance/attendance.model');
const defineTest = require('../modules/test/test.model');
const defineQuizAttempt = require('../modules/test/quizAttempt.model');
const defineNotification = require('../modules/notification/notification.model');
const defineCertificate = require('../modules/certificate/certificate.model');
const defineAssignment = require('../modules/assignment/assignment.model');
const defineSubmission = require('../modules/assignment/submission.model');

// Define models
const User = defineUser(sequelize, DataTypes);
const Otp = defineOtp(sequelize, DataTypes);
const Course = defineCourse(sequelize, DataTypes);
const CourseProgress = defineCourseProgress(sequelize, DataTypes);
const Attendance = defineAttendance(sequelize, DataTypes);
const Test = defineTest(sequelize, DataTypes);
const QuizAttempt = defineQuizAttempt(sequelize, DataTypes);
const Notification = defineNotification(sequelize, DataTypes);
const Certificate = defineCertificate(sequelize, DataTypes);
const Assignment = defineAssignment(sequelize, DataTypes);
const Submission = defineSubmission(sequelize, DataTypes);

const models = {
    User, Otp, Course, CourseProgress, Attendance,
    Test, QuizAttempt, Notification, Certificate, Assignment, Submission
};

// Define Associations

// User ENROLLED_COURSES (Many-to-Many or similar, but the original was User has array of Course ObjectIds)
// Mongoose uses array of refs `enrolledCourses: [{ type: ObjectId, ref: 'Course' }]`.
// Let's use a junction table: UserCourses
User.belongsToMany(Course, { as: 'enrolledCourses', through: 'UserCourses', foreignKey: 'userId', otherKey: 'courseId' });
Course.belongsToMany(User, { as: 'enrolledStudents', through: 'UserCourses', foreignKey: 'courseId', otherKey: 'userId' });

// Courses are created by User
Course.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Course, { as: 'createdCourses', foreignKey: 'createdBy' });

// CourseProgress
CourseProgress.belongsTo(User, { foreignKey: 'student' });
CourseProgress.belongsTo(Course, { foreignKey: 'course' });
User.hasMany(CourseProgress, { foreignKey: 'student' });
Course.hasMany(CourseProgress, { foreignKey: 'course' });

// Attendance
Attendance.belongsTo(User, { foreignKey: 'student' });
Attendance.belongsTo(Course, { foreignKey: 'course' });

// Test
Test.belongsTo(Course, { foreignKey: 'course' });
Test.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Course.hasMany(Test, { foreignKey: 'course' });

// QuizAttempt
QuizAttempt.belongsTo(Test, { foreignKey: 'quiz' });
QuizAttempt.belongsTo(User, { foreignKey: 'student' });
Test.hasMany(QuizAttempt, { foreignKey: 'quiz' });

// Notification
Notification.belongsTo(User, { foreignKey: 'user' });

// Certificate
Certificate.belongsTo(User, { foreignKey: 'student' });
Certificate.belongsTo(Course, { foreignKey: 'course' });

// Assignment
Assignment.belongsTo(Course, { foreignKey: 'course' });
Assignment.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Course.hasMany(Assignment, { foreignKey: 'course' });

// Submission
Submission.belongsTo(Assignment, { foreignKey: 'assignment' });
Submission.belongsTo(User, { foreignKey: 'student' });
Assignment.hasMany(Submission, { foreignKey: 'assignment' });

module.exports = {
    sequelize,
    ...models
};
