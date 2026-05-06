/**
 * BaseAdapter — Abstract base class for all platform adapters
 * Every platform adapter must implement these methods
 */
export default class BaseAdapter {
  constructor(platformId, config) {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }
    this.platformId = platformId;
    this.config = config;
  }

  /** Publish a post to the platform */
  async publish(post, credentials) {
    throw new Error(`publish() not implemented for ${this.platformId}`);
  }

  /** Delete a published post */
  async delete(externalId, credentials) {
    throw new Error(`delete() not implemented for ${this.platformId}`);
  }

  /** Upload media to the platform */
  async uploadMedia(media, credentials) {
    throw new Error(`uploadMedia() not implemented for ${this.platformId}`);
  }

  /** Validate content against platform constraints */
  validate(post) {
    const errors = [];
    const content = this.getContentForPlatform(post);

    if (this.config.maxTextLength && content.text?.length > this.config.maxTextLength) {
      errors.push(`Text exceeds ${this.config.maxTextLength} character limit (${content.text.length} chars)`);
    }

    if (this.config.maxHashtags && content.hashtags?.length > this.config.maxHashtags) {
      errors.push(`Too many hashtags. Max: ${this.config.maxHashtags}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /** Get platform-specific content or fall back to default */
  getContentForPlatform(post) {
    const override = post.platformContent?.find(p => p.platform === this.platformId);
    return {
      text: override?.text || post.content?.text || '',
      hashtags: override?.hashtags || post.content?.hashtags || [],
      mentions: override?.mentions || post.content?.mentions || [],
      link: override?.link || post.content?.link || '',
      title: override?.title || '',
      description: override?.description || '',
      tags: override?.tags || []
    };
  }

  /** Build the full text with hashtags and mentions */
  buildFullText(content) {
    let text = content.text;

    if (content.hashtags?.length > 0) {
      const tags = content.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      text = `${text}\n\n${tags}`;
    }

    return text;
  }

  /** Initiate OAuth flow — returns the auth URL */
  getAuthUrl() {
    throw new Error(`getAuthUrl() not implemented for ${this.platformId}`);
  }

  /** Exchange auth code for tokens */
  async handleCallback(code) {
    throw new Error(`handleCallback() not implemented for ${this.platformId}`);
  }

  /** Refresh expired tokens */
  async refreshToken(refreshToken) {
    throw new Error(`refreshToken() not implemented for ${this.platformId}`);
  }
}
