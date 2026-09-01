import Sprint from '../models/Sprint.js';
import Project from '../models/Project.js';

export const createSprint = async (req, res) => {
  try {
    const { name, goal, project, startDate, endDate } = req.body;

    if (!name || !project || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Name, project, start date and end date are required'
      });
    }

    const projectData = await Project.findById(project);

    if (!projectData) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      projectData.manager.toString() === req.user._id.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: 'Only Admin or Project Manager can create sprints'
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: 'End date must be after start date'
      });
    }

    const sprint = await Sprint.create({
      name,
      goal,
      project,
      startDate,
      endDate
    });

    const populatedSprint = await Sprint.findById(sprint._id)
      .populate('project', 'name projectKey status');

    return res.status(201).json({
      message: 'Sprint created successfully',
      sprint: populatedSprint
    });
  } catch (error) {
    console.error('Create sprint error:', error);

    return res.status(500).json({
      message: 'Server error while creating sprint'
    });
  }
};

export const getSprints = async (req, res) => {
  try {
    const { project } = req.query;

    const filter = project ? { project } : {};

    const sprints = await Sprint.find(filter)
      .populate('project', 'name projectKey status')
      .sort({ startDate: -1 });

    return res.status(200).json({
      count: sprints.length,
      sprints
    });
  } catch (error) {
    console.error('Get sprints error:', error);

    return res.status(500).json({
      message: 'Server error while fetching sprints'
    });
  }
};

export const getSprintById = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate('project', 'name projectKey status manager members');

    if (!sprint) {
      return res.status(404).json({
        message: 'Sprint not found'
      });
    }

    const project = await Project.findById(sprint.project._id);

    if (!project) {
      return res.status(404).json({
        message: 'Associated project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      project.manager.toString() === req.user._id.toString();
    const isMember = project.members.some(
      member => member.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isManager && !isMember) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      sprint
    });
  } catch (error) {
    console.error('Get sprint error:', error);

    return res.status(500).json({
      message: 'Server error while fetching sprint'
    });
  }
};

export const updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        message: 'Sprint not found'
      });
    }

    const project = await Project.findById(sprint.project);

    if (!project) {
      return res.status(404).json({
        message: 'Associated project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      project.manager.toString() === req.user._id.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: 'Only Admin or Project Manager can update sprints'
      });
    }

    const { name, goal, startDate, endDate, status } = req.body;

    const finalStartDate = startDate || sprint.startDate;
    const finalEndDate = endDate || sprint.endDate;

    if (new Date(finalEndDate) <= new Date(finalStartDate)) {
      return res.status(400).json({
        message: 'End date must be after start date'
      });
    }

    if (name !== undefined) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;
    if (status !== undefined) sprint.status = status;

    await sprint.save();

    const updatedSprint = await Sprint.findById(sprint._id)
      .populate('project', 'name projectKey status');

    return res.status(200).json({
      message: 'Sprint updated successfully',
      sprint: updatedSprint
    });
  } catch (error) {
    console.error('Update sprint error:', error);

    return res.status(500).json({
      message: 'Server error while updating sprint'
    });
  }
};

export const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({
        message: 'Sprint not found'
      });
    }

    const project = await Project.findById(sprint.project);

    if (!project) {
      return res.status(404).json({
        message: 'Associated project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';
    const isManager =
      project.manager.toString() === req.user._id.toString();

    if (!isAdmin && !isManager) {
      return res.status(403).json({
        message: 'Only Admin or Project Manager can delete sprints'
      });
    }

    await sprint.deleteOne();

    return res.status(200).json({
      message: 'Sprint deleted successfully'
    });
  } catch (error) {
    console.error('Delete sprint error:', error);

    return res.status(500).json({
      message: 'Server error while deleting sprint'
    });
  }
};