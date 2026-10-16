import prisma from '../config/prisma.js';
import { AppError } from '../middleware/error-handler.js';

export async function getIssueById(req, res, next) {
  try {
    const { issueId } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        repository: {
          include: {
            installation: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        triageActions: {
          orderBy: { createdAt: 'desc' },
          include: {
            approvingUser: {
              select: {
                id: true,
                githubUsername: true,
              },
            },
          },
        },
      },
    });

    if (!issue) {
      return next(new AppError('Issue not found.', 404));
    }

    // Verify user authorization for this repository
    const isOwner = issue.repository.installation.userId === req.user.id ||
      issue.repository.installation.accountLogin.toLowerCase() === req.user.githubUsername.toLowerCase();

    if (!isOwner) {
      return next(new AppError('Access denied. You do not have permission to view this issue.', 403));
    }

    res.json({
      success: true,
      issue: {
        id: issue.id,
        githubIssueId: issue.githubIssueId.toString(),
        issueNumber: issue.issueNumber,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        authorUsername: issue.authorUsername,
        authorAvatarUrl: issue.authorAvatarUrl,
        htmlUrl: issue.htmlUrl,
        labels: issue.labelsJson || [],
        githubCreatedAt: issue.githubCreatedAt,
        githubUpdatedAt: issue.githubUpdatedAt,
        githubClosedAt: issue.githubClosedAt,
        repository: {
          id: issue.repository.id,
          fullName: issue.repository.fullName,
          owner: issue.repository.owner,
          name: issue.repository.name,
        },
        latestAnalysis: issue.analyses[0] || null,
        triageActions: issue.triageActions,
      },
    });
  } catch (err) {
    next(err);
  }
}
