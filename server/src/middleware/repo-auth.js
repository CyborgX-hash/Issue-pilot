import prisma from '../config/prisma.js';
import { AppError } from './error-handler.js';
import { githubAppService } from '../services/github-app.service.js';

export async function requireRepoAccess(req, res, next) {
  try {
    const repositoryId = req.params.repositoryId || req.params.id;

    if (!repositoryId) {
      return next(new AppError('Repository identifier is required.', 400));
    }

    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        installation: true,
      },
    });

    if (!repository) {
      return next(new AppError('Repository not found.', 404));
    }

    if (!repository.isActive || repository.installation.status !== 'active') {
      return next(new AppError('Repository installation is inactive or suspended.', 403));
    }

    // Direct installation ownership check
    const isOwner = repository.installation.userId === req.user.id ||
      repository.installation.accountLogin.toLowerCase() === req.user.githubUsername.toLowerCase();

    if (isOwner) {
      req.repository = repository;
      req.installation = repository.installation;
      return next();
    }

    // Verify live collaborator permission if user has connected their GitHub OAuth token
    if (req.user.accessToken && githubAppService.isConfigured()) {
      const hasPermission = await githubAppService.verifyUserRepoAccess(
        req.user.accessToken,
        repository.owner,
        repository.name
      );

      if (hasPermission) {
        req.repository = repository;
        req.installation = repository.installation;
        return next();
      }
    }

    return next(new AppError('Access denied. You do not have permission to manage this repository.', 403));
  } catch (err) {
    next(err);
  }
}
