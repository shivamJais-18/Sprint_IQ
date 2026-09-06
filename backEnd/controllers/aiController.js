import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import Bug from '../models/Bug.js';
import User from '../models/User.js';
import {
  askAssistant,
  analyzeProjectHealth,
  analyzeSprintRisk,
  generateReleaseNotes,
  generateTasks,
  getAIStatus,
  prioritizeBug,
  recommendAssignment,
  summarizeMeeting
} from '../ai/aiService.js';
import {
  buildAssistantPrompt,
  buildAssignmentPrompt,
  buildBugPrompt,
  buildHealthPrompt,
  buildMeetingPrompt,
  buildReleasePrompt,
  buildSprintRiskPrompt,
  buildTaskGenerationPrompt
} from '../ai/prompts/index.js';

const canAccessProject = (project, user) => {
  if (!project) return false;
  if (user.role === 'Admin') return true;
  const managerId = project.manager?._id || project.manager;
  if (managerId?.toString() === user._id.toString()) return true;
  return project.members?.some((member) => (member?._id || member).toString() === user._id.toString());
};

const getProjectOrFail = async (projectId, user) => {
  const project = await Project.findById(projectId).populate('members', 'name email role').populate('manager', 'name email role');
  if (!project) return { error: [404, 'Project not found'] };
  if (!canAccessProject(project, user)) return { error: [403, 'Access denied'] };
  return { project };
};

const compactTask = (task) => ({
  id: task._id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  project: task.project?.name || task.project,
  sprint: task.sprint?.name || task.sprint,
  assignedTo: task.assignedTo?.name || task.assignedTo,
  dueDate: task.dueDate,
  estimatedHours: task.estimatedHours,
  storyPoints: task.storyPoints,
  labels: task.labels || []
});

const compactBug = (bug) => ({
  id: bug._id,
  title: bug.title,
  description: bug.description,
  status: bug.status,
  severity: bug.severity,
  priority: bug.priority,
  project: bug.project?.name || bug.project,
  task: bug.task?.title || bug.task,
  assignedTo: bug.assignedTo?.name || bug.assignedTo,
  environment: bug.environment,
  dueDate: bug.dueDate
});


const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

const wrapAIError = (res, error) => {
  console.error('AI error:', error);
  return res.status(error.statusCode || 500).json({ message: error.message || 'AI service failed' });
};

export const aiStatus = async (req, res) => res.status(200).json({ ai: getAIStatus() });

export const generateTaskSuggestions = async (req, res) => {
  try {
    const { requirement, projectId, sprintId } = req.body;
    if (!requirement?.trim() || !projectId) return res.status(400).json({ message: 'Requirement and projectId are required' });
    if (!isValidId(projectId) || (sprintId && !isValidId(sprintId))) return res.status(400).json({ message: 'Invalid project or sprint id' });
    const result = await getProjectOrFail(projectId, req.user);
    if (result.error) return res.status(result.error[0]).json({ message: result.error[1] });

    const sprint = sprintId ? await Sprint.findById(sprintId).lean() : null;
    if (sprint && sprint.project.toString() !== projectId.toString()) return res.status(400).json({ message: 'Sprint does not belong to the selected project' });

    const existingTasks = await Task.find({ project: projectId }).sort({ createdAt: -1 }).limit(40).lean();
    const output = await generateTasks({ prompt: buildTaskGenerationPrompt({ requirement: requirement.trim(), project: result.project.toObject(), sprint, existingTasks: existingTasks.map(compactTask) }) });
    return res.status(200).json({ message: 'AI tasks generated successfully', result: output });
  } catch (error) { return wrapAIError(res, error); }
};

