import Sprint from '../models/Sprint.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { notifyUsers } from '../utils/notify.js';

export const createSprint = async (req, res) => {
  try {
    const { name, goal, project, startDate, endDate } = req.body;
    if (!name || !project || !startDate || !endDate) return res.status(400).json({ message: 'Name, project, start date and end date are required' });

    const projectData = await Project.findById(project);
    if (!projectData) return res.status(404).json({ message: 'Project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = projectData.manager.toString() === req.user._id.toString();
    if (!isAdmin && !isManager) return res.status(403).json({ message: 'Only Admin or Project Manager can create sprints' });

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) return res.status(400).json({ message: 'Please provide valid sprint dates' });
    if (parsedEnd <= parsedStart) return res.status(400).json({ message: 'End date must be after start date' });

    const sprint = await Sprint.create({ name, goal, project, startDate, endDate });
    const populatedSprint = await Sprint.findById(sprint._id).populate('project', 'name projectKey status');

    return res.status(201).json({ message: 'Sprint created successfully', sprint: populatedSprint });
  } catch (error) {
    console.error('Create sprint error:', error);
    return res.status(500).json({ message: 'Server error while creating sprint' });
  }
};

export const getSprints = async (req, res) => {
  try {
    let projectFilter = {};

    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      const isAdmin = req.user.role === 'Admin';
      const isManager = project.manager.toString() === req.user._id.toString();
      const isMember = project.members.some((member) => member.toString() === req.user._id.toString());
      if (!isAdmin && !isManager && !isMember) return res.status(403).json({ message: 'Access denied' });
      projectFilter = { project: project._id };
    } else if (req.user.role !== 'Admin') {
      const projects = await Project.find({ $or: [{ manager: req.user._id }, { members: req.user._id }] }).select('_id');
      projectFilter = { project: { $in: projects.map((project) => project._id) } };
    }

    let sprints;
    if (req.user.role === 'Admin' || req.query.project) {
      sprints = await Sprint.find(projectFilter).populate('project', 'name projectKey status').sort({ startDate: -1 });
    } else {
      // Include orphaned records for cleanup while keeping real project data scoped.
      const projects = await Project.find({ $or: [{ manager: req.user._id }, { members: req.user._id }] }).select('_id');
      const accessibleIds = projects.map((project) => project._id);
      sprints = await Sprint.find({ $or: [{ project: { $in: accessibleIds } }, { project: { $exists: false } }] })
        .populate('project', 'name projectKey status')
        .sort({ startDate: -1 });
    }

    return res.status(200).json({ count: sprints.length, sprints });
  } catch (error) {
    console.error('Get sprints error:', error);
    return res.status(500).json({ message: 'Server error while fetching sprints' });
  }
};

export const getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('project', 'name projectKey status manager members');
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    const project = await Project.findById(sprint.project._id);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager.toString() === req.user._id.toString();
    const isMember = project.members.some(member => member.toString() === req.user._id.toString());
    if (!isAdmin && !isManager && !isMember) return res.status(403).json({ message: 'Access denied' });

    return res.status(200).json({ sprint });
  } catch (error) {
    console.error('Get sprint error:', error);
    return res.status(500).json({ message: 'Server error while fetching sprint' });
  }
};

export const updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    const project = await Project.findById(sprint.project);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager.toString() === req.user._id.toString();
    if (!isAdmin && !isManager) return res.status(403).json({ message: 'Only Admin or Project Manager can update sprints' });

    const { name, goal, startDate, endDate, status } = req.body;
    const previousStatus = sprint.status;
    const finalStartDate = startDate || sprint.startDate;
    const finalEndDate = endDate || sprint.endDate;
    const parsedStart = new Date(finalStartDate);
    const parsedEnd = new Date(finalEndDate);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) return res.status(400).json({ message: 'Please provide valid sprint dates' });
    if (parsedEnd <= parsedStart) return res.status(400).json({ message: 'End date must be after start date' });

    if (name !== undefined) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;
    if (status !== undefined) sprint.status = status;

    await sprint.save();
    const updatedSprint = await Sprint.findById(sprint._id).populate('project', 'name projectKey status');

    if (status !== undefined && status !== previousStatus) {
      await notifyUsers([project.manager, ...(project.members || [])], {
        type: 'Sprint Updated',
        title: 'Sprint status updated',
        message: `"${updatedSprint.name}" in ${project.name} moved to ${status}.`,
        relatedId: sprint._id,
        excludeUserId: req.user._id
      });
    }

    return res.status(200).json({ message: 'Sprint updated successfully', sprint: updatedSprint });
  } catch (error) {
    console.error('Update sprint error:', error);
    return res.status(500).json({ message: 'Server error while updating sprint' });
  }
};

export const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    const project = await Project.findById(sprint.project);

    const isAdmin = req.user.role === 'Admin';

    // Handle legacy/orphaned sprints whose project no longer exists.
    // The route is already protected by authorize('Admin', 'Project Manager'),
    // so an authenticated manager/admin can safely remove the orphan record.
    if (!project) {
      await Task.updateMany(
        { sprint: sprint._id },
        { $unset: { sprint: 1 } }
      );

      await sprint.deleteOne();
      return res.status(200).json({
        message: 'Orphaned sprint deleted successfully'
      });
    }

    const isManager = project.manager.toString() === req.user._id.toString();
    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: 'Only Admin or Project Manager can delete sprints'
      });
    }

    // Detach tasks before deleting the sprint so no task keeps a stale reference.
    await Task.updateMany(
      { sprint: sprint._id },
      { $unset: { sprint: 1 } }
    );

    await sprint.deleteOne();
    return res.status(200).json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    console.error('Delete sprint error:', error);
    return res.status(500).json({ message: 'Server error while deleting sprint' });
  }
};
