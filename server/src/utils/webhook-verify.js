import crypto from 'crypto';
import { env } from '../config/env.js';

export function verifyGitHubWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return false;
  }

  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const [algorithm, signature] = signatureHeader.split('=');
  if (algorithm !== 'sha256' || !signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody || '');
  const calculatedSignature = hmac.digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'hex');
  const calcBuffer = Buffer.from(calculatedSignature, 'hex');

  if (sigBuffer.length !== calcBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, calcBuffer);
}

export function createTestWebhookSignature(payloadString, secret = env.GITHUB_WEBHOOK_SECRET) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return `sha256=${hmac.digest('hex')}`;
}
