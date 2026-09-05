import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Bug from '../models/Bug.js';

export const getUsers = async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { isActive: true };
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Server error while fetching users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Server error while fetching user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, role, isActive } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (password !== undefined) user.password = await bcrypt.hash(password, 10);
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ message: 'Server error while updating user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const managedProjectCount = await Project.countDocuments({ manager: user._id });
    if (managedProjectCount > 0) {
      return res.status(400).json({ message: 'Transfer or delete the user-managed projects before deleting this user' });
    }

    await Promise.all([
      Project.updateMany({ members: user._id }, { $pull: { members: user._id } }),
      Task.updateMany({ assignedTo: user._id }, { $unset: { assignedTo: 1 } }),
      Bug.updateMany({ assignedTo: user._id }, { $unset: { assignedTo: 1 } })
    ]);

    await user.deleteOne();
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ message: 'Server error while deleting user' });
  }
};
