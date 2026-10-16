import prisma from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export class WebhookHandlerService {
  async processEvent({ eventType, action, payload, deliveryId }) {
    logger.info('Processing GitHub webhook event', { eventType, action, deliveryId });

    try {
      switch (eventType) {
        case 'installation':
          await this.handleInstallation(action, payload);
          break;
        case 'installation_repositories':
          await this.handleInstallationRepositories(action, payload);
          break;
        case 'issues':
          await this.handleIssues(action, payload);
          break;
        case 'issue_comment':
          await this.handleIssueComment(action, payload);
          break;
        default:
          logger.debug('Unhandled GitHub webhook event type', { eventType, action });
          break;
      }

      await prisma.webhookEvent.update({
        where: { deliveryId },
        data: {
          processingStatus: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    } catch (err) {
      logger.error('Failed to process webhook event', {
        eventType,
        action,
        deliveryId,
        error: err.message,
      });

      await prisma.webhookEvent.update({
        where: { deliveryId },
        data: {
          processingStatus: 'FAILED',
          errorMessage: err.message,
          processedAt: new Date(),
        },
      }).catch(() => {});
    }
  }

  async handleInstallation(action, payload) {
    const inst = payload.installation;
    if (!inst) return;

    if (action === 'created') {
      await prisma.gitHubInstallation.upsert({
        where: { githubInstallationId: BigInt(inst.id) },
        update: {
          accountLogin: inst.account.login,
          accountId: BigInt(inst.account.id),
          accountAvatarUrl: inst.account.avatar_url,
          accountType: inst.account.type,
          status: 'active',
        },
        create: {
          githubInstallationId: BigInt(inst.id),
          accountLogin: inst.account.login,
          accountId: BigInt(inst.account.id),
          accountAvatarUrl: inst.account.avatar_url,
          accountType: inst.account.type,
          status: 'active',
        },
      });
    } else if (action === 'deleted') {
      await prisma.gitHubInstallation.updateMany({
        where: { githubInstallationId: BigInt(inst.id) },
        data: { status: 'deleted' },
      });
    } else if (action === 'suspend') {
      await prisma.gitHubInstallation.updateMany({
        where: { githubInstallationId: BigInt(inst.id) },
        data: { status: 'suspended' },
      });
    } else if (action === 'unsuspend') {
      await prisma.gitHubInstallation.updateMany({
        where: { githubInstallationId: BigInt(inst.id) },
        data: { status: 'active' },
      });
    }
  }

  async handleInstallationRepositories(action, payload) {
    const inst = payload.installation;
    if (!inst) return;

    const installation = await prisma.gitHubInstallation.findUnique({
      where: { githubInstallationId: BigInt(inst.id) },
    });

    if (!installation) return;

    if (action === 'added' && payload.repositories_added) {
      for (const repo of payload.repositories_added) {
        await prisma.repository.upsert({
          where: { githubRepoId: BigInt(repo.id) },
          update: {
            fullName: repo.full_name,
            name: repo.name,
            isActive: true,
            installationId: installation.id,
          },
          create: {
            githubRepoId: BigInt(repo.id),
            owner: repo.full_name.split('/')[0],
            name: repo.name,
            fullName: repo.full_name,
            visibility: repo.private ? 'private' : 'public',
            isActive: true,
            installationId: installation.id,
          },
        });
      }
    } else if (action === 'removed' && payload.repositories_removed) {
      for (const repo of payload.repositories_removed) {
        await prisma.repository.updateMany({
          where: { githubRepoId: BigInt(repo.id) },
          data: { isActive: false },
        });
      }
    }
  }

  async handleIssues(action, payload) {
    const ghIssue = payload.issue;
    const ghRepo = payload.repository;

    if (!ghIssue || !ghRepo) return;

    // Filter out PRs
    if (ghIssue.pull_request) return;

    const repo = await prisma.repository.findUnique({
      where: { githubRepoId: BigInt(ghRepo.id) },
    });

    if (!repo) {
      logger.warn('Received issue webhook for untracked repository', { repo: ghRepo.full_name });
      return;
    }

    const labels = (ghIssue.labels || []).map(l => typeof l === 'string' ? l : l.name);

    await prisma.issue.upsert({
      where: { githubIssueId: BigInt(ghIssue.id) },
      update: {
        issueNumber: ghIssue.number,
        title: ghIssue.title,
        body: ghIssue.body || '',
        state: ghIssue.state,
        authorUsername: ghIssue.user?.login || 'ghost',
        authorAvatarUrl: ghIssue.user?.avatar_url || null,
        htmlUrl: ghIssue.html_url,
        labelsJson: labels,
        githubUpdatedAt: ghIssue.updated_at ? new Date(ghIssue.updated_at) : null,
        githubClosedAt: ghIssue.closed_at ? new Date(ghIssue.closed_at) : null,
      },
      create: {
        githubIssueId: BigInt(ghIssue.id),
        issueNumber: ghIssue.number,
        title: ghIssue.title,
        body: ghIssue.body || '',
        state: ghIssue.state,
        authorUsername: ghIssue.user?.login || 'ghost',
        authorAvatarUrl: ghIssue.user?.avatar_url || null,
        htmlUrl: ghIssue.html_url,
        labelsJson: labels,
        repositoryId: repo.id,
        githubCreatedAt: ghIssue.created_at ? new Date(ghIssue.created_at) : null,
        githubUpdatedAt: ghIssue.updated_at ? new Date(ghIssue.updated_at) : null,
        githubClosedAt: ghIssue.closed_at ? new Date(ghIssue.closed_at) : null,
      },
    });

    logger.info('Synchronized issue via webhook', {
      action,
      issueNumber: ghIssue.number,
      repository: repo.fullName,
    });
  }

  async handleIssueComment(action, payload) {
    // Acknowledge comment events (e.g. user reply to missing info)
    logger.info('Received issue comment webhook event', {
      action,
      issueNumber: payload.issue?.number,
      author: payload.comment?.user?.login,
    });
  }
}

export const webhookHandlerService = new WebhookHandlerService();
