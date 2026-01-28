require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const emailToPromote = process.argv[2];

if (!emailToPromote) {
    console.log('Please provide an email: node promoteAdmin.js your-email@example.com');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const user = await User.findOneAndUpdate(
            { email: emailToPromote },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`✅ Success! ${user.name} (${user.email}) is now an Admin.`);
        } else {
            console.log(`❌ User with email ${emailToPromote} not found.`);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
