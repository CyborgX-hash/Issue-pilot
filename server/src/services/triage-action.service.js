import prisma from '../config/prisma.js';
import { githubAppService } from './github-app.service.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

export class TriageActionService {
  /**
   * List triage actions across repositories the user has access to.
   */
  async listActions({ user, status, repositoryId, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const where = {
      issue: {
        repository: {
          isActive: true,
          installation: {
            OR: [
              { userId: user.id },
              { accountLogin: user.githubUsername },
            ],
            status: 'active',
          },
        },
      },
    };

    if (status) {
      where.approvalStatus = status;
    }

    if (repositoryId) {
      where.issue.repositoryId = repositoryId;
    }

    const [actions, totalCount] = await Promise.all([
      prisma.triageAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          issue: {
            select: {
              id: true,
              issueNumber: true,
              title: true,
              htmlUrl: true,
              state: true,
              repository: {
                select: {
                  id: true,
                  fullName: true,
                  owner: true,
                  name: true,
                },
              },
            },
          },
          approvingUser: {
            select: {
              id: true,
              githubUsername: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.triageAction.count({ where }),
    ]);

    return {
      actions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Verify whether a user is authorized to manage the target action
   */
  async getAuthorizedAction(actionId, user) {
    const action = await prisma.triageAction.findUnique({
      where: { id: actionId },
      include: {
        issue: {
          include: {
            repository: {
              include: { installation: true },
            },
          },
        },
      },
    });

    if (!action) {
      throw new AppError('Triage action not found.', 404);
    }

    const repo = action.issue.repository;
    const isOwner = repo.installation.userId === user.id ||
      repo.installation.accountLogin.toLowerCase() === user.githubUsername.toLowerCase();

    if (!isOwner) {
      throw new AppError('Unauthorized to manage triage actions for this repository.', 403);
    }

    return action;
  }

  /**
   * Approve a pending action, optionally updating payload if user edited it
   */
  async approveAction(actionId, user, modifiedPayload = null) {
    const action = await this.getAuthorizedAction(actionId, user);

    if (action.approvalStatus === 'APPLIED') {
      throw new AppError('Cannot modify an action that has already been applied to GitHub.', 400);
    }

    const updated = await prisma.triageAction.update({
      where: { id: action.id },
      data: {
        approvalStatus: 'APPROVED',
        approvingUserId: user.id,
        approvedAt: new Date(),
        ...(modifiedPayload ? { proposedPayload: modifiedPayload } : {}),
      },
    });

    logger.info('Triage action approved', {
      actionId: action.id,
      userId: user.id,
      actionType: action.actionType,
    });

    return updated;
  }

  /**
   * Reject a pending action
   */
  async rejectAction(actionId, user) {
    const action = await this.getAuthorizedAction(actionId, user);

    if (action.approvalStatus === 'APPLIED') {
      throw new AppError('Cannot reject an action that has already been applied to GitHub.', 400);
    }

    const updated = await prisma.triageAction.update({
      where: { id: action.id },
      data: {
        approvalStatus: 'REJECTED',
        approvingUserId: user.id,
      },
    });

    logger.info('Triage action rejected', {
      actionId: action.id,
      userId: user.id,
    });

    return updated;
  }

  /**
   * Apply an approved or pending action directly to GitHub.
   * Enforces idempotency and prevents double-application.
   */
  async applyAction(actionId, user) {
    const action = await this.getAuthorizedAction(actionId, user);

    // Concurrency / Idempotency protection: prevent double application
    if (action.approvalStatus === 'APPLIED' || action.executionStatus === 'EXECUTED') {
      throw new AppError('This action has already been executed on GitHub.', 409);
    }

    const repo = action.issue.repository;
    const issueNumber = action.issue.issueNumber;

    if (!githubAppService.isConfigured()) {
      // In development / testing without live GitHub App credentials:
      const simulatedResult = {
        simulated: true,
        actionType: action.actionType,
        timestamp: new Date().toISOString(),
      };

      const updated = await prisma.triageAction.update({
        where: { id: action.id },
        data: {
          approvalStatus: 'APPLIED',
          approvingUserId: user.id,
          approvedAt: action.approvedAt || new Date(),
          executionStatus: 'EXECUTED',
          gitHubResult: simulatedResult,
          executedAt: new Date(),
        },
      });

      return updated;
    }

    try {
      const octokit = await githubAppService.getInstallationOctokit(repo.installation.githubInstallationId);
      let gitHubResult = null;

      if (action.actionType === 'APPLY_LABELS') {
        const labels = action.proposedPayload?.labels || [];
        if (labels.length === 0) {
          throw new AppError('No labels defined in proposed action payload.', 400);
        }

        const response = await octokit.rest.issues.addLabels({
          owner: repo.owner,
          repo: repo.name,
          issue_number: issueNumber,
          labels,
        });
        gitHubResult = response.data;
      } else if (action.actionType === 'POST_COMMENT') {
        const comment = action.proposedPayload?.comment;
        if (!comment) {
          throw new AppError('No comment text defined in proposed action payload.', 400);
        }

        const response = await octokit.rest.issues.createComment({
          owner: repo.owner,
          repo: repo.name,
          issue_number: issueNumber,
          body: comment,
        });
        gitHubResult = response.data;
      } else {
        throw new AppError(`Unsupported action type: ${action.actionType}`, 400);
      }

      // Mark applied and executed
      const updated = await prisma.triageAction.update({
        where: { id: action.id },
        data: {
          approvalStatus: 'APPLIED',
          approvingUserId: user.id,
          approvedAt: action.approvedAt || new Date(),
          executionStatus: 'EXECUTED',
          gitHubResult: gitHubResult,
          executedAt: new Date(),
        },
      });

      logger.info('Triage action applied to GitHub successfully', {
        actionId: action.id,
        actionType: action.actionType,
        issueNumber,
        repo: repo.fullName,
      });

      return updated;
    } catch (err) {
      logger.error('Failed to apply triage action to GitHub', {
        actionId: action.id,
        error: err.message,
      });

      await prisma.triageAction.update({
        where: { id: action.id },
        data: {
          approvalStatus: 'FAILED',
          executionStatus: 'FAILED',
          failureDetails: err.message,
        },
      });

      throw new AppError(`GitHub write failed: ${err.message}`, 502);
    }
  }
}

export const triageActionService = new TriageActionService();
