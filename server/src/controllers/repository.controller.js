import prisma from '../config/prisma.js';
import { githubSyncService } from '../services/github-sync.service.js';
import { githubAppService } from '../services/github-app.service.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

export async function listRepositories(req, res, next) {
  try {
    // Auto-discover installations for the authenticated user from GitHub if configured
    if (githubAppService.isConfigured()) {
      try {
        let ghInstallations = [];

        // 1. Try discovering installations directly via the user's OAuth access token (supports orgs & any account)
        if (req.user.accessToken) {
          try {
            const userOctokit = await githubAppService.getUserOctokit(req.user.accessToken);
            const { data: userInstData } = await userOctokit.rest.apps.listInstallationsForAuthenticatedUser();
            ghInstallations = userInstData.installations || [];
          } catch (userInstErr) {
            logger.debug('Could not fetch user installations via OAuth token, falling back to app client', { error: userInstErr.message });
          }
        }

        // 2. If no user-scoped installations found, fall back to App-level installations matching username
        if (ghInstallations.length === 0) {
          const appOctokit = githubAppService.getAppOctokit();
          const { data: allAppInst } = await appOctokit.rest.apps.listInstallations();
          ghInstallations = allAppInst.filter(
            inst => inst.account?.login?.toLowerCase() === req.user.githubUsername.toLowerCase()
          );
        }

        for (const ghInst of ghInstallations) {
          const instRecord = await prisma.gitHubInstallation.upsert({
            where: { githubInstallationId: BigInt(ghInst.id) },
            update: {
              accountLogin: ghInst.account.login,
              accountId: BigInt(ghInst.account.id),
              accountAvatarUrl: ghInst.account.avatar_url,
              accountType: ghInst.account.type,
              userId: req.user.id,
              status: 'active',
            },
            create: {
              githubInstallationId: BigInt(ghInst.id),
              accountLogin: ghInst.account.login,
              accountId: BigInt(ghInst.account.id),
              accountAvatarUrl: ghInst.account.avatar_url,
              accountType: ghInst.account.type,
              userId: req.user.id,
              status: 'active',
            },
          });

            // Fetch and sync repositories for this installation
            try {
              const instOctokit = await githubAppService.getInstallationOctokit(ghInst.id);
              const { data: reposData } = await instOctokit.rest.apps.listReposAccessibleToInstallation({ per_page: 100 });

              for (const ghRepo of reposData.repositories) {
                await prisma.repository.upsert({
                  where: { githubRepoId: BigInt(ghRepo.id) },
                  update: {
                    owner: ghRepo.owner.login,
                    name: ghRepo.name,
                    fullName: ghRepo.full_name,
                    description: ghRepo.description || null,
                    visibility: ghRepo.private ? 'private' : 'public',
                    defaultBranch: ghRepo.default_branch || 'main',
                    isActive: true,
                    installationId: instRecord.id,
                  },
                  create: {
                    githubRepoId: BigInt(ghRepo.id),
                    owner: ghRepo.owner.login,
                    name: ghRepo.name,
                    fullName: ghRepo.full_name,
                    description: ghRepo.description || null,
                    visibility: ghRepo.private ? 'private' : 'public',
                    defaultBranch: ghRepo.default_branch || 'main',
                    isActive: true,
                    installationId: instRecord.id,
                  },
                });
              }
            } catch (repoErr) {
              logger.warn('Failed to auto-fetch repositories for installation', {
                installationId: ghInst.id,
                error: repoErr.message,
              });
            }
          }
        } catch (autoSyncErr) {
          logger.warn('Failed to auto-sync installations from GitHub', { error: autoSyncErr.message });
        }
      }
    // Repositories associated with installations the user has access to
    const repositories = await prisma.repository.findMany({
      where: {
        isActive: true,
        installation: {
          OR: [
            { userId: req.user.id },
            { accountLogin: req.user.githubUsername },
          ],
          status: 'active',
        },
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
        installation: {
          select: {
            id: true,
            accountLogin: true,
            accountAvatarUrl: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    // Compute untriaged counts for each repository
    const enriched = await Promise.all(
      repositories.map(async (repo) => {
        const untriagedCount = await prisma.issue.count({
          where: {
            repositoryId: repo.id,
            state: 'open',
            analyses: { none: {} },
          },
        });

        return {
          id: repo.id,
          githubRepoId: repo.githubRepoId.toString(),
          owner: repo.owner,
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          visibility: repo.visibility,
          defaultBranch: repo.defaultBranch,
          lastSyncAt: repo.lastSyncAt,
          totalIssues: repo._count.issues,
          untriagedIssues: untriagedCount,
          installation: repo.installation,
        };
      })
    );

    res.json({
      success: true,
      repositories: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRepository(req, res, next) {
  try {
    const repo = req.repository; // Provided by requireRepoAccess middleware

    const totalIssues = await prisma.issue.count({ where: { repositoryId: repo.id } });
    const openIssues = await prisma.issue.count({ where: { repositoryId: repo.id, state: 'open' } });
    const untriagedIssues = await prisma.issue.count({
      where: {
        repositoryId: repo.id,
        state: 'open',
        analyses: { none: {} },
      },
    });

    res.json({
      success: true,
      repository: {
        id: repo.id,
        githubRepoId: repo.githubRepoId.toString(),
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        visibility: repo.visibility,
        defaultBranch: repo.defaultBranch,
        lastSyncAt: repo.lastSyncAt,
        totalIssues,
        openIssues,
        untriagedIssues,
        installation: {
          id: req.installation.id,
          accountLogin: req.installation.accountLogin,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRepositoryIssues(req, res, next) {
  try {
    const repo = req.repository;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { state, search, category, priority, triageStatus } = req.query;

    const where = {
      repositoryId: repo.id,
    };

    if (state && ['open', 'closed'].includes(state)) {
      where.state = state;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { body: { contains: search } },
      ];
    }

    // Filter by AI analysis category or priority
    if (category || priority) {
      where.analyses = {
        some: {
          ...(category ? { category } : {}),
          ...(priority ? { priority } : {}),
        },
      };
    }

    // Filter by triage status: untriaged vs analyzed
    if (triageStatus === 'untriaged') {
      where.analyses = { none: {} };
    } else if (triageStatus === 'triaged') {
      where.analyses = { some: {} };
    }

    const [issues, totalCount] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueNumber: 'desc' },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              category: true,
              priority: true,
              summary: true,
              createdAt: true,
            },
          },
          triageActions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              actionType: true,
              approvalStatus: true,
              executionStatus: true,
            },
          },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      issues: issues.map(iss => ({
        id: iss.id,
        githubIssueId: iss.githubIssueId.toString(),
        issueNumber: iss.issueNumber,
        title: iss.title,
        bodyPreview: (iss.body || '').substring(0, 160),
        state: iss.state,
        authorUsername: iss.authorUsername,
        authorAvatarUrl: iss.authorAvatarUrl,
        htmlUrl: iss.htmlUrl,
        labels: iss.labelsJson || [],
        latestAnalysis: iss.analyses[0] || null,
        latestAction: iss.triageActions[0] || null,
        githubCreatedAt: iss.githubCreatedAt,
        githubUpdatedAt: iss.githubUpdatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function syncRepository(req, res, next) {
  try {
    const repo = req.repository;
    const result = await githubSyncService.syncRepositoryIssues(repo.id);

    res.json({
      success: true,
      message: `Synchronized ${result.syncedCount} issues (${result.prsSkipped} PRs filtered out).`,
      result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRepositoryStats(req, res, next) {
  try {
    const repo = req.repository;

    const [
      totalIssues,
      openIssues,
      closedIssues,
      analyses,
    ] = await Promise.all([
      prisma.issue.count({ where: { repositoryId: repo.id } }),
      prisma.issue.count({ where: { repositoryId: repo.id, state: 'open' } }),
      prisma.issue.count({ where: { repositoryId: repo.id, state: 'closed' } }),
      prisma.issueAnalysis.findMany({
        where: { issue: { repositoryId: repo.id } },
        select: { category: true, priority: true },
      }),
    ]);

    const untriagedIssues = await prisma.issue.count({
      where: {
        repositoryId: repo.id,
        state: 'open',
        analyses: { none: {} },
      },
    });

    const categoryDistribution = analyses.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {});

    const priorityDistribution = analyses.reduce((acc, a) => {
      acc[a.priority] = (acc[a.priority] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalIssues,
        openIssues,
        closedIssues,
        untriagedIssues,
        triagedIssues: totalIssues - untriagedIssues,
        categoryDistribution,
        priorityDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function batchAnalyzeRepository(req, res, next) {
  try {
    const repo = req.repository;
    const maxIssues = Math.min(50, Math.max(1, parseInt(req.body.maxIssues) || 10));

    const { aiTriageService } = await import('../services/ai-triage.service.js');
    const results = await aiTriageService.batchAnalyze(repo.id, maxIssues);

    res.json({
      success: true,
      message: `Completed batch analysis for ${results.length} issues.`,
      results,
    });
  } catch (err) {
    next(err);
  }
}