export const createGeneratedTasks = async (req, res) => {
  try {
    const { projectId, sprintId, tasks } = req.body;
    if (!projectId || !Array.isArray(tasks) || !tasks.length) return res.status(400).json({ message: 'projectId and tasks are required' });
    if (!isValidId(projectId) || (sprintId && !isValidId(sprintId))) return res.status(400).json({ message: 'Invalid project or sprint id' });
    const result = await getProjectOrFail(projectId, req.user);
    if (result.error) return res.status(result.error[0]).json({ message: result.error[1] });
    if (sprintId) {
      const sprint = await Sprint.findById(sprintId);
      if (!sprint || sprint.project.toString() !== projectId.toString()) return res.status(400).json({ message: 'Invalid sprint for selected project' });
    }

    const safeTasks = tasks.slice(0, 20).map((task) => ({
      title: String(task.title || '').trim().slice(0, 150),
      description: String(task.description || '').trim().slice(0, 2000),
      project: projectId,
      sprint: sprintId || undefined,
      createdBy: req.user._id,
      priority: ['Low', 'Medium', 'High', 'Critical'].includes(task.priority) ? task.priority : 'Medium',
      estimatedHours: Number.isFinite(Number(task.estimatedHours)) ? Math.max(0, Number(task.estimatedHours)) : undefined,
      storyPoints: Number.isFinite(Number(task.storyPoints)) ? Math.min(13, Math.max(0, Number(task.storyPoints))) : undefined,
      labels: Array.isArray(task.labels) ? task.labels.map(String).slice(0, 8) : []
    })).filter((task) => task.title);

    const created = await Task.insertMany(safeTasks);
    return res.status(201).json({ message: `${created.length} AI-generated tasks created`, tasks: created });
  } catch (error) { return wrapAIError(res, error); }
};

export const sprintRisk = async (req, res) => {
  try {
    if (!isValidId(req.body.sprintId)) return res.status(400).json({ message: 'Valid sprintId is required' });
    const sprint = await Sprint.findById(req.body.sprintId).populate('project', 'name projectKey description manager members');
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    if (!canAccessProject(sprint.project, req.user)) return res.status(403).json({ message: 'Access denied' });
    const [tasks, bugs] = await Promise.all([
      Task.find({ sprint: sprint._id }).populate('assignedTo', 'name role').lean(),
      Bug.find({ project: sprint.project._id, status: { $nin: ['Resolved', 'Closed'] } }).lean()
    ]);
    const output = await analyzeSprintRisk({ prompt: buildSprintRiskPrompt({ sprint: sprint.toObject(), project: sprint.project.toObject(), tasks: tasks.map(compactTask), bugs: bugs.map(compactBug) }) });
    return res.status(200).json({ result: output, metrics: { taskCount: tasks.length, completed: tasks.filter((t) => t.status === 'Done').length, openBugs: bugs.length } });
  } catch (error) { return wrapAIError(res, error); }
};

export const assignmentRecommendation = async (req, res) => {
  try {
    if (!isValidId(req.body.taskId)) return res.status(400).json({ message: 'Valid taskId is required' });
    const task = await Task.findById(req.body.taskId).populate('project', 'name manager members').lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ message: 'Access denied' });

    const memberIds = [task.project.manager, ...(task.project.members || [])].map(String);
    const candidates = await User.find({ _id: { $in: [...new Set(memberIds)] }, role: 'Developer', isActive: true }).select('name email role').lean();
    const candidateIds = candidates.map((user) => user._id);
    const activeTasks = await Task.find({ assignedTo: { $in: candidateIds }, status: { $ne: 'Done' } }).select('assignedTo priority status').lean();
    const workload = candidates.map((user) => {
      const mine = activeTasks.filter((t) => t.assignedTo?.toString() === user._id.toString());
      return { ...user, workload: mine.length, highPriority: mine.filter((t) => ['High', 'Critical'].includes(t.priority)).length };
    });
    const output = await recommendAssignment({ prompt: buildAssignmentPrompt({ task: compactTask(task), candidates: workload.map(({ _id, name, role, workload: currentWorkload, highPriority }) => ({ userId: _id, name, role, currentWorkload, highPriority })) }) });
    return res.status(200).json({ result: output, candidates: workload });
  } catch (error) { return wrapAIError(res, error); }
};

export const bugPrioritization = async (req, res) => {
  try {
    if (!isValidId(req.body.bugId)) return res.status(400).json({ message: 'Valid bugId is required' });
    const bug = await Bug.findById(req.body.bugId).populate('project', 'name projectKey manager members').populate('task', 'title status priority').lean();
    if (!bug) return res.status(404).json({ message: 'Bug not found' });
    if (!canAccessProject(bug.project, req.user)) return res.status(403).json({ message: 'Access denied' });
    const output = await prioritizeBug({ prompt: buildBugPrompt({ bug: compactBug(bug), relatedTask: bug.task, project: bug.project }) });
    return res.status(200).json({ result: output });
  } catch (error) { return wrapAIError(res, error); }
};

