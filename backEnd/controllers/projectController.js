import Project from '../models/Project.js';
import User from '../models/User.js';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import Bug from '../models/Bug.js';

const canManageProject = (project, user) => {
  return user.role === 'Admin' || project.manager.toString() === user._id.toString();
};

const normalizeMembers = async (members = []) => {
  const ids = [...new Set((Array.isArray(members) ? members : []).map(String).filter(Boolean))];
  if (!ids.length) return [];
  const users = await User.find({ _id: { $in: ids }, isActive: true }).select('_id');
  if (users.length !== ids.length) { const error = new Error('One or more selected project members are invalid or inactive'); error.statusCode = 400; throw error; }
  return users.map((user) => user._id);
};

export const createProject = async (req, res) => {
  try {
    const { name, description, projectKey, members, startDate, endDate } = req.body;

    if (!name || !projectKey) {
      return res.status(400).json({ message: 'Project name and project key are required' });
    }

    const normalizedKey = projectKey.toUpperCase();
    const existingProject = await Project.findOne({ projectKey: normalizedKey });
    if (existingProject) return res.status(409).json({ message: 'Project key already exists' });

    const normalizedMembers = await normalizeMembers(members);

    const project = await Project.create({
      name: name.trim(),
      description,
      projectKey: normalizedKey.trim(),
      manager: req.user._id,
      members: normalizedMembers,
      startDate,
      endDate
    });

    const populatedProject = await Project.findById(project._id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');

    return res.status(201).json({ message: 'Project created successfully', project: populatedProject });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error while creating project' });
  }
};

export const getProjects = async (req, res) => {
  try {
    const filter = req.user.role === 'Admin'
      ? {}
      : { $or: [{ manager: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(filter)
      .populate('manager', 'name email role')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: projects.length, projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ message: 'Server error while fetching projects' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager._id.toString() === req.user._id.toString();
    const isMember = project.members.some(member => member._id.toString() === req.user._id.toString());

    if (!isAdmin && !isManager && !isMember) return res.status(403).json({ message: 'Access denied' });

    return res.status(200).json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ message: 'Server error while fetching project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canManageProject(project, req.user)) return res.status(403).json({ message: 'Only Admin or Project Manager can update this project' });

    const { name, description, members, status, startDate, endDate } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (members !== undefined) project.members = await normalizeMembers(members);
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;

    if (project.startDate && project.endDate && new Date(project.endDate) <= new Date(project.startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    await project.save();
    const updatedProject = await Project.findById(project._id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');

    return res.status(200).json({ message: 'Project updated successfully', project: updatedProject });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error while updating project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canManageProject(project, req.user)) return res.status(403).json({ message: 'Only Admin or Project Manager can delete this project' });

    await Promise.all([
      Sprint.deleteMany({ project: project._id }),
      Task.deleteMany({ project: project._id }),
      Bug.deleteMany({ project: project._id })
    ]);

    await project.deleteOne();
    return res.status(200).json({ message: 'Project and its sprints, tasks and bugs deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ message: 'Server error while deleting project' });
  }
};
