import { Router } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - startTime;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error: ' + error.message;
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'operational',
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    version: '1.0.0',
  });
});

export default router;