export const projectHealth = async (req, res) => {
  try {
    if (!isValidId(req.params.projectId)) return res.status(400).json({ message: 'Invalid project id' });
    const result = await getProjectOrFail(req.params.projectId, req.user);
    if (result.error) return res.status(result.error[0]).json({ message: result.error[1] });
    const project = result.project;
    const [sprints, tasks, bugs] = await Promise.all([
      Sprint.find({ project: project._id }).sort({ endDate: -1 }).lean(),
      Task.find({ project: project._id }).populate('assignedTo', 'name role').lean(),
      Bug.find({ project: project._id }).populate('assignedTo', 'name role').lean()
    ]);
    const output = await analyzeProjectHealth({ prompt: buildHealthPrompt({ project: project.toObject(), sprints, tasks: tasks.map(compactTask), bugs: bugs.map(compactBug), members: project.members }) });
    return res.status(200).json({ result: output, metrics: { sprintCount: sprints.length, taskCount: tasks.length, completedTasks: tasks.filter((t) => t.status === 'Done').length, bugCount: bugs.length, openBugs: bugs.filter((b) => !['Resolved', 'Closed'].includes(b.status)).length } });
  } catch (error) { return wrapAIError(res, error); }
};

export const meetingSummary = async (req, res) => {
  try {
    const { notes, projectId } = req.body;
    if (!notes?.trim()) return res.status(400).json({ message: 'Meeting notes are required' });
    let projectContext = null;
    let members = [];
    if (projectId) {
      const result = await getProjectOrFail(projectId, req.user);
      if (result.error) return res.status(result.error[0]).json({ message: result.error[1] });
      projectContext = result.project.toObject();
      members = result.project.members;
    }
    const output = await summarizeMeeting({ prompt: buildMeetingPrompt({ notes: notes.trim(), projectContext, members }) });
    return res.status(200).json({ result: output });
  } catch (error) { return wrapAIError(res, error); }
};

export const releaseNotes = async (req, res) => {
  try {
    if (!isValidId(req.body.sprintId)) return res.status(400).json({ message: 'Valid sprintId is required' });
    const sprint = await Sprint.findById(req.body.sprintId).populate('project', 'name projectKey description manager members').lean();
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    if (!canAccessProject(sprint.project, req.user)) return res.status(403).json({ message: 'Access denied' });
    const [tasks, bugs] = await Promise.all([
      Task.find({ sprint: sprint._id, status: 'Done' }).lean(),
      Bug.find({ project: sprint.project._id, status: { $in: ['Resolved', 'Closed'] } }).lean()
    ]);
    const output = await generateReleaseNotes({ prompt: buildReleasePrompt({ sprint, project: sprint.project, tasks: tasks.map(compactTask), bugs: bugs.map(compactBug) }) });
    return res.status(200).json({ result: output });
  } catch (error) { return wrapAIError(res, error); }
};

export const assistantChat = async (req, res) => {
  try {
    const { question, projectId } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question is required' });
    if (projectId && !isValidId(projectId)) return res.status(400).json({ message: 'Invalid project id' });

    let projectFilter = {};
    if (projectId) {
      const result = await getProjectOrFail(projectId, req.user);
      if (result.error) return res.status(result.error[0]).json({ message: result.error[1] });
      projectFilter = { project: projectId };
    } else if (req.user.role !== 'Admin') {
      const projects = await Project.find({ $or: [{ manager: req.user._id }, { members: req.user._id }] }).select('_id').lean();
      projectFilter = { project: { $in: projects.map((p) => p._id) } };
    }

    const [projects, sprints, tasks, bugs] = await Promise.all([
      projectId ? Project.find({ _id: projectId }).lean() : Project.find(req.user.role === 'Admin' ? {} : { _id: { $in: projectFilter.project.$in } }).lean(),
      Sprint.find(projectId ? { project: projectId } : projectFilter).lean(),
      Task.find(projectFilter).lean(),
      Bug.find(projectFilter).lean()
    ]);
    const output = await askAssistant({ prompt: buildAssistantPrompt({ question: question.trim(), context: { projects, sprints, tasks: tasks.map(compactTask), bugs: bugs.map(compactBug) } }) });
    return res.status(200).json({ result: output });
  } catch (error) { return wrapAIError(res, error); }
};
