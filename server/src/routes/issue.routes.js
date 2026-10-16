import { Router } from 'express';
import { getIssueById } from '../controllers/issue.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/issues/:issueId', requireAuth, getIssueById);

export default router;
