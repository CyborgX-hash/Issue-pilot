import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error-handler.js';

// Cache installation tokens in memory until near-expiration
// Format: { [installationId]: { token: string, expiresAt: Date } }
const tokenCache = new Map();

export class GitHubAppService {
  constructor() {
    this.appId = env.GITHUB_APP_ID;
    this.privateKey = this.formatPrivateKey(env.GITHUB_PRIVATE_KEY);
    this.clientId = env.GITHUB_CLIENT_ID;
    this.clientSecret = env.GITHUB_CLIENT_SECRET;
  }

  isConfigured() {
    return Boolean(this.appId && this.privateKey);
  }

  formatPrivateKey(key) {
    if (!key) return null;
    // Handle escaped newlines from environment strings
    if (key.includes('\\n')) {
      return key.replace(/\\n/g, '\n');
    }
    return key;
  }

  getAppOctokit() {
    if (!this.isConfigured()) {
      throw new AppError('GitHub App is not configured. Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY.', 503);
    }
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      },
    });
  }

  async getInstallationToken(installationId) {
    const idStr = String(installationId);
    const cached = tokenCache.get(idStr);

    // Return cached token if valid for at least 5 more minutes
    if (cached && cached.expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
      return cached.token;
    }

    if (!this.isConfigured()) {
      throw new AppError('GitHub App credentials missing for installation token generation.', 503);
    }

    try {
      const appOctokit = this.getAppOctokit();
      const response = await appOctokit.rest.apps.createInstallationAccessToken({
        installation_id: Number(installationId),
      });

      const token = response.data.token;
      const expiresAt = new Date(response.data.expires_at);

      tokenCache.set(idStr, { token, expiresAt });
      logger.info('Generated new GitHub App installation access token', {
        installationId: idStr,
        expiresAt: expiresAt.toISOString(),
      });

      return token;
    } catch (err) {
      logger.error('Failed to create installation access token', {
        installationId: idStr,
        error: err.message,
      });
      throw new AppError(`GitHub App authentication failed for installation ${idStr}: ${err.message}`, 502);
    }
  }

  async getInstallationOctokit(installationId) {
    const token = await this.getInstallationToken(installationId);
    return new Octokit({ auth: token });
  }

  async getUserOctokit(userAccessToken) {
    if (!userAccessToken) {
      throw new AppError('User access token is required for user-scoped GitHub operations.', 401);
    }
    return new Octokit({ auth: userAccessToken });
  }

  /**
   * Verify if an authenticated GitHub user has access to a specific repository
   */
  async verifyUserRepoAccess(userAccessToken, owner, repo) {
    try {
      const octokit = await this.getUserOctokit(userAccessToken);
      const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username: (await octokit.rest.users.getAuthenticated()).data.login,
      });
      // User must have admin, maintain, or push/write permission
      return ['admin', 'maintain', 'write'].includes(data.permission);
    } catch (err) {
      logger.warn('Failed to verify user repo collaborator status via GitHub', {
        owner,
        repo,
        error: err.message,
      });
      return false;
    }
  }
}

export const githubAppService = new GitHubAppService();
