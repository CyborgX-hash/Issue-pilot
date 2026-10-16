import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';
import { createTestWebhookSignature } from '../src/utils/webhook-verify.js';

describe('GitHub Webhook Verification and Event Processing', () => {
  let installation, repo;

  beforeEach(async () => {
    installation = await prisma.gitHubInstallation.upsert({
      where: { githubInstallationId: BigInt(944001) },
      update: { accountLogin: 'webhook-org', status: 'active' },
      create: {
        githubInstallationId: BigInt(944001),
        accountLogin: 'webhook-org',
        accountId: BigInt(944001),
        status: 'active',
      },
    });

    repo = await prisma.repository.upsert({
      where: { githubRepoId: BigInt(844001) },
      update: {
        owner: 'webhook-org',
        name: 'live-repo',
        fullName: 'webhook-org/live-repo',
        installationId: installation.id,
      },
      create: {
        githubRepoId: BigInt(844001),
        owner: 'webhook-org',
        name: 'live-repo',
        fullName: 'webhook-org/live-repo',
        installationId: installation.id,
      },
    });
  });

  it('POST /api/webhooks/github rejects requests missing X-GitHub-Delivery', async () => {
    const res = await request(app)
      .post('/api/webhooks/github')
      .send({ action: 'opened' });

    expect(res.status).toBe(400);
  });

  it('POST /api/webhooks/github rejects invalid HMAC-SHA256 signature with 401', async () => {
    const payload = JSON.stringify({ action: 'opened' });
    const res = await request(app)
      .post('/api/webhooks/github')
      .set('X-GitHub-Delivery', 'delivery-fake-001')
      .set('X-GitHub-Event', 'issues')
      .set('X-Hub-Signature-256', 'sha256=invalid_signature_hex_digest_1234567890abcdef')
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid webhook signature/i);
  });

  it('POST /api/webhooks/github accepts valid signature and creates issue', async () => {
    const deliveryId = `delivery-${Date.now()}-test`;
    const payloadObj = {
      action: 'opened',
      issue: {
        id: 744001,
        number: 108,
        title: 'Memory leak in streaming response parser',
        body: 'Leaking 50MB per 1k requests.',
        state: 'open',
        user: { login: 'community-member' },
        html_url: 'https://github.com/webhook-org/live-repo/issues/108',
        labels: [{ name: 'bug' }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      repository: {
        id: 844001,
        full_name: 'webhook-org/live-repo',
      },
    };

    const payloadString = JSON.stringify(payloadObj);
    const validSignature = createTestWebhookSignature(payloadString);

    const res = await request(app)
      .post('/api/webhooks/github')
      .set('X-GitHub-Delivery', deliveryId)
      .set('X-GitHub-Event', 'issues')
      .set('X-Hub-Signature-256', validSignature)
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.deliveryId).toBe(deliveryId);

    // Verify delivery was recorded
    const event = await prisma.webhookEvent.findUnique({
      where: { deliveryId },
    });
    expect(event).toBeDefined();
    expect(event.eventType).toBe('issues');
  });

  it('POST /api/webhooks/github deduplicates repeated deliveries with 200 OK', async () => {
    const deliveryId = `delivery-dedup-${Date.now()}`;
    const payloadObj = { action: 'ping' };
    const payloadString = JSON.stringify(payloadObj);
    const validSignature = createTestWebhookSignature(payloadString);

    // First delivery
    const res1 = await request(app)
      .post('/api/webhooks/github')
      .set('X-GitHub-Delivery', deliveryId)
      .set('X-GitHub-Event', 'ping')
      .set('X-Hub-Signature-256', validSignature)
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res1.status).toBe(202);

    // Repeated delivery with same X-GitHub-Delivery ID
    const res2 = await request(app)
      .post('/api/webhooks/github')
      .set('X-GitHub-Delivery', deliveryId)
      .set('X-GitHub-Event', 'ping')
      .set('X-Hub-Signature-256', validSignature)
      .set('Content-Type', 'application/json')
      .send(payloadString);

    expect(res2.status).toBe(200);
    expect(res2.body.message).toMatch(/Deduplicated/i);
  });
});
