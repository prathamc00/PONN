const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./modules/auth/auth.model');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/db').then(async () => {
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach(u => console.log(u.email, u.aadhaarCardPath));
    process.exit(0);
}).catch(console.error);
