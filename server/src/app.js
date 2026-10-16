import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import githubRoutes from './routes/github.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import issueRoutes from './routes/issue.routes.js';
import triageRoutes from './routes/triage.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS setup
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Cookie parser
app.use(cookieParser(env.SESSION_SECRET));

// Capture raw body for GitHub webhook signature validation
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
  limit: '10mb',
}));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.use('/api', healthRoutes);

// API Route groups
app.use('/api', authRoutes);
app.use('/api', githubRoutes);
app.use('/api', repositoryRoutes);
app.use('/api', issueRoutes);
app.use('/api', triageRoutes);
app.use('/api', webhookRoutes);

// Base info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'IssuePilot API',
    tagline: 'Less time triaging. More time building.',
    version: '1.0.0',
    documentation: '/docs',
  });
});

// Centralized 404 & Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
