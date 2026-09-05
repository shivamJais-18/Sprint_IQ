import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const createDemoUser = async () => {
  try {
    await connectDB();

    const password = await bcrypt.hash('test123456', 10);
    const user = await User.findOneAndUpdate(
      { email: 'manager1@gmail.com' },
      {
        name: 'SprintIQ Manager',
        email: 'manager1@gmail.com',
        password,
        role: 'Project Manager',
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Demo user ready');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    process.exit(0);
  } catch (error) {
    console.error('Demo user error:', error);
    process.exit(1);
  }
};

createDemoUser();
