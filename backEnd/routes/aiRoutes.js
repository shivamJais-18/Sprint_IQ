import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  aiStatus,
  assistantChat,
  assignmentRecommendation,
  bugPrioritization,
  createGeneratedTasks,
  generateTaskSuggestions,
  meetingSummary,
  projectHealth,
  releaseNotes,
  sprintRisk
} from '../controllers/aiController.js';

const router = express.Router();

router.use(protect);
router.get('/status', aiStatus);
router.post('/generate-tasks', authorize('Admin', 'Project Manager', 'Developer'), generateTaskSuggestions);
router.post('/create-generated-tasks', authorize('Admin', 'Project Manager', 'Developer'), createGeneratedTasks);
router.post('/sprint-risk', authorize('Admin', 'Project Manager'), sprintRisk);
router.post('/recommend-assignment', authorize('Admin', 'Project Manager'), assignmentRecommendation);
router.post('/prioritize-bug', authorize('Admin', 'Project Manager', 'Developer'), bugPrioritization);
router.get('/project-health/:projectId', projectHealth);
router.post('/meeting-summary', authorize('Admin', 'Project Manager', 'Developer'), meetingSummary);
router.post('/release-notes', authorize('Admin', 'Project Manager'), releaseNotes);
router.post('/chat', assistantChat);

export default router;
