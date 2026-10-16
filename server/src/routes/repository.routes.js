import { Router } from 'express';
import {
  listRepositories,
  getRepository,
  getRepositoryIssues,
  syncRepository,
  getRepositoryStats,
} from '../controllers/repository.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRepoAccess } from '../middleware/repo-auth.js';

const router = Router();

router.get('/repositories', requireAuth, listRepositories);
router.get('/repositories/:id', requireAuth, requireRepoAccess, getRepository);
router.get('/repositories/:id/issues', requireAuth, requireRepoAccess, getRepositoryIssues);
router.post('/repositories/:id/sync', requireAuth, requireRepoAccess, syncRepository);
router.get('/repositories/:id/stats', requireAuth, requireRepoAccess, getRepositoryStats);

export default router;
