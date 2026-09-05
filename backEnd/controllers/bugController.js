import Bug from '../models/Bug.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

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
    const error = new Error('Bugs can only be assigned to project developers or the project manager'); error.statusCode = 400; throw error;
  }
  return user._id;
};

export const createBug = async (req, res) => {
  try {
    const { title, description, project, task, assignedTo, severity, priority, environment, stepsToReproduce, dueDate } = req.body;
    if (!title || !description || !project) return res.status(400).json({ message: 'Title, description and project are required' });

    const projectData = await Project.findById(project);
    if (!projectData) return res.status(404).json({ message: 'Project not found' });
    if (!hasProjectAccess(projectData, req.user)) return res.status(403).json({ message: 'Access denied' });

    if (task) {
      const taskData = await Task.findById(task);
      if (!taskData) return res.status(404).json({ message: 'Task not found' });
      if (taskData.project.toString() !== project.toString()) return res.status(400).json({ message: 'Task does not belong to this project' });
    }

    const validAssignedTo = await validateAssignee(projectData, assignedTo);
    const bug = await Bug.create({ title, description, project, task, reportedBy: req.user._id, assignedTo: validAssignedTo || undefined, severity, priority, environment, stepsToReproduce, dueDate });
    const populatedBug = await Bug.findById(bug._id)
      .populate('project', 'name projectKey manager members')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    return res.status(201).json({ message: 'Bug reported successfully', bug: populatedBug });
  } catch (error) {
    console.error('Create bug error:', error);
    return res.status(500).json({ message: 'Server error while reporting bug' });
  }
};

export const getBugs = async (req, res) => {
  try {
    const { project, task, status, severity, priority, assignedTo, search } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (task) filter.task = task;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const bugs = await Bug.find(filter)
      .populate('project', 'name projectKey manager members')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });

    const visibleBugs = req.user.role === 'Admin'
      ? bugs
      : bugs.filter(bug => {
          const projectData = bug.project;
          const isReporter = bug.reportedBy?._id?.toString() === req.user._id.toString();
          const isAssignee = bug.assignedTo?._id?.toString() === req.user._id.toString();
          const isProjectManager = projectData?.manager?.toString() === req.user._id.toString();
          const isProjectMember = projectData?.members?.some?.((member) => member.toString() === req.user._id.toString());
          return isReporter || isAssignee || isProjectManager || isProjectMember;
        });

    return res.status(200).json({ count: visibleBugs.length, bugs: visibleBugs });
  } catch (error) {
    console.error('Get bugs error:', error);
    return res.status(500).json({ message: 'Server error while fetching bugs' });
  }
};

export const getBugById = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('project', 'name projectKey manager members')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    const project = await Project.findById(bug.project._id);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });
    if (!hasProjectAccess(project, req.user) && bug.reportedBy?._id?.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Access denied' });

    return res.status(200).json({ bug });
  } catch (error) {
    console.error('Get bug error:', error);
    return res.status(500).json({ message: 'Server error while fetching bug' });
  }
};

export const updateBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    const project = await Project.findById(bug.project);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager.toString() === req.user._id.toString();
    const isAssignee = bug.assignedTo && bug.assignedTo.toString() === req.user._id.toString();
    const isReporter = bug.reportedBy.toString() === req.user._id.toString();
    if (!isAdmin && !isManager && !isAssignee && !isReporter) return res.status(403).json({ message: 'Access denied' });

    const { title, description, task, assignedTo, severity, priority, status, environment, stepsToReproduce, dueDate } = req.body;

    if (task) {
      const taskData = await Task.findById(task);
      if (!taskData) return res.status(404).json({ message: 'Task not found' });
      if (taskData.project.toString() !== bug.project.toString()) return res.status(400).json({ message: 'Task does not belong to this project' });
      bug.task = task;
    } else if (task === null || task === '') {
      bug.task = undefined;
    }

    if (title !== undefined) bug.title = title;
    if (description !== undefined) bug.description = description;
    if (assignedTo !== undefined) bug.assignedTo = assignedTo ? await validateAssignee(project, assignedTo) : undefined;
    if (severity !== undefined) bug.severity = severity;
    if (priority !== undefined) bug.priority = priority;
    if (status !== undefined) bug.status = status;
    if (environment !== undefined) bug.environment = environment;
    if (stepsToReproduce !== undefined) bug.stepsToReproduce = stepsToReproduce;
    if (dueDate !== undefined) bug.dueDate = dueDate;

    await bug.save();
    const updatedBug = await Bug.findById(bug._id)
      .populate('project', 'name projectKey')
      .populate('task', 'title status priority')
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    return res.status(200).json({ message: 'Bug updated successfully', bug: updatedBug });
  } catch (error) {
    console.error('Update bug error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Server error while updating bug' });
  }
};

export const deleteBug = async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    const project = await Project.findById(bug.project);
    if (!project) return res.status(404).json({ message: 'Associated project not found' });

    const isAdmin = req.user.role === 'Admin';
    const isManager = project.manager.toString() === req.user._id.toString();
    if (!isAdmin && !isManager) return res.status(403).json({ message: 'Only Admin or Project Manager can delete bugs' });

    await bug.deleteOne();
    return res.status(200).json({ message: 'Bug deleted successfully' });
  } catch (error) {
    console.error('Delete bug error:', error);
    return res.status(500).json({ message: 'Server error while deleting bug' });
  }
};
