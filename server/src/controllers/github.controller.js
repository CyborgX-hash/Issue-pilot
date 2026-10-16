import prisma from '../config/prisma.js';
import { githubAppService } from '../services/github-app.service.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

export async function listInstallations(req, res, next) {
  try {
    // Find all installations linked directly to this user or matching user's GitHub username
    const installations = await prisma.gitHubInstallation.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { accountLogin: req.user.githubUsername },
        ],
        status: 'active',
      },
      include: {
        _count: {
          select: { repositories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      installations: installations.map(inst => ({
        id: inst.id,
        githubInstallationId: inst.githubInstallationId.toString(),
        accountLogin: inst.accountLogin,
        accountAvatarUrl: inst.accountAvatarUrl,
        accountType: inst.accountType,
        status: inst.status,
        repositoryCount: inst._count.repositories,
        createdAt: inst.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getInstallationRepositories(req, res, next) {
  try {
    const { installationId } = req.params;

    const installation = await prisma.gitHubInstallation.findFirst({
      where: {
        OR: [
          { id: installationId },
          { githubInstallationId: BigInt(installationId.match(/^\d+$/) ? installationId : 0) },
        ],
      },
    });

    if (!installation) {
      return next(new AppError('Installation not found.', 404));
    }

    // Verify user authorization: user must own the installation or be the account owner
    if (installation.userId !== req.user.id && installation.accountLogin.toLowerCase() !== req.user.githubUsername.toLowerCase()) {
      return next(new AppError('Unauthorized to view repositories for this installation.', 403));
    }

    const repositories = await prisma.repository.findMany({
      where: {
        installationId: installation.id,
        isActive: true,
      },
      include: {
        _count: {
          select: { issues: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json({
      success: true,
      installation: {
        id: installation.id,
        githubInstallationId: installation.githubInstallationId.toString(),
        accountLogin: installation.accountLogin,
      },
      repositories: repositories.map(repo => ({
        id: repo.id,
        githubRepoId: repo.githubRepoId.toString(),
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        visibility: repo.visibility,
        defaultBranch: repo.defaultBranch,
        issueCount: repo._count.issues,
        lastSyncAt: repo.lastSyncAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function syncInstallation(req, res, next) {
  try {
    const { installationId } = req.params;

    const installation = await prisma.gitHubInstallation.findFirst({
      where: {
        OR: [
          { id: installationId },
          { githubInstallationId: BigInt(installationId.match(/^\d+$/) ? installationId : 0) },
        ],
      },
    });

    if (!installation) {
      return next(new AppError('Installation not found in database.', 404));
    }

    if (installation.userId !== req.user.id && installation.accountLogin.toLowerCase() !== req.user.githubUsername.toLowerCase()) {
      return next(new AppError('Unauthorized to synchronize this installation.', 403));
    }

    if (!githubAppService.isConfigured()) {
      return next(new AppError('GitHub App credentials are not configured.', 503));
    }

    // Get an installation-scoped Octokit client
    const octokit = await githubAppService.getInstallationOctokit(installation.githubInstallationId);

    // List repositories accessible to this installation
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    const syncedRepos = [];

    for (const ghRepo of data.repositories) {
      const repo = await prisma.repository.upsert({
        where: { githubRepoId: BigInt(ghRepo.id) },
        update: {
          owner: ghRepo.owner.login,
          name: ghRepo.name,
          fullName: ghRepo.full_name,
          description: ghRepo.description || null,
          visibility: ghRepo.private ? 'private' : 'public',
          defaultBranch: ghRepo.default_branch || 'main',
          isActive: true,
          installationId: installation.id,
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
          installationId: installation.id,
        },
      });
      syncedRepos.push(repo);
    }

    logger.info('Synchronized installation repositories', {
      installationId: installation.id,
      count: syncedRepos.length,
    });

    res.json({
      success: true,
      message: `Synchronized ${syncedRepos.length} repositories successfully.`,
      repositories: syncedRepos.map(r => ({
        id: r.id,
        fullName: r.fullName,
        visibility: r.visibility,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function linkInstallation(req, res, next) {
  try {
    const { installation_id } = req.body;

    if (!installation_id) {
      return next(new AppError('installation_id is required.', 400));
    }

    if (!githubAppService.isConfigured()) {
      // Allow manual registration in dev/testing mode if credentials not yet configured
      const installation = await prisma.gitHubInstallation.upsert({
        where: { githubInstallationId: BigInt(installation_id) },
        update: { userId: req.user.id },
        create: {
          githubInstallationId: BigInt(installation_id),
          accountLogin: req.user.githubUsername,
          accountId: req.user.githubId,
          userId: req.user.id,
          status: 'active',
        },
      });
      return res.json({ success: true, installation });
    }

    // Verify installation exists on GitHub
    const appOctokit = githubAppService.getAppOctokit();
    const { data: ghInst } = await appOctokit.rest.apps.getInstallation({
      installation_id: Number(installation_id),
    });

    const installation = await prisma.gitHubInstallation.upsert({
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

    res.json({
      success: true,
      message: 'GitHub App installation linked successfully.',
      installation: {
        id: installation.id,
        githubInstallationId: installation.githubInstallationId.toString(),
        accountLogin: installation.accountLogin,
      },
    });
  } catch (err) {
    next(err);
  }
}
