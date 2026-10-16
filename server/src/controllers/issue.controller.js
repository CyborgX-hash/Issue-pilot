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

export async function analyzeIssue(req, res, next) {
  try {
    const { issueId } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        repository: {
          include: { installation: true },
        },
      },
    });

    if (!issue) {
      return next(new AppError('Issue not found.', 404));
    }

    const isOwner = issue.repository.installation.userId === req.user.id ||
      issue.repository.installation.accountLogin.toLowerCase() === req.user.githubUsername.toLowerCase();

    if (!isOwner) {
      return next(new AppError('Unauthorized to analyze this issue.', 403));
    }

    const { aiTriageService } = await import('../services/ai-triage.service.js');
    const analysis = await aiTriageService.analyzeIssue(issue.id);

    res.json({
      success: true,
      message: 'Issue analyzed successfully.',
      analysis,
    });
  } catch (err) {
    next(err);
  }
}

export async function getIssueAnalysis(req, res, next) {
  try {
    const { issueId } = req.params;

    const analysis = await prisma.issueAnalysis.findFirst({
      where: { issueId },
      orderBy: { createdAt: 'desc' },
      include: {
        issue: {
          select: {
            id: true,
            issueNumber: true,
            title: true,
            repository: {
              select: {
                id: true,
                fullName: true,
                installation: true,
              },
            },
          },
        },
      },
    });

    if (!analysis) {
      return next(new AppError('No analysis found for this issue.', 404));
    }

    const isOwner = analysis.issue.repository.installation.userId === req.user.id ||
      analysis.issue.repository.installation.accountLogin.toLowerCase() === req.user.githubUsername.toLowerCase();

    if (!isOwner) {
      return next(new AppError('Unauthorized to view this analysis.', 403));
    }

    res.json({
      success: true,
      analysis,
    });
  } catch (err) {
    next(err);
  }
}

export async function getIssueDuplicates(req, res, next) {
  try {
    const { issueId } = req.params;
    const threshold = parseFloat(req.query.threshold) || 0.50;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        repository: {
          include: { installation: true },
        },
      },
    });

    if (!issue) {
      return next(new AppError('Issue not found.', 404));
    }

    const isOwner = issue.repository.installation.userId === req.user.id ||
      issue.repository.installation.accountLogin.toLowerCase() === req.user.githubUsername.toLowerCase();

    if (!isOwner) {
      return next(new AppError('Unauthorized to view duplicates for this issue.', 403));
    }

    const { duplicateDetectorService } = await import('../services/duplicate-detector.service.js');
    const duplicates = await duplicateDetectorService.findDuplicateCandidates(issue.id, { threshold });

    res.json({
      success: true,
      issueId: issue.id,
      duplicates,
    });
  } catch (err) {
    next(err);
  }
}
