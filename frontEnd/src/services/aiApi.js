import API from './api';

export const getAIStatus = () => API.get('/ai/status');
export const generateTasks = (data) => API.post('/ai/generate-tasks', data);
export const createGeneratedTasks = (data) => API.post('/ai/create-generated-tasks', data);
export const analyzeSprintRisk = (data) => API.post('/ai/sprint-risk', data);
export const recommendAssignment = (data) => API.post('/ai/recommend-assignment', data);
export const prioritizeBug = (data) => API.post('/ai/prioritize-bug', data);
export const analyzeProjectHealth = (projectId) => API.get(`/ai/project-health/${projectId}`);
export const summarizeMeeting = (data) => API.post('/ai/meeting-summary', data);
export const generateReleaseNotes = (data) => API.post('/ai/release-notes', data);
export const askAssistant = (data) => API.post('/ai/chat', data);
