import { getAdapter } from '../adapters/index.js';
import { Post, User } from '../models/index.js';

/**
 * Publishing Engine — orchestrates multi-platform publishing
 * Validates content, dispatches to adapters, tracks status
 */
class PublishingEngine {
  /**
   * Publish a post to all target platforms
   */
  async publishPost(postId) {
    const post = await Post.findByPk(postId, { include: User });
    if (!post) throw new Error('Post not found');

    const results = [];
    post.status = 'publishing';
    await post.save();

    for (const platformId of post.platforms) {
      const statusEntry = post.publishStatus.find(s => s.platform === platformId) ||
        { platform: platformId, status: 'queued', retryCount: 0 };

      if (statusEntry.status === 'published') continue;

      try {
        const adapter = getAdapter(platformId);

        // Validate content
        const validation = adapter.validate(post);
        if (!validation.valid) {
          statusEntry.status = 'failed';
          statusEntry.error = validation.errors.join('; ');
          results.push({ platform: platformId, success: false, errors: validation.errors });
          continue;
        }

        // Get credentials for this platform
        const userObj = post.User || post.user;
        const credentials = this.getCredentials(userObj, platformId);
        console.log(`🔑 Credentials for ${platformId}:`, JSON.stringify({ ...credentials, accessToken: '***' }));
        
        // Check the correct credential field per platform
        const needsPageId = ['facebook'];
        const needsAccountId = ['instagram', 'linkedin', 'youtube'];
        if (!credentials) {
          statusEntry.status = 'failed';
          statusEntry.error = `No ${platformId} account connected. Please connect your account first.`;
          results.push({ platform: platformId, success: false, error: 'No credentials' });
          continue;
        }
        if (needsPageId.includes(platformId) && !credentials.pageId) {
          statusEntry.status = 'failed';
          statusEntry.error = `No valid ${platformId} page selected. Please reconnect and select a page.`;
          results.push({ platform: platformId, success: false, error: 'Missing pageId' });
          continue;
        }
        if (needsAccountId.includes(platformId) && !credentials.accountId) {
          statusEntry.status = 'failed';
          statusEntry.error = `No valid ${platformId} account found. Please reconnect your account.`;
          results.push({ platform: platformId, success: false, error: 'Missing accountId' });
          continue;
        }

        // Publish
        statusEntry.status = 'publishing';
        const result = await adapter.publish(post, credentials);

        if (result.success) {
          statusEntry.status = 'published';
          statusEntry.publishedAt = new Date();
          statusEntry.externalId = result.externalId;
          statusEntry.externalUrl = result.externalUrl;
          // Clear any previous errors if we succeeded
          delete statusEntry.error;
        } else {
          statusEntry.retryCount += 1;
          statusEntry.lastRetryAt = new Date();
          statusEntry.status = statusEntry.retryCount >= (statusEntry.maxRetries || 3) ? 'failed' : 'queued';
          statusEntry.error = result.error;
        }

        results.push(result);
      } catch (error) {
        statusEntry.status = 'failed';
        statusEntry.error = error.message;
        results.push({ platform: platformId, success: false, error: error.message });
      }

      // Update the status entry in the post
      const existingIdx = post.publishStatus.findIndex(s => s.platform === platformId);
      if (existingIdx >= 0) {
        post.publishStatus[existingIdx] = statusEntry;
      } else {
        post.publishStatus.push(statusEntry);
      }
    }

    // Determine overall status
    const statuses = post.publishStatus.map(s => s.status);
    if (statuses.every(s => s === 'published')) {
      post.status = 'published';
    } else if (statuses.some(s => s === 'published')) {
      post.status = 'partially_published';
    } else if (statuses.every(s => s === 'failed')) {
      post.status = 'failed';
    } else {
      post.status = 'queued';
    }

    post.changed('publishStatus', true);
    await post.save();
    return { post, results };
  }

  /**
   * Validate content for all target platforms without publishing
   */
  validateForPlatforms(post) {
    const validations = {};
    for (const platformId of post.platforms) {
      try {
        const adapter = getAdapter(platformId);
        validations[platformId] = adapter.validate(post);
      } catch (error) {
        validations[platformId] = { valid: false, errors: [error.message] };
      }
    }
    return validations;
  }

  /**
   * Extract credentials for a platform from user's connected platforms
   */
  getCredentials(user, platformId) {
    if (!user || typeof user === 'string') return null;
    const conn = user.connectedPlatforms?.find(
      p => p.platform === platformId && p.isActive
    );
    if (!conn) return null;
    return {
      accessToken: conn.accessToken,
      refreshToken: conn.refreshToken,
      accountId: conn.accountId,
      pageId: conn.pageId,
      botToken: conn.metadata?.botToken,
      chatId: conn.metadata?.chatId,
      phoneNumberId: conn.metadata?.phoneNumberId,
      recipientNumber: conn.metadata?.recipientNumber,
      defaultBoardId: conn.metadata?.defaultBoardId
    };
  }

  /**
   * Retry failed publications for a post
   */
  async retryFailed(postId) {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');

    const failedPlatforms = post.publishStatus
      .filter(s => s.status === 'failed' && s.retryCount < (s.maxRetries || 3))
      .map(s => s.platform);

    if (failedPlatforms.length === 0) {
      return { message: 'No retryable failures found' };
    }

    // Reset failed statuses to queued
    post.publishStatus.forEach(s => {
      if (failedPlatforms.includes(s.platform)) {
        s.status = 'queued';
      }
    });
    post.status = 'queued';
    post.changed('publishStatus', true);
    await post.save();

    return this.publishPost(postId);
  }
}

export default new PublishingEngine();
