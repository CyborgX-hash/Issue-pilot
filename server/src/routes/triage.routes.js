import { Router } from 'express';
import {
  listTriageActions,
  approveTriageAction,
  rejectTriageAction,
  applyTriageAction,
} from '../controllers/triage.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/triage/actions', requireAuth, listTriageActions);
router.post('/triage/actions/:id/approve', requireAuth, approveTriageAction);
router.post('/triage/actions/:id/reject', requireAuth, rejectTriageAction);
router.post('/triage/actions/:id/apply', requireAuth, applyTriageAction);

export default router;
