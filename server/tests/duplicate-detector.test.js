import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { signUserToken } from '../src/middleware/auth.js';
import { embeddingService } from '../src/services/embedding.service.js';
import { duplicateDetectorService } from '../src/services/duplicate-detector.service.js';

describe('Semantic Embedding & Duplicate Issue Detection', () => {
  let user, token;
  let installation, repoA, repoB;
  let originalIssue, duplicateIssue, unrelatedIssue, crossRepoIssue;

  beforeEach(async () => {
    user = await prisma.user.upsert({
      where: { githubId: BigInt(912001) },
      update: { githubUsername: 'triage-sherlock' },
      create: {
        githubId: BigInt(912001),
        githubUsername: 'triage-sherlock',
        email: 'sherlock@example.com',
      },
    });
    token = signUserToken(user);

    installation = await prisma.gitHubInstallation.upsert({
      where: { githubInstallationId: BigInt(812001) },
      update: { userId: user.id, accountLogin: 'triage-sherlock' },
      create: {
        githubInstallationId: BigInt(812001),
        accountLogin: 'triage-sherlock',
        accountId: BigInt(912001),
        userId: user.id,
        status: 'active',
      },
    });

    repoA = await prisma.repository.upsert({
      where: { githubRepoId: BigInt(712001) },
      update: {
        owner: 'triage-sherlock',
        name: 'database-driver',
        fullName: 'triage-sherlock/database-driver',
        installationId: installation.id,
      },
      create: {
        githubRepoId: BigInt(712001),
        owner: 'triage-sherlock',
        name: 'database-driver',
        fullName: 'triage-sherlock/database-driver',
        installationId: installation.id,
      },
    });

    repoB = await prisma.repository.upsert({
      where: { githubRepoId: BigInt(712002) },
      update: {
        owner: 'triage-sherlock',
        name: 'other-library',
        fullName: 'triage-sherlock/other-library',
        installationId: installation.id,
      },
      create: {
        githubRepoId: BigInt(712002),
        owner: 'triage-sherlock',
        name: 'other-library',
        fullName: 'triage-sherlock/other-library',
        installationId: installation.id,
      },
    });

    // Original issue in Repo A
    originalIssue = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(612001) },
      update: {
        title: 'Connection pool exhausted under high concurrent query load',
        body: 'MySQL connection pool times out when more than 50 queries are executed concurrently. Error: Pool connection timeout.',
        repositoryId: repoA.id,
      },
      create: {
        githubIssueId: BigInt(612001),
        issueNumber: 101,
        title: 'Connection pool exhausted under high concurrent query load',
        body: 'MySQL connection pool times out when more than 50 queries are executed concurrently. Error: Pool connection timeout.',
        repositoryId: repoA.id,
        htmlUrl: 'https://github.com/triage-sherlock/database-driver/issues/101',
      },
    });

    // Near-duplicate issue in Repo A
    duplicateIssue = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(612002) },
      update: {
        title: 'Pool connection timeout error with concurrent database queries',
        body: 'Under high load, our server throws Pool connection timeout error. Connection pool seems exhausted.',
        repositoryId: repoA.id,
      },
      create: {
        githubIssueId: BigInt(612002),
        issueNumber: 102,
        title: 'Pool connection timeout error with concurrent database queries',
        body: 'Under high load, our server throws Pool connection timeout error. Connection pool seems exhausted.',
        repositoryId: repoA.id,
        htmlUrl: 'https://github.com/triage-sherlock/database-driver/issues/102',
      },
    });

    // Completely unrelated issue in Repo A
    unrelatedIssue = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(612003) },
      update: {
        title: 'Add dark mode theme colors to documentation website',
        body: 'The documentation website needs a toggle for dark mode palette.',
        repositoryId: repoA.id,
      },
      create: {
        githubIssueId: BigInt(612003),
        issueNumber: 103,
        title: 'Add dark mode theme colors to documentation website',
        body: 'The documentation website needs a toggle for dark mode palette.',
        repositoryId: repoA.id,
        htmlUrl: 'https://github.com/triage-sherlock/database-driver/issues/103',
      },
    });

    // Similar text, but in Repo B (different repo!)
    crossRepoIssue = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(612004) },
      update: {
        title: 'Connection pool exhausted under high load',
        body: 'Same error in other library',
        repositoryId: repoB.id,
      },
      create: {
        githubIssueId: BigInt(612004),
        issueNumber: 1,
        title: 'Connection pool exhausted under high load',
        body: 'Same error in other library',
        repositoryId: repoB.id,
        htmlUrl: 'https://github.com/triage-sherlock/other-library/issues/1',
      },
    });
  });

  it('Cosine similarity correctly computes 1.0 for identical vectors and handles zero vectors', () => {
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const vecB = [0.5, 0.5, 0.5, 0.5];
    expect(embeddingService.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0);

    const zeroVec = [0, 0, 0, 0];
    expect(embeddingService.cosineSimilarity(vecA, zeroVec)).toBe(0);
  });

  it('Duplicate detection ranks semantically similar issue highly and excludes self', async () => {
    const candidates = await duplicateDetectorService.findDuplicateCandidates(originalIssue.id, {
      threshold: 0.30,
      maxCandidates: 5,
    });

    // Self must never appear in candidates
    expect(candidates.some(c => c.issueId === originalIssue.id)).toBe(false);

    // Cross-repo issue must never appear in candidates
    expect(candidates.some(c => c.issueId === crossRepoIssue.id)).toBe(false);

    // Duplicate issue in same repo must be identified and ranked at top
    expect(candidates.length).toBeGreaterThanOrEqual(1);
    expect(candidates[0].issueId).toBe(duplicateIssue.id);
    expect(candidates[0].similarityScore).toBeGreaterThan(0.40);
  });

  it('GET /api/issues/:issueId/duplicates endpoint returns duplicate candidates list', async () => {
    const res = await request(app)
      .get(`/api/issues/${originalIssue.id}/duplicates?threshold=0.30`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.duplicates)).toBe(true);
    expect(res.body.duplicates.some(d => d.issueNumber === 102)).toBe(true);
  });
});
