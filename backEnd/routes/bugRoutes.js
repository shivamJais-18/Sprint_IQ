import express from 'express';
import { createBug, getBugs, getBugById, updateBug, deleteBug } from '../controllers/bugController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createBug);
router.get('/', protect, getBugs);
router.get('/:id', protect, getBugById);
router.put('/:id', protect, updateBug);
router.delete('/:id', protect, deleteBug);

export default router;
