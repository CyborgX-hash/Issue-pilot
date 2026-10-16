import { Router } from 'express';
import {
  listInstallations,
  getInstallationRepositories,
  syncInstallation,
  linkInstallation,
} from '../controllers/github.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/github/installations', requireAuth, listInstallations);
router.get('/github/installations/:installationId/repositories', requireAuth, getInstallationRepositories);
router.post('/github/installations/:installationId/sync', requireAuth, syncInstallation);
router.post('/github/installations/link', requireAuth, linkInstallation);

export default router;
