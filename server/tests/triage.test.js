import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { signUserToken } from '../src/middleware/auth.js';

describe('Triage Review Queue and Human Approval Workflow', () => {
  let userMaintainer, tokenMaintainer;
  let userUnauthorized, tokenUnauthorized;
  let installation, repo, issue, triageAction;

  beforeEach(async () => {
    userMaintainer = await prisma.user.upsert({
      where: { githubId: BigInt(833001) },
      update: { githubUsername: 'repo-approver' },
      create: {
        githubId: BigInt(833001),
        githubUsername: 'repo-approver',
        email: 'approver@example.com',
      },
    });
    tokenMaintainer = signUserToken(userMaintainer);

    userUnauthorized = await prisma.user.upsert({
      where: { githubId: BigInt(833002) },
      update: { githubUsername: 'intruder' },
      create: {
        githubId: BigInt(833002),
        githubUsername: 'intruder',
        email: 'intruder@example.com',
      },
    });
    tokenUnauthorized = signUserToken(userUnauthorized);

    installation = await prisma.gitHubInstallation.upsert({
      where: { githubInstallationId: BigInt(733001) },
      update: { userId: userMaintainer.id, accountLogin: 'repo-approver' },
      create: {
        githubInstallationId: BigInt(733001),
        accountLogin: 'repo-approver',
        accountId: BigInt(833001),
        userId: userMaintainer.id,
        status: 'active',
      },
    });

    repo = await prisma.repository.upsert({
      where: { githubRepoId: BigInt(633001) },
      update: {
        owner: 'repo-approver',
        name: 'cli-tool',
        fullName: 'repo-approver/cli-tool',
        installationId: installation.id,
      },
      create: {
        githubRepoId: BigInt(633001),
        owner: 'repo-approver',
        name: 'cli-tool',
        fullName: 'repo-approver/cli-tool',
        installationId: installation.id,
      },
    });

    issue = await prisma.issue.upsert({
      where: { githubIssueId: BigInt(533001) },
      update: {
        title: 'Buffer overflow on parsing malformed flag argument',
        repositoryId: repo.id,
      },
      create: {
        githubIssueId: BigInt(533001),
        issueNumber: 15,
        title: 'Buffer overflow on parsing malformed flag argument',
        body: 'Passing -f with 2048 chars causes crash.',
        repositoryId: repo.id,
        htmlUrl: 'https://github.com/repo-approver/cli-tool/issues/15',
      },
    });

    triageAction = await prisma.triageAction.create({
      data: {
        issueId: issue.id,
        actionType: 'APPLY_LABELS',
        proposedPayload: { labels: ['bug', 'security'] },
        approvalStatus: 'PENDING',
        executionStatus: 'PENDING',
      },
    });
  });

  it('GET /api/triage/actions returns review queue items', async () => {
    const res = await request(app)
      .get('/api/triage/actions?status=PENDING')
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions.some(a => a.id === triageAction.id)).toBe(true);
  });

  it('POST /api/triage/actions/:id/approve updates status to APPROVED and allows editing payload', async () => {
    const res = await request(app)
      .post(`/api/triage/actions/${triageAction.id}/approve`)
      .send({ proposedPayload: { labels: ['bug', 'security', 'critical'] } })
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.action.approvalStatus).toBe('APPROVED');
    expect(res.body.action.proposedPayload.labels).toContain('critical');
  });

  it('POST /api/triage/actions/:id/reject rejects proposed action', async () => {
    const res = await request(app)
      .post(`/api/triage/actions/${triageAction.id}/reject`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.action.approvalStatus).toBe('REJECTED');
  });

  it('POST /api/triage/actions/:id/apply applies action and prevents double-application', async () => {
    // First application succeeds
    const res1 = await request(app)
      .post(`/api/triage/actions/${triageAction.id}/apply`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.action.approvalStatus).toBe('APPLIED');
    expect(res1.body.action.executionStatus).toBe('EXECUTED');

    // Second application must fail with 409 Conflict (idempotency protection)
    const res2 = await request(app)
      .post(`/api/triage/actions/${triageAction.id}/apply`)
      .set('Authorization', `Bearer ${tokenMaintainer}`);

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
  });

  it('Unauthorized user cannot approve or apply actions (IDOR protection)', async () => {
    const res = await request(app)
      .post(`/api/triage/actions/${triageAction.id}/approve`)
      .set('Authorization', `Bearer ${tokenUnauthorized}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
