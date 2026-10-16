import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import prisma from './config/prisma.js';

const PORT = env.PORT || 4000;

async function startServer() {
  try {
    // Verify database connection on startup
    await prisma.$connect();
    logger.info('Connected to MySQL database via Prisma');

    const server = app.listen(PORT, () => {
      logger.info(`IssuePilot API Server running on port ${PORT}`, {
        port: PORT,
        env: env.NODE_ENV,
        backendUrl: env.BACKEND_URL,
      });
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

startServer();
