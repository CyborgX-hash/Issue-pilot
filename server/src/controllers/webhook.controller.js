import prisma from '../config/prisma.js';
import { verifyGitHubWebhookSignature } from '../utils/webhook-verify.js';
import { webhookHandlerService } from '../services/webhook-handler.service.js';
import { logger } from '../utils/logger.js';

export async function handleGitHubWebhook(req, res) {
  const signature = req.headers['x-hub-signature-256'];
  const eventType = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];

  if (!deliveryId) {
    return res.status(400).json({ error: 'Missing X-GitHub-Delivery header.' });
  }

  // Verify HMAC-SHA256 signature
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
  const isValid = verifyGitHubWebhookSignature(rawBody, signature);

  if (!isValid) {
    logger.warn('Rejected GitHub webhook with invalid signature', {
      eventType,
      deliveryId,
    });
    return res.status(401).json({ error: 'Invalid webhook signature.' });
  }

  // Deduplication check
  const existingDelivery = await prisma.webhookEvent.findUnique({
    where: { deliveryId },
  });

  if (existingDelivery) {
    logger.info('Deduplicated previously processed GitHub webhook delivery', { deliveryId });
    return res.status(200).json({
      success: true,
      message: 'Delivery already received. Deduplicated.',
      deliveryId,
    });
  }

  const action = req.body?.action || null;

  // Record incoming webhook delivery
  await prisma.webhookEvent.create({
    data: {
      deliveryId,
      eventType: eventType || 'unknown',
      action,
      payload: req.body,
      processingStatus: 'PENDING',
    },
  });

  // Acknowledge webhook delivery promptly to GitHub
  res.status(202).json({
    success: true,
    message: 'Webhook received and queued for processing.',
    deliveryId,
  });

  // Process event in background
  webhookHandlerService.processEvent({
    eventType,
    action,
    payload: req.body,
    deliveryId,
  }).catch(err => {
    logger.error('Asynchronous webhook processing error', { deliveryId, error: err.message });
  });
}
