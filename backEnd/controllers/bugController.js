import Bug from '../models/Bug.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

const hasProjectAccess = (project, user) => {
  if (user.role === 'Admin') {
    return true;
  }

  if (project.manager.toString() === user._id.toString()) {
    return true;
  }

  return project.members.some(
    member => member.toString() === user._id.toString()
  );
};

export const createBug = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      task,
      assignedTo,
      severity,
      priority,
      environment,
      stepsToReproduce,
      dueDate
    } = req.body;

    if (!title || !description || !project) {
      return res.status(400).json({
        message: 'Title, description and project are required'
      });
    }

    const projectData = await Project.findById(project);

    if (!projectData) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }

    if (!hasProjectAccess(projectData, req.user)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    if (task) {
      const taskData = await Task.findById(task);

      if (!taskData) {
        return res.status(404).json({
          message: 'Task not found'
        });
      }

      if (taskData.project.toString() !== project.toString()) {
        return res.status(400).json({
          message: 'Task does not belong to this project'
        });
      }
    }

    const bug = await Bug.create({
      title,
      description,
      project,
      task,
      reportedBy: req.user._id,
      assignedTo,
      severity,
      priority,
      environment,
      stepsToReproduce,
      dueDate
    });

    const populatedBug = await Bug.findById(bug._id)
      .populate('project', 'name projectKey')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    return res.status(201).json({
      message: 'Bug reported successfully',
      bug: populatedBug
    });
  } catch (error) {
    console.error('Create bug error:', error);

    return res.status(500).json({
      message: 'Server error while reporting bug'
    });
  }
};

export const getBugs = async (req, res) => {
  try {
    const {
      project,
      task,
      status,
      severity,
      priority,
      assignedTo,
      search
    } = req.query;

    const filter = {};

    if (project) {
      filter.project = project;
    }

    if (task) {
      filter.task = task;
    }

    if (status) {
      filter.status = status;
    }

    if (severity) {
      filter.severity = severity;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Search bug titles
    if (search) {
      filter.title = {
        $regex: search,
        $options: 'i'
      };
    }

    const bugs = await Bug.find(filter)
      .populate('project', 'name projectKey')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: bugs.length,
      bugs
    });
  } catch (error) {
    console.error('Get bugs error:', error);

    return res.status(500).json({
      message: 'Server error while fetching bugs'
    });
  }
};

export const getBugById = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('project', 'name projectKey manager members')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!bug) {
      return res.status(404).json({
        message: 'Bug not found'
      });
    }

    const project = await Project.findById(bug.project._id);

    if (!project) {
      return res.status(404).json({
        message: 'Associated project not found'
      });
    }

    if (!hasProjectAccess(project, req.user)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      bug
    });
  } catch (error) {
    console.error('Get bug error:', error);

    return res.status(500).json({
      message: 'Server error while fetching bug'
    });
  }
};

export const updateBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({
        message: 'Bug not found'
      });
    }

    const project = await Project.findById(bug.project);

    if (!project) {
      return res.status(404).json({
        message: 'Associated project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';

    const isManager =
      project.manager.toString() === req.user._id.toString();

    const isAssignee =
      bug.assignedTo &&
      bug.assignedTo.toString() === req.user._id.toString();

    const isReporter =
      bug.reportedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isAssignee && !isReporter) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      task,
      assignedTo,
      severity,
      priority,
      status,
      environment,
      stepsToReproduce,
      dueDate
    } = req.body;

    if (task) {
      const taskData = await Task.findById(task);

      if (!taskData) {
        return res.status(404).json({
          message: 'Task not found'
        });
      }

      if (taskData.project.toString() !== bug.project.toString()) {
        return res.status(400).json({
          message: 'Task does not belong to this project'
        });
      }

      bug.task = task;
    }

    if (title !== undefined) {
      bug.title = title;
    }

    if (description !== undefined) {
      bug.description = description;
    }

    if (assignedTo !== undefined) {
      bug.assignedTo = assignedTo;
    }

    if (severity !== undefined) {
      bug.severity = severity;
    }

    if (priority !== undefined) {
      bug.priority = priority;
    }

    if (status !== undefined) {
      bug.status = status;
    }

    if (environment !== undefined) {
      bug.environment = environment;
    }

    if (stepsToReproduce !== undefined) {
      bug.stepsToReproduce = stepsToReproduce;
    }

    if (dueDate !== undefined) {
      bug.dueDate = dueDate;
    }

    await bug.save();

    const updatedBug = await Bug.findById(bug._id)
      .populate('project', 'name projectKey')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    return res.status(200).json({
      message: 'Bug updated successfully',
      bug: updatedBug
    });
  } catch (error) {
    console.error('Update bug error:', error);

    return res.status(500).json({
      message: 'Server error while updating bug'
    });
  }
};

export const deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({
        message: 'Bug not found'
      });
    }

    const project = await Project.findById(bug.project);

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
        message: 'Only Admin or Project Manager can delete bugs'
      });
    }

    await bug.deleteOne();

    return res.status(200).json({
      message: 'Bug deleted successfully'
    });
  } catch (error) {
    console.error('Delete bug error:', error);

    return res.status(500).json({
      message: 'Server error while deleting bug'
    });
  }
};