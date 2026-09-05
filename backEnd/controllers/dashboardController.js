import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import Bug from '../models/Bug.js';

export const getDashboardSummary = async (req, res) => {
  try {
    let projectIds = [];
    let projectFilter = {};

    if (req.user.role !== 'Admin') {
      const projects = await Project.find({
        $or: [{ manager: req.user._id }, { members: req.user._id }]
      }).select('_id');
      projectIds = projects.map(project => project._id);
      projectFilter = { _id: { $in: projectIds } };
    }

    const totalProjects = await Project.countDocuments(projectFilter);
    const activeProjects = await Project.countDocuments({ ...projectFilter, status: 'Active' });
    const completedProjects = await Project.countDocuments({ ...projectFilter, status: 'Completed' });

    const taskFilter = req.user.role === 'Admin' ? {} : { project: { $in: projectIds } };
    const totalTasks = await Task.countDocuments(taskFilter);
    const todoTasks = await Task.countDocuments({ ...taskFilter, status: 'To Do' });
    const inProgressTasks = await Task.countDocuments({ ...taskFilter, status: 'In Progress' });
    const reviewTasks = await Task.countDocuments({ ...taskFilter, status: 'Review' });
    const completedTasks = await Task.countDocuments({ ...taskFilter, status: 'Done' });

    const bugFilter = req.user.role === 'Admin' ? {} : { project: { $in: projectIds } };
    const totalBugs = await Bug.countDocuments(bugFilter);
    const openBugs = await Bug.countDocuments({ ...bugFilter, status: 'Open' });
    const resolvedBugs = await Bug.countDocuments({ ...bugFilter, status: 'Resolved' });
    const criticalBugs = await Bug.countDocuments({ ...bugFilter, severity: 'Critical' });

    const sprintFilter = req.user.role === 'Admin' ? {} : { project: { $in: projectIds } };
    const totalSprints = await Sprint.countDocuments(sprintFilter);
    const activeSprints = await Sprint.countDocuments({ ...sprintFilter, status: 'Active' });
    const completedSprints = await Sprint.countDocuments({ ...sprintFilter, status: 'Completed' });

    return res.status(200).json({
      summary: {
        projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
        tasks: { total: totalTasks, todo: todoTasks, inProgress: inProgressTasks, review: reviewTasks, completed: completedTasks },
        bugs: { total: totalBugs, open: openBugs, resolved: resolvedBugs, critical: criticalBugs },
        sprints: { total: totalSprints, active: activeSprints, completed: completedSprints }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ message: 'Server error while generating dashboard summary' });
  }
};
