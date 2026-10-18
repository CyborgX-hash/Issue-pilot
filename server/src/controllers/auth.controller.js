import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { signUserToken } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../utils/logger.js';

export async function getGitHubAuthUrl(req, res) {
  if (!env.GITHUB_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'GitHub OAuth is not configured. Missing GITHUB_CLIENT_ID.',
        setupGuideUrl: '/docs/GITHUB_APP_SETUP.md',
      },
    });
  }

  const backendBase = (env.BACKEND_URL || '').replace(/\/+$/, '');
  const redirectUri = `${backendBase}/api/auth/github/callback`;
  const scope = 'read:user user:email repo';
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

  if (req.query.format === 'json') {
    return res.json({ success: true, authUrl });
  }

  res.redirect(authUrl);
}

export async function handleGitHubCallback(req, res, next) {
  const { code, error } = req.query;

  if (error) {
    logger.warn('GitHub OAuth authorization was denied or errored', { error });
    return res.redirect(`${env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return next(new AppError('Missing authorization code from GitHub.', 400));
  }

  try {
    // Exchange authorization code for user access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      logger.error('Failed to exchange code for GitHub token', { error: tokenData.error });
      return res.redirect(`${env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed')}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch authenticated user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'IssuePilot-App',
      },
    });

    if (!userRes.ok) {
      throw new AppError('Failed to fetch user profile from GitHub.', 502);
    }

    const ghUser = await userRes.json();

    // Fetch primary email if not public in profile
    let email = ghUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'IssuePilot-App',
          },
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          const primary = emails.find(e => e.primary && e.verified);
          email = primary ? primary.email : (emails[0]?.email || null);
        }
      } catch (err) {
        logger.warn('Could not retrieve GitHub user email addresses', { error: err.message });
      }
    }

    // Upsert user in MySQL
    const user = await prisma.user.upsert({
      where: { githubId: BigInt(ghUser.id) },
      update: {
        githubUsername: ghUser.login,
        email,
        avatarUrl: ghUser.avatar_url,
        accessToken,
      },
      create: {
        githubId: BigInt(ghUser.id),
        githubUsername: ghUser.login,
        email,
        avatarUrl: ghUser.avatar_url,
        accessToken,
      },
    });

    logger.info('GitHub user authenticated successfully', {
      userId: user.id,
      username: user.githubUsername,
    });

    // Generate JWT and set secure cookie
    const token = signUserToken(user);

    const isProduction = env.NODE_ENV === 'production';
    res.cookie('issuepilot_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also attach token in query for client storage if needed in cross-origin environments
    const frontendBase = (env.FRONTEND_URL || '').replace(/\/+$/, '');
    res.redirect(`${frontendBase}/dashboard?auth_success=true&token=${token}`);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      githubId: req.user.githubId.toString(),
      githubUsername: req.user.githubUsername,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
      createdAt: req.user.createdAt,
    },
  });
}

export async function logout(req, res) {
  const isProduction = env.NODE_ENV === 'production';
  res.clearCookie('issuepilot_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}
