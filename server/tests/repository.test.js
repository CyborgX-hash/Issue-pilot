import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { signUserToken } from '../src/middleware/auth.js';

describe('Repository and Issue Synchronization API', () => {
  let userMaintainer, tokenMaintainer;
  let userUnauthorized, tokenUnauthorized;
  let installation;
  let testRepo;
  let issue1, issue2;

  beforeEach(async () => {
    userMaintainer = await prisma.user.upsert({
      where: { githubId: BigInt(89001) },
      update: { githubUsername: 'lead-dev' },
      create: {
        githubId: BigInt(89001),
        githubUsername: 'lead-dev',
        email: 'lead@example.com',
      },
    });
    tokenMaintainer = signUserToken(userMaintainer);

    userUnauthorized = await prisma.user.upsert({
      where: { githubId: BigInt(89002) },
      update: { githubUsername: 'stranger-danger' },
      create: {
        githubId: BigInt(89002),
        githubUsername: 'stranger-danger',
        email: 'stranger@example.com',
      },
    });
    tokenUnauthorized = signUserToken(userUnauthorized);

    installation = await prisma.gitHubInstallation.upsert({
      where: { githubInstallationId: BigInt(78901) },
      update: {
        userId: userMaintainer.id,
        accountLogin: 'lead-dev',
      },
      create: {
        githubInstallationId: BigInt(78901),
        accountLogin: 'lead-dev',
        accountId: BigInt(89001),
        userId: userMaintainer.id,
        status: 'active',
      },
    });

    testRepo = await prisma.repository.upsert({
      where: { githubRepoId: BigInt(678901) },
      update: {
        owner: 'lead-dev',
        name: 'payment-gateway',
        fullName: 'lead-dev/payment-gateway',
        installationId: installation.id,
        isActive: true,
      },
      create: {
        githubRepoId: BigInt(678901),
        owner: 'lead-dev',
        name: 'payment-gateway',
        fullName: 'lead-dev/payment-gateway',
        installationId: installation.id,
        isActive: true,
      },
    });

    // Create 2 test issues
    issue1 = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(555001) },
      update: {
        title: 'Crash on Stripe webhook timeout',
        body: 'When Stripe webhook times out, worker crashes with uncaught promise rejection.',
        state: 'open',
        labelsJson: ['bug', 'priority:high'],
      },
      create: {
        githubIssueId: BigInt(555001),
        issueNumber: 1,
        title: 'Crash on Stripe webhook timeout',
        body: 'When Stripe webhook times out, worker crashes with uncaught promise rejection.',
        state: 'open',
        authorUsername: 'reporter1',
        htmlUrl: 'https://github.com/lead-dev/payment-gateway/issues/1',
        labelsJson: ['bug', 'priority:high'],
        repositoryId: testRepo.id,
      },
    });

    issue2 = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(555002) },
      update: {
        title: 'Add PayPal checkout support',
        body: 'Proposal to add PayPal payment flow alongside Stripe.',
        state: 'closed',
        labelsJson: ['enhancement'],
      },
      create: {
        githubIssueId: BigInt(555002),
        issueNumber: 2,
        title: 'Add PayPal checkout support',
        body: 'Proposal to add PayPal payment flow alongside Stripe.',
        state: 'closed',
        authorUsername: 'reporter2',
        htmlUrl: 'https://github.com/lead-dev/payment-gateway/issues/2',
        labelsJson: ['enhancement'],
        repositoryId: testRepo.id,
      },
    });
  });

  it('GET /api/repositories lists user accessible repositories with statistics', async () => {
    const res = await request(app)
      .get('/api/repositories')
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.repositories)).toBe(true);
    const repoMatch = res.body.repositories.find(r => r.id === testRepo.id);
    expect(repoMatch).toBeDefined();
    expect(repoMatch.totalIssues).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/repositories/:id returns 403 for unauthorized user', async () => {
    const res = await request(app)
      .get(`/api/repositories/${testRepo.id}`)
      .set('Authorization', `Bearer ${tokenUnauthorized}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/repositories/:id returns repository details for maintainer', async () => {
    const res = await request(app)
      .get(`/api/repositories/${testRepo.id}`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.repository.fullName).toBe('lead-dev/payment-gateway');
    expect(res.body.repository.openIssues).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/repositories/:id/issues returns paginated issues with filter support', async () => {
    const res = await request(app)
      .get(`/api/repositories/${testRepo.id}/issues?state=open`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toHaveProperty('totalCount');
    expect(res.body.issues.length).toBeGreaterThanOrEqual(1);
    expect(res.body.issues.every(i => i.state === 'open')).toBe(true);
  });

  it('GET /api/issues/:issueId returns detailed issue data for maintainer', async () => {
    const res = await request(app)
      .get(`/api/issues/${issue1.id}`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.issue.title).toBe('Crash on Stripe webhook timeout');
    expect(res.body.issue.authorUsername).toBe('reporter1');
  });

  it('GET /api/repositories/:id/stats computes issue statistics', async () => {
    const res = await request(app)
      .get(`/api/repositories/${testRepo.id}/stats`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toHaveProperty('totalIssues');
    expect(res.body.stats).toHaveProperty('openIssues');
    expect(res.body.stats).toHaveProperty('closedIssues');
    expect(res.body.stats.openIssues).toBeGreaterThanOrEqual(1);
    expect(res.body.stats.closedIssues).toBeGreaterThanOrEqual(1);
  });
});
