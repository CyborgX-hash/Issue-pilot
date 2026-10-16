import { triageActionService } from '../services/triage-action.service.js';

export async function listTriageActions(req, res, next) {
  try {
    const { status, repositoryId, page, limit } = req.query;

    const result = await triageActionService.listActions({
      user: req.user,
      status,
      repositoryId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function approveTriageAction(req, res, next) {
  try {
    const { id } = req.params;
    const { proposedPayload } = req.body;

    const action = await triageActionService.approveAction(id, req.user, proposedPayload);

    res.json({
      success: true,
      message: 'Triage action approved successfully.',
      action,
    });
  } catch (err) {
    next(err);
  }
}

export async function rejectTriageAction(req, res, next) {
  try {
    const { id } = req.params;

    const action = await triageActionService.rejectAction(id, req.user);

    res.json({
      success: true,
      message: 'Triage action rejected.',
      action,
    });
  } catch (err) {
    next(err);
  }
}

export async function applyTriageAction(req, res, next) {
  try {
    const { id } = req.params;

    const action = await triageActionService.applyAction(id, req.user);

    res.json({
      success: true,
      message: 'Triage action executed and applied to GitHub.',
      action,
    });
  } catch (err) {
    next(err);
  }
}
