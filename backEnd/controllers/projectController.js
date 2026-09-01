import Project from '../models/Project.js';
import User from '../models/User.js';

export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      projectKey,
      members,
      startDate,
      endDate
    } = req.body;

    if (!name || !projectKey) {
      return res.status(400).json({
        message: 'Project name and project key are required'
      });
    }

    const existingProject = await Project.findOne({
      projectKey: projectKey.toUpperCase()
    });

    if (existingProject) {
      return res.status(409).json({
        message: 'Project key already exists'
      });
    }

    const project = await Project.create({
      name,
      description,
      projectKey: projectKey.toUpperCase(),
      manager: req.user._id,
      members: members || [],
      startDate,
      endDate
    });

    const populatedProject = await Project.findById(project._id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');

    return res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);

    return res.status(500).json({
      message: 'Server error while creating project'
    });
  }
};

export const getProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'Admin') {
      projects = await Project.find()
        .populate('manager', 'name email role')
        .populate('members', 'name email role')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({
        $or: [
          { manager: req.user._id },
          { members: req.user._id }
        ]
      })
        .populate('manager', 'name email role')
        .populate('members', 'name email role')
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Get projects error:', error);

    return res.status(500).json({
      message: 'Server error while fetching projects'
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      project.manager._id.toString() === req.user._id.toString();
    const isMember = project.members.some(
      member => member._id.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isManager && !isMember) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      project
    });
  } catch (error) {
    console.error('Get project error:', error);

    return res.status(500).json({
      message: 'Server error while fetching project'
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      project.manager.toString() === req.user._id.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: 'Only Admin or Project Manager can update this project'
      });
    }

    const {
      name,
      description,
      members,
      status,
      startDate,
      endDate
    } = req.body;

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (members !== undefined) project.members = members;
    if (status !== undefined) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('manager', 'name email role')
      .populate('members', 'name email role');

    return res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);

    return res.status(500).json({
      message: 'Server error while updating project'
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      project.manager.toString() === req.user._id.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: 'Only Admin or Project Manager can delete this project'
      });
    }

    await project.deleteOne();

    return res.status(200).json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);

    return res.status(500).json({
      message: 'Server error while deleting project'
    });
  }
};