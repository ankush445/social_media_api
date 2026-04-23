require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

const runMigration = async () => {
  await connectDB();

  console.log('Migration started...');

  const users = await User.find({
    $or: [
      { username: { $exists: false } },
      { username: null },
      { username: '' },
    ],
  });

  for (let user of users) {
    const base = user.email.split('@')[0];

    let username = base;
    let count = 1;

    // 🔥 ensure unique
    while (await User.findOne({ username })) {
      username = `${base}${count}`;
      count++;
    }

    user.username = username;
    await user.save();

    console.log(`Updated: ${user.email} → ${username}`);
  }

  console.log('Migration completed ✅');
  process.exit();
};

runMigration();