import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash('test123456', 10);
    const user = await User.findOneAndUpdate(
      { email: 'manager1@gmail.com' },
      { password: hashedPassword, role: 'Project Manager', isActive: true },
      { new: true }
    );

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    console.log(`Password reset successfully for ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    process.exit(0);
  } catch (error) {
    console.error('Password reset error:', error);
    process.exit(1);
  }
};

resetPassword();
