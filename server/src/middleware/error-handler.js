import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req, res, next) {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }

  // Log error (redacted)
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      message,
      stack: err.stack,
    });
  } else {
    logger.warn('Client request error', {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      message,
      details,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: details || undefined,
    },
  });
}
