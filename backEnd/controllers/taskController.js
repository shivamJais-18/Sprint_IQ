import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';

const hasProjectAccess = (project, user) => {
  if (user.role === 'Admin') return true;

  if (project.manager.toString() === user._id.toString()) {
    return true;
  }

  return project.members.some(
    member => member.toString() === user._id.toString()
  );
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      sprint,
      assignedTo,
      status,
      priority,
      dueDate,
      labels
    } = req.body;

    if (!title || !project) {
      return res.status(400).json({
        message: 'Title and project are required'
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

    if (sprint) {
      const sprintData = await Sprint.findById(sprint);

      if (!sprintData) {
        return res.status(404).json({
          message: 'Sprint not found'
        });
      }

      if (sprintData.project.toString() !== project.toString()) {
        return res.status(400).json({
          message: 'Sprint does not belong to this project'
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project,
      sprint,
      assignedTo,
      createdBy: req.user._id,
      status,
      priority,
      dueDate,
      labels
    });

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name projectKey')
      .populate('sprint', 'name status startDate endDate')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);

    return res.status(500).json({
      message: 'Server error while creating task'
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    const {
      project,
      sprint,
      status,
      priority,
      assignedTo,
      search
    } = req.query;

    const filter = {};

    if (project) {
      filter.project = project;
    }

    if (sprint) {
      filter.sprint = sprint;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Search task titles
    if (search) {
      filter.title = {
        $regex: search,
        $options: 'i'
      };
    }

    let tasks = await Task.find(filter)
      .populate('project', 'name projectKey')
      .populate('sprint', 'name status')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    // Non-admin users only see tasks from projects
    // they manage or tasks assigned to them.
    if (req.user.role !== 'Admin') {
      tasks = tasks.filter(task => {
        const projectData = task.project;

        if (!projectData) {
          return false;
        }

        const isManager =
          projectData.manager?.toString() === req.user._id.toString();

        const isAssignee =
          task.assignedTo?._id?.toString() === req.user._id.toString();

        return isManager || isAssignee;
      });
    }

    return res.status(200).json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);

    return res.status(500).json({
      message: 'Server error while fetching tasks'
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name projectKey manager members')
      .populate('sprint', 'name status startDate endDate')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const project = await Project.findById(task.project._id);

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
      task
    });
  } catch (error) {
    console.error('Get task error:', error);

    return res.status(500).json({
      message: 'Server error while fetching task'
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: 'Associated project not found'
      });
    }

    const isAdmin = req.user.role === 'Admin';

    const isManager =
      project.manager.toString() === req.user._id.toString();

    const isAssignee =
      task.assignedTo &&
      task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isAssignee) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      sprint,
      assignedTo,
      status,
      priority,
      dueDate,
      labels
    } = req.body;

    if (sprint) {
      const sprintData = await Sprint.findById(sprint);

      if (!sprintData) {
        return res.status(404).json({
          message: 'Sprint not found'
        });
      }

      if (sprintData.project.toString() !== task.project.toString()) {
        return res.status(400).json({
          message: 'Sprint does not belong to this project'
        });
      }

      task.sprint = sprint;
    }

    if (title !== undefined) {
      task.title = title;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo;
    }

    if (status !== undefined) {
      task.status = status;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate;
    }

    if (labels !== undefined) {
      task.labels = labels;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'name projectKey')
      .populate('sprint', 'name status')
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);

    return res.status(500).json({
      message: 'Server error while updating task'
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    const project = await Project.findById(task.project);

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
        message: 'Only Admin or Project Manager can delete tasks'
      });
    }

    await task.deleteOne();

    return res.status(200).json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);

    return res.status(500).json({
      message: 'Server error while deleting task'
    });
  }
};