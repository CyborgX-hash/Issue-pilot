import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { signUserToken } from '../src/middleware/auth.js';

describe('GitHub Installations and Repositories API', () => {
  let userA, tokenA;
  let userB, tokenB;
  let installationA;

  beforeEach(async () => {
    // User A
    userA = await prisma.user.upsert({
      where: { githubId: BigInt(888801) },
      update: { githubUsername: 'maintainer-alice' },
      create: {
        githubId: BigInt(888801),
        githubUsername: 'maintainer-alice',
        email: 'alice@example.com',
      },
    });
    tokenA = signUserToken(userA);

    // User B (unauthorized attacker)
    userB = await prisma.user.upsert({
      where: { githubId: BigInt(888802) },
      update: { githubUsername: 'attacker-bob' },
      create: {
        githubId: BigInt(888802),
        githubUsername: 'attacker-bob',
        email: 'bob@example.com',
      },
    });
    tokenB = signUserToken(userB);

    // Installation belonging to User A
    installationA = await prisma.gitHubInstallation.upsert({
      where: { githubInstallationId: BigInt(77701) },
      update: {
        userId: userA.id,
        accountLogin: 'maintainer-alice',
        status: 'active',
      },
      create: {
        githubInstallationId: BigInt(77701),
        accountLogin: 'maintainer-alice',
        accountId: BigInt(888801),
        userId: userA.id,
        status: 'active',
      },
    });

    // Repository under Installation A
    await prisma.repository.upsert({
      where: { githubRepoId: BigInt(66601) },
      update: {
        owner: 'maintainer-alice',
        name: 'core-library',
        fullName: 'maintainer-alice/core-library',
        installationId: installationA.id,
        isActive: true,
      },
      create: {
        githubRepoId: BigInt(66601),
        owner: 'maintainer-alice',
        name: 'core-library',
        fullName: 'maintainer-alice/core-library',
        installationId: installationA.id,
        isActive: true,
      },
    });
  });

  it('GET /api/github/installations requires authentication', async () => {
    const res = await request(app).get('/api/github/installations');
    expect(res.status).toBe(401);
  });

  it('GET /api/github/installations returns only installations accessible to user', async () => {
    const res = await request(app)
      .get('/api/github/installations')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.installations.length).toBeGreaterThanOrEqual(1);
    expect(res.body.installations.some(i => i.id === installationA.id)).toBe(true);
  });

  it('GET /api/github/installations/:id/repositories returns 403 Forbidden for unauthorized user', async () => {
    // User B attempts to access User A's installation repositories
    const res = await request(app)
      .get(`/api/github/installations/${installationA.id}/repositories`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Unauthorized/i);
  });

  it('GET /api/github/installations/:id/repositories succeeds for authorized owner', async () => {
    const res = await request(app)
      .get(`/api/github/installations/${installationA.id}/repositories`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.repositories.length).toBeGreaterThanOrEqual(1);
    expect(res.body.repositories[0].fullName).toBe('maintainer-alice/core-library');
  });
});
