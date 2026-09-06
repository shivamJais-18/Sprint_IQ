import express from 'express';
import { createSprint, getSprints, getSprintById, updateSprint, deleteSprint } from '../controllers/sprintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Admin', 'Project Manager'), createSprint);
router.get('/', protect, getSprints);
router.get('/:id', protect, getSprintById);
router.put('/:id', protect, authorize('Admin', 'Project Manager'), updateSprint);
router.delete('/:id', protect, authorize('Admin', 'Project Manager'), deleteSprint);

export default router;
