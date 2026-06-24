import express from 'express';
import chatController from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes within this router
router.use(protect);

router.post('/:repoId', chatController.sendMessage);
router.get('/:repoId', chatController.getHistory);
router.delete('/:repoId', chatController.clearHistory);

export default router;

