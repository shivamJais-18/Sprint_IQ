import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const listUsers = async () => {
  try {
    await connectDB();
    const users = await User.find().select('-password');
    console.log('Users in database:');
    console.dir(users, { depth: null });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

listUsers();
