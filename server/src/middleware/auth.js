import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { AppError } from './error-handler.js';

export function signUserToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      githubId: user.githubId.toString(),
      githubUsername: user.githubUsername,
    },
    env.SESSION_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // Check signed cookie first
    if (req.cookies && req.cookies.issuepilot_token) {
      token = req.cookies.issuepilot_token;
    } else if (req.signedCookies && req.signedCookies.issuepilot_token) {
      token = req.signedCookies.issuepilot_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please sign in with GitHub.', 401));
    }

    const decoded = jwt.verify(token, env.SESSION_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        githubId: true,
        githubUsername: true,
        email: true,
        avatarUrl: true,
        accessToken: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError('User session expired or user no longer exists.', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired authentication session.', 401));
    }
    next(err);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.issuepilot_token || req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, env.SESSION_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          githubId: true,
          githubUsername: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      if (user) req.user = user;
    }
    next();
  } catch {
    next();
  }
}
