import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'Project Manager'), createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, authorize('Admin', 'Project Manager'), updateProject);
router.delete('/:id', protect, authorize('Admin', 'Project Manager'), deleteProject);

export default router;
