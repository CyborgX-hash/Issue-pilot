import prisma from '../config/prisma.js';
import { githubAppService } from './github-app.service.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

export class GitHubSyncService {
  /**
   * Synchronize open and closed issues for a repository from GitHub.
   * Pull requests are strictly excluded.
   */
  async syncRepositoryIssues(repositoryId, options = { maxPages: 5, perPage: 100 }) {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        installation: true,
      },
    });

    if (!repository) {
      throw new AppError('Repository not found.', 404);
    }

    if (!githubAppService.isConfigured()) {
      throw new AppError('GitHub App is not configured. Cannot perform live sync.', 503);
    }

    const octokit = await githubAppService.getInstallationOctokit(repository.installation.githubInstallationId);

    let page = 1;
    let totalSynced = 0;
    let totalPrsSkipped = 0;

    logger.info('Starting issue synchronization for repository', {
      repository: repository.fullName,
      repositoryId: repository.id,
    });

    while (page <= options.maxPages) {
      const response = await octokit.rest.issues.listForRepo({
        owner: repository.owner,
        repo: repository.name,
        state: 'all',
        per_page: options.perPage,
        page,
        sort: 'updated',
        direction: 'desc',
      });

      const items = response.data;
      if (!items || items.length === 0) break;

      for (const item of items) {
        // GitHub Issues API returns pull requests alongside issues.
        // A true issue has item.pull_request === undefined.
        if (item.pull_request) {
          totalPrsSkipped++;
          continue;
        }

        const labels = (item.labels || []).map(lbl => typeof lbl === 'string' ? lbl : lbl.name);

        await prisma.issue.upsert({
          where: { githubIssueId: BigInt(item.id) },
          update: {
            issueNumber: item.number,
            title: item.title,
            body: item.body || '',
            state: item.state,
            authorUsername: item.user?.login || 'ghost',
            authorAvatarUrl: item.user?.avatar_url || null,
            htmlUrl: item.html_url,
            labelsJson: labels,
            githubCreatedAt: item.created_at ? new Date(item.created_at) : null,
            githubUpdatedAt: item.updated_at ? new Date(item.updated_at) : null,
            githubClosedAt: item.closed_at ? new Date(item.closed_at) : null,
          },
          create: {
            githubIssueId: BigInt(item.id),
            issueNumber: item.number,
            title: item.title,
            body: item.body || '',
            state: item.state,
            authorUsername: item.user?.login || 'ghost',
            authorAvatarUrl: item.user?.avatar_url || null,
            htmlUrl: item.html_url,
            labelsJson: labels,
            repositoryId: repository.id,
            githubCreatedAt: item.created_at ? new Date(item.created_at) : null,
            githubUpdatedAt: item.updated_at ? new Date(item.updated_at) : null,
            githubClosedAt: item.closed_at ? new Date(item.closed_at) : null,
          },
        });

        totalSynced++;
      }

      if (items.length < options.perPage) break;
      page++;
    }

    // Update repository lastSyncAt timestamp
    await prisma.repository.update({
      where: { id: repository.id },
      data: { lastSyncAt: new Date() },
    });

    logger.info('Issue synchronization completed', {
      repository: repository.fullName,
      totalSynced,
      totalPrsSkipped,
    });

    return {
      syncedCount: totalSynced,
      prsSkipped: totalPrsSkipped,
      lastSyncAt: new Date(),
    };
  }

  /**
   * Helper to retrieve existing labels on GitHub for a repository
   */
  async getRepositoryLabels(repositoryId) {
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: { installation: true },
    });

    if (!repository || !githubAppService.isConfigured()) {
      return [];
    }

    try {
      const octokit = await githubAppService.getInstallationOctokit(repository.installation.githubInstallationId);
      const { data } = await octokit.rest.issues.listLabelsForRepo({
        owner: repository.owner,
        repo: repository.name,
        per_page: 100,
      });
      return data.map(l => ({ name: l.name, color: l.color, description: l.description }));
    } catch (err) {
      logger.warn('Failed to fetch repository labels from GitHub', {
        repositoryId,
        error: err.message,
      });
      return [];
    }
  }
}

export const githubSyncService = new GitHubSyncService();
