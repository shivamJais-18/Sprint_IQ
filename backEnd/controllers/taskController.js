import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import User from '../models/User.js';
import Bug from '../models/Bug.js';
import { notifyUsers } from '../utils/notify.js';

const hasProjectAccess = (project, user) => {
  if (user.role === 'Admin') return true;
  if (project.manager.toString() === user._id.toString()) return true;
  return project.members.some(member => member.toString() === user._id.toString());
};

const validateAssignee = async (project, assignedTo) => {
  if (!assignedTo) return null;
  const user = await User.findOne({ _id: assignedTo, isActive: true }).select('_id role');
  if (!user) { const error = new Error('Assigned user not found or inactive'); error.statusCode = 400; throw error; }
  const managerId = project.manager.toString();
  const memberIds = project.members.map(String);
  if (user._id.toString() !== managerId && !memberIds.includes(user._id.toString())) {
    const error = new Error('Assigned user must belong to the project team'); error.statusCode = 400; throw error;
  }
  if (user.role !== 'Developer' && user._id.toString() !== managerId) {
    const error = new Error('Tasks can only be assigned to project developers or the project manager'); error.statusCode = 400; throw error;
  }
  return user._id;
};

export const createTask = async (req, res) => {
  try {
    const { title, description, project, sprint, assignedTo, status, priority, dueDate, estimatedHours, storyPoints, labels } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'Title and project are required' });

    const projectData = await Project.findById(project);
    if (!projectData) return res.status(404).json({ message: 'Project not found' });
    if (!hasProjectAccess(projectData, req.user)) return res.status(403).json({ message: 'Access denied' });

    const validAssignedTo = await validateAssignee(projectData, assignedTo);

    if (sprint) {
      const sprintData = await Sprint.findById(sprint);
      if (!sprintData) return res.status(404).json({ message: 'Sprint not found' });
      if (sprintData.project.toString() !== project.toString()) return res.status(400).json({ message: 'Sprint does not belong to this project' });
    }

    const task = await Task.create({ title, description, project, sprint, assignedTo: validAssignedTo || undefined, createdBy: req.user._id, status, priority, dueDate, estimatedHours, storyPoints, labels });
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name projectKey manager members')
      .populate('sprint', 'name status startDate endDate')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    if (validAssignedTo) {
      await notifyUsers([validAssignedTo], {
        type: 'Task Assigned',
        title: 'New task assigned',
        message: `You were assigned to "${populatedTask.title}" in ${projectData.name}.`,
        relatedId: task._id,
        excludeUserId: req.user._id
      });
    }

    return res.status(201).json({ message: 'Task created successfully', task: populatedTask });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error while creating task' });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { project, sprint, status, priority, assignedTo, search } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (sprint) filter.sprint = sprint;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('project', 'name projectKey manager members')
      .populate('sprint', 'name status')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    const visibleTasks = req.user.role === 'Admin'
      ? tasks
      : tasks.filter(task => {
          const projectData = task.project;
          if (!projectData) return false;
          const isManager = projectData.manager?.toString() === req.user._id.toString();
          const isMember = projectData.members?.some(member => member.toString() === req.user._id.toString());
          const isAssignee = task.assignedTo?._id?.toString() === req.user._id.toString();
          return isManager || isMember || isAssignee;
        });

    return res.status(200).json({ count: visibleTasks.length, tasks: visibleTasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name projectKey manager members')
      .populate('sprint', 'name status startDate endDate')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project._id);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });
    if (!hasProjectAccess(project, req.user) && task.assignedTo?._id?.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });

    return res.status(200).json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    return res.status(500).json({ message: 'Server error while fetching task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager.toString() === req.user._id.toString();
    const isMember = project.members.some(member => member.toString() === req.user._id.toString());
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    if (!isAdmin && !isManager && !isMember && !isAssignee) return res.status(403).json({ message: 'Access denied' });

    const { title, description, sprint, assignedTo, status, priority, dueDate, estimatedHours, storyPoints, labels } = req.body;

    const previousAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
    const previousStatus = task.status;

    if (sprint) {
      const sprintData = await Sprint.findById(sprint);
      if (!sprintData) return res.status(404).json({ message: 'Sprint not found' });
      if (sprintData.project.toString() !== task.project.toString()) return res.status(400).json({ message: 'Sprint does not belong to this project' });
      task.sprint = sprint;
    } else if (sprint === null || sprint === '') {
      task.sprint = undefined;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo ? await validateAssignee(project, assignedTo) : undefined;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (storyPoints !== undefined) task.storyPoints = storyPoints;
    if (labels !== undefined) task.labels = labels;

    await task.save();
    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name projectKey manager members')
      .populate('sprint', 'name status')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    const newAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

    if (newAssignedTo && newAssignedTo !== previousAssignedTo) {
      await notifyUsers([newAssignedTo], {
        type: 'Task Assigned',
        title: 'New task assigned',
        message: `You were assigned to "${updatedTask.title}" in ${project.name}.`,
        relatedId: task._id,
        excludeUserId: req.user._id
      });
    } else if (status !== undefined && status !== previousStatus) {
      await notifyUsers([newAssignedTo, task.createdBy], {
        type: 'Task Updated',
        title: 'Task status updated',
        message: `"${updatedTask.title}" moved to ${status}.`,
        relatedId: task._id,
        excludeUserId: req.user._id
      });
    }

    return res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error while updating task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager.toString() === req.user._id.toString();
    if (!isAdmin && !isManager) return res.status(403).json({ message: 'Only Admin or Project Manager can delete tasks' });

    await Bug.updateMany({ task: task._id }, { $unset: { task: 1 } });
    await task.deleteOne();
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ message: 'Server error while deleting task' });
  }
};
