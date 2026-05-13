import { Post, User } from '../models/index.js';
import { getAdapter } from '../adapters/index.js';
import { Sequelize } from 'sequelize';

/**
 * Token Manager — handles OAuth token refresh and expiry tracking
 */
class TokenManager {
  /**
   * Check and refresh tokens for all users
   */
  async refreshExpiringTokens() {
    try {
      // Note: In Postgres with JSONB, exact matching inside array of objects can be complex,
      // so we fetch users who have at least one connected platform and filter in JS
      const users = await User.findAll();

      for (const user of users) {
        if (!user.connectedPlatforms || user.connectedPlatforms.length === 0) continue;
        let updated = false;
        for (const conn of user.connectedPlatforms) {
          if (!conn.isActive || !conn.tokenExpiry) continue;

          // Refresh if token expires within 24 hours
          const hoursUntilExpiry = (new Date(conn.tokenExpiry) - new Date()) / (1000 * 60 * 60);
          if (hoursUntilExpiry < 24 && conn.refreshToken) {
            try {
              const adapter = getAdapter(conn.platform);
              const newTokens = await adapter.refreshToken(conn.refreshToken);

              conn.accessToken = newTokens.accessToken;
              if (newTokens.refreshToken) conn.refreshToken = newTokens.refreshToken;
              conn.tokenExpiry = new Date(Date.now() + (newTokens.expiresIn || 3600) * 1000);
              conn.lastRefreshed = new Date();

              updated = true;
              console.log(`🔑 Refreshed ${conn.platform} token for user ${user._id}`);
            } catch (error) {
              console.error(`❌ Failed to refresh ${conn.platform} token for ${user._id}:`, error.message);
              // Don't deactivate — might be temporary
            }
          }
        }
        if (updated) {
          user.changed('connectedPlatforms', true);
          await user.save();
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error.message);
    }
  }

  /**
   * Connect a platform for a user
   */
  async connectPlatform(userId, platform, tokenData) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    // Remove existing connection for this platform
    user.connectedPlatforms = user.connectedPlatforms.filter(p => p.platform !== platform);

    // Add new connection
    user.connectedPlatforms.push({
      platform,
      accountId: tokenData.accountId,
      accountName: tokenData.accountName,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiry: new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000),
      pageId: tokenData.pageId,
      pageName: tokenData.pageName,
      isActive: true,
      connectedAt: new Date(),
      scopes: tokenData.scopes || [],
      metadata: tokenData.metadata || {}
    });

    user.changed('connectedPlatforms', true);
    await user.save();
    return user;
  }

  /**
   * Disconnect a platform
   */
  async disconnectPlatform(userId, platform) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const conn = user.connectedPlatforms.find(p => p.platform === platform);
    if (conn) {
      conn.isActive = false;
      user.changed('connectedPlatforms', true);
    }
    await user.save();
    return user;
  }

  /**
   * Get token status for all connected platforms
   */
  async getTokenStatus(userId) {
    const user = await User.findByPk(userId);
    if (!user) return [];

    return user.connectedPlatforms.map(conn => ({
      platform: conn.platform,
      accountName: conn.accountName,
      isActive: conn.isActive,
      tokenExpiry: conn.tokenExpiry,
      hoursUntilExpiry: conn.tokenExpiry ? Math.max(0, (new Date(conn.tokenExpiry) - new Date()) / (1000 * 60 * 60)).toFixed(1) : null,
      lastRefreshed: conn.lastRefreshed,
      status: !conn.isActive ? 'disconnected' : !conn.tokenExpiry ? 'unknown' : new Date(conn.tokenExpiry) < new Date() ? 'expired' : (new Date(conn.tokenExpiry) - new Date()) < 24 * 60 * 60 * 1000 ? 'expiring_soon' : 'active'
    }));
  }
}

export default new TokenManager();
