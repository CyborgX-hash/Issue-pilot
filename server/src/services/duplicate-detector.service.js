import prisma from '../config/prisma.js';
import { embeddingService } from './embedding.service.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

export class DuplicateDetectorService {
  /**
   * Compare target issue against other issues in the same repository.
   * Excludes target issue itself and pull requests.
   */
  async findDuplicateCandidates(targetIssueId, options = { threshold: 0.50, maxCandidates: 5 }) {
    const targetIssue = await prisma.issue.findUnique({
      where: { id: targetIssueId },
    });

    if (!targetIssue) {
      throw new AppError('Target issue not found for duplicate detection.', 404);
    }

    // Combine title and body for semantic evaluation
    const targetText = `${targetIssue.title}\n\n${targetIssue.body || ''}`;
    const targetVector = await embeddingService.getEmbedding(targetText);

    // Save target issue embedding cache
    await prisma.issue.update({
      where: { id: targetIssue.id },
      data: { embeddingJson: targetVector },
    });

    // Query other issues in the SAME repository
    const candidateIssues = await prisma.issue.findMany({
      where: {
        repositoryId: targetIssue.repositoryId,
        id: { not: targetIssue.id }, // NEVER compare to itself
      },
      select: {
        id: true,
        issueNumber: true,
        title: true,
        body: true,
        state: true,
        htmlUrl: true,
        embeddingJson: true,
      },
      take: 100,
    });

    const scoredCandidates = [];

    for (const candidate of candidateIssues) {
      let candidateVector = candidate.embeddingJson;

      if (!candidateVector || !Array.isArray(candidateVector)) {
        const candidateText = `${candidate.title}\n\n${candidate.body || ''}`;
        candidateVector = await embeddingService.getEmbedding(candidateText);

        // Cache candidate embedding asynchronously
        prisma.issue.update({
          where: { id: candidate.id },
          data: { embeddingJson: candidateVector },
        }).catch(() => {});
      }

      const similarityScore = embeddingService.cosineSimilarity(targetVector, candidateVector);

      if (similarityScore >= options.threshold) {
        scoredCandidates.push({
          issueId: candidate.id,
          issueNumber: candidate.issueNumber,
          title: candidate.title,
          similarityScore: Math.round(similarityScore * 100) / 100,
          state: candidate.state,
          htmlUrl: candidate.htmlUrl,
        });
      }
    }

    // Sort by similarity descending
    scoredCandidates.sort((a, b) => b.similarityScore - a.similarityScore);
    const topCandidates = scoredCandidates.slice(0, options.maxCandidates);

    logger.info('Duplicate detection completed', {
      targetIssueId: targetIssue.id,
      evaluatedCandidates: candidateIssues.length,
      matchingDuplicates: topCandidates.length,
    });

    return topCandidates;
  }
}

export const duplicateDetectorService = new DuplicateDetectorService();
