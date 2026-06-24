import express from 'express';
import repoController from '../controllers/repoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes within this router
router.use(protect);

router.post('/', repoController.createRepo);
router.get('/', repoController.getRepos);
router.get('/:id', repoController.getRepo);
router.delete('/:id', repoController.deleteRepo);
router.get('/:id/graph', repoController.getGraph);
router.get('/:id/file', repoController.getFileContent);
router.post('/:id/impact', repoController.analyzeImpact);
router.get('/:id/knowledge-gap', repoController.getKnowledgeGap);

export default router;
