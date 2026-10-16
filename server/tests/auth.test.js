import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { signUserToken } from '../src/middleware/auth.js';

describe('Authentication & Session API', () => {
  let testUser;
  let testToken;

  beforeEach(async () => {
    // Upsert a test fixture user
    testUser = await prisma.user.upsert({
      where: { githubId: BigInt(99999901) },
      update: {
        githubUsername: 'octocat-test',
        email: 'octocat@github.example',
      },
      create: {
        githubId: BigInt(99999901),
        githubUsername: 'octocat-test',
        email: 'octocat@github.example',
        avatarUrl: 'https://avatars.githubusercontent.com/u/99999901',
      },
    });

    testToken = signUserToken(testUser);
  });

  it('GET /api/me returns 401 Unauthorized without session token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Authentication required/i);
  });

  it('GET /api/me returns 401 Unauthorized with invalid bearer token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer invalid_bogus_token_123');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/me returns authenticated user details with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty('id', testUser.id);
    expect(res.body.user).toHaveProperty('githubUsername', 'octocat-test');
    expect(res.body.user).toHaveProperty('email', 'octocat@github.example');
  });

  it('GET /api/me returns authenticated user details with valid Cookie', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Cookie', [`issuepilot_token=${testToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.githubUsername).toBe('octocat-test');
  });

  it('POST /api/auth/logout clears the session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toMatch(/issuepilot_token=;/);
  });
});
