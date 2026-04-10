const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../modules/auth/auth.model');
const Course = require('../modules/course/course.model');
const Assignment = require('../modules/assignment/assignment.model');
const Test = require('../modules/test/test.model');
const Certificate = require('../modules/certificate/certificate.model');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('Missing MONGO_URI in environment variables.');
    process.exit(1);
}

const crypto = require('crypto');

const defaultAdminPassword = process.env.ADMIN_SETUP_PASSWORD || crypto.randomBytes(8).toString('hex');
console.log('');
console.log('=============================================');
console.log(`🔑 ADMIN SETUP PASSWORD: ${defaultAdminPassword}`);
console.log('   (Save this if you are seeding a new db!)');
console.log('=============================================');
console.log('');

const sampleUsers = [
    {
        name: 'Admin User',
        email: 'admin@crismatech.com',
        password: defaultAdminPassword,
        role: 'admin',
        approvalStatus: 'approved',
        college: 'CRISMATECH Institute',
        branch: 'Administration',
        semester: 1,
        phone: '+919100000001',
    },
    {
        name: 'Priya Sharma',
        email: 'priya.sharma@student.com',
        password: 'Student@123',
        role: 'student',
        approvalStatus: 'approved',
        college: 'CRISMATECH Institute',
        branch: 'Computer Science',
        semester: 5,
        phone: '+919100000002',
    },
    {
        name: 'Rahul Verma',
        email: 'rahul.verma@student.com',
        password: 'Student@123',
        role: 'student',
        approvalStatus: 'approved',
        college: 'CRISMATECH Institute',
        branch: 'Information Technology',
        semester: 4,
        phone: '+919100000003',
    },
    {
        name: 'Neha Rao',
        email: 'neha.rao@faculty.com',
        password: 'Faculty@123',
        role: 'instructor',
        approvalStatus: 'approved',
        college: 'CRISMATECH Institute',    
        branch: 'Data Science',
        semester: 1,
        phone: '+919100000004',
    },
    {
        name: 'Arjun Mehta',
        email: 'arjun.mehta@faculty.com',
        password: 'Faculty@123',
        role: 'instructor',
        approvalStatus: 'pending',
        college: 'CRISMATECH Institute',
        branch: 'Cloud Computing',
        semester: 1,
        phone: '+919100000005',
    },
];

const sampleCertificates = [
    {
        title: 'Python Programming Certificate',
        course: 'Python for Data Science',
        status: 'earned',
        earnedDate: new Date('2026-03-01T12:00:00Z'),
    },
    {
        title: 'Web Development Certificate',
        course: 'Web Development Masterclass',
        status: 'inProgress',
        progressPercent: 65,
    },
];

async function connectDB() {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for seeding');
}

async function clearData() {
    await Promise.all([
        User.deleteMany({}),
        Course.deleteMany({}),
        Assignment.deleteMany({}),
        Test.deleteMany({}),
        Certificate.deleteMany({}),
    ]);

    console.log('Existing seed collections cleared');
}

