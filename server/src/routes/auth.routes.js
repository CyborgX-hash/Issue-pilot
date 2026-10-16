import { Router } from 'express';
import {
  getGitHubAuthUrl,
  handleGitHubCallback,
  getCurrentUser,
  logout,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/auth/github', getGitHubAuthUrl);
router.get('/auth/github/callback', handleGitHubCallback);
router.post('/auth/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
