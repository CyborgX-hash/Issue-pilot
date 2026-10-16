import { Router } from 'express';
import {
  getIssueById,
  analyzeIssue,
  getIssueAnalysis,
  getIssueDuplicates,
} from '../controllers/issue.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/issues/:issueId', requireAuth, getIssueById);
router.post('/issues/:issueId/analyze', requireAuth, analyzeIssue);
router.get('/issues/:issueId/analysis', requireAuth, getIssueAnalysis);
router.get('/issues/:issueId/duplicates', requireAuth, getIssueDuplicates);

export default router;
