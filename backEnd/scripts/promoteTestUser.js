import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const promoteUser = async () => {
  try {
    await connectDB();

    const user = await User.findOne({ email: 'manager1@gmail.com' });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    user.role = 'Project Manager';
    user.isActive = true;
    await user.save();

    console.log('User updated successfully');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);

    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
};

promoteUser();