async function seedData() {
    const createdUsers = [];
    for (const user of sampleUsers) {
        createdUsers.push(await User.create(user));
    }

    const adminUser = createdUsers.find((user) => user.role === 'admin');
    const approvedInstructor = createdUsers.find((user) => user.email === 'neha.rao@faculty.com');
    const primaryStudent = createdUsers.find((user) => user.email === 'priya.sharma@student.com');
    const secondaryStudent = createdUsers.find((user) => user.email === 'rahul.verma@student.com');

    const createdCourses = await Course.insertMany([
        {
            title: 'Web Development Masterclass',
            description: 'Build modern responsive web applications with HTML, CSS, JavaScript, and project-based lessons.',
            instructor: approvedInstructor.name,
            category: 'Development',
            level: 'Intermediate',
            lessons: 3,
            durationHours: 16,
            isActive: true,
            createdBy: approvedInstructor._id,
            modules: [
                { title: 'HTML Foundations', description: 'Semantic layout basics', duration: '18 min', order: 0 },
                { title: 'CSS Layout Systems', description: 'Flexbox and Grid in practice', duration: '24 min', order: 1 },
                { title: 'JavaScript Interactivity', description: 'DOM events and state', duration: '22 min', order: 2 },
            ],
        },
        {
            title: 'Python for Data Science',
            description: 'Core Python, NumPy, pandas, and analysis workflows for practical data projects.',
            instructor: approvedInstructor.name,
            category: 'Data Science',
            level: 'Advanced',
            lessons: 2,
            durationHours: 14,
            isActive: true,
            createdBy: approvedInstructor._id,
            modules: [
                { title: 'Data Cleaning Basics', description: 'Prepare real datasets for analysis', duration: '20 min', order: 0 },
                { title: 'Exploratory Analysis', description: 'Work through summary statistics and visuals', duration: '26 min', order: 1 },
            ],
        },
        {
            title: 'Campus Success Blueprint',
            description: 'A starter orientation course for all new students joining the platform.',
            instructor: adminUser.name,
            category: 'Career Skills',
            level: 'Beginner',
            lessons: 2,
            durationHours: 4,
            isActive: true,
            createdBy: adminUser._id,
            modules: [
                { title: 'Platform Tour', description: 'Get familiar with the learning portal', duration: '10 min', order: 0 },
                { title: 'Planning Your Week', description: 'Set learning goals and milestones', duration: '12 min', order: 1 },
            ],
        },
    ]);

    const webCourse = createdCourses.find((course) => course.title === 'Web Development Masterclass');
    const dataCourse = createdCourses.find((course) => course.title === 'Python for Data Science');

    primaryStudent.enrolledCourses = [webCourse._id, dataCourse._id];
    secondaryStudent.enrolledCourses = [webCourse._id];
    await primaryStudent.save();
    await secondaryStudent.save();

    await Assignment.insertMany([
        {
            title: 'HTML Layout Challenge',
            course: webCourse._id,
            type: 'case_study',
            instructions: 'Design a semantic landing page layout and explain your structure decisions.',
            module: 'HTML Foundations',
            dueDate: new Date('2026-03-25T23:59:00Z'),
            maxMarks: 100,
            createdBy: approvedInstructor._id,
        },
        {
            title: 'Python Data Cleaning Task',
            course: dataCourse._id,
            type: 'code',
            instructions: 'Clean the given CSV file and submit your Python transformation script.',
            module: 'Data Cleaning Basics',
            dueDate: new Date('2026-03-28T23:59:00Z'),
            maxMarks: 100,
            createdBy: approvedInstructor._id,
        },
    ]);

    await Test.insertMany([
        {
            title: 'Web Development Mid-Term',
            course: webCourse._id,
            questions: [
                { question: 'Which HTML element is used for the main content area?', options: ['main', 'section', 'article', 'content'], correctAnswer: 0 },
                { question: 'Which CSS module is best for one-dimensional layout?', options: ['Grid', 'Flexbox', 'Float', 'Position'], correctAnswer: 1 },
            ],
            totalQuestions: 2,
            durationMinutes: 30,
            startTime: new Date('2026-03-18T10:00:00Z'),
            endTime: new Date('2026-03-18T10:30:00Z'),
            status: 'upcoming',
            createdBy: approvedInstructor._id,
        },
        {
            title: 'Data Science Quiz 1',
            course: dataCourse._id,
            questions: [
                { question: 'Which library is commonly used for tabular data analysis?', options: ['NumPy', 'pandas', 'Matplotlib', 'SciPy'], correctAnswer: 1 },
                { question: 'What does CSV stand for?', options: ['Common Separated Values', 'Comma Separated Values', 'Column Standard Vector', 'Code Structured Values'], correctAnswer: 1 },
            ],
            totalQuestions: 2,
            durationMinutes: 25,
            startTime: new Date('2026-03-16T09:00:00Z'),
            endTime: new Date('2026-03-16T09:25:00Z'),
            status: 'completed',
            createdBy: approvedInstructor._id,
        },
    ]);

    await Certificate.insertMany(sampleCertificates);

    console.log('Seed data inserted successfully');
    console.log(`Users: ${sampleUsers.length}`);
    console.log(`Courses: ${createdCourses.length}`);
    console.log('Assignments: 2');
    console.log('Tests: 2');
    console.log(`Certificates: ${sampleCertificates.length}`);
}

(async function run() {
    const shouldClearOnly = process.argv.includes('--clear');

    try {
        await connectDB();
        await clearData();

        if (shouldClearOnly) {
            console.log('Database clear completed.');
        } else {
            await seedData();
            console.log('Database created and data stored successfully.');
        }
    } catch (error) {
        console.error('Seed script failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
})();
