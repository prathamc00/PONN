const mongoose = require('mongoose');
const User = require('./modules/auth/auth.model');
const QuizAttempt = require('./modules/test/quizAttempt.model');
const Test = require('./modules/test/test.model');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: '22btai204@gcu.edu.in' });
        if (user) {
            const result = await QuizAttempt.deleteMany({ student: user._id });
            console.log(`Deleted ${result.deletedCount} attempts for user ${user.email}`);

            // Also make sure at least one test is active
            const test = await Test.findOne();
            if (test) {
                test.startTime = new Date(Date.now() - 100000);
                test.endTime = new Date(Date.now() + 10000000);
                await test.save();
                console.log('Ensured test is active:', test.title);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
