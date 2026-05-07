import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class InstagramAdapter extends BaseAdapter {
  constructor(config) {
    super('instagram', config);
    this.apiBase = 'https://graph.facebook.com/v19.0';
  }

  validate(post) {
    const baseValidation = super.validate(post);
    const content = this.getContentForPlatform(post);

    // Instagram: no links in captions
    if (content.link) {
      baseValidation.errors.push('Instagram does not support links in captions. Use Link in Bio instead.');
    }

    // Must have media
    if (!post.media || post.media.length === 0) {
      baseValidation.errors.push('Instagram requires at least one image or video.');
    }

    baseValidation.valid = baseValidation.errors.length === 0;
    return baseValidation;
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    const fullText = this.buildFullText(content);

    try {
      let containerId;

      if (post.media?.length > 1) {
        containerId = await this.createCarousel(post, fullText, credentials);
      } else if (post.media?.[0]?.type === 'video') {
        containerId = await this.createVideoContainer(post.media[0], fullText, credentials);
      } else {
        containerId = await this.createImageContainer(post.media[0], fullText, credentials);
      }

      // Poll container status until it finishes processing
      let isReady = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          const { data: statusData } = await axios.get(
            `${this.apiBase}/${containerId}?fields=status_code&access_token=${credentials.accessToken}`
          );
          if (statusData.status_code === 'FINISHED') {
            isReady = true;
            break;
          } else if (statusData.status_code === 'ERROR') {
            throw new Error('Instagram failed to process the media file');
          }
        } catch (e) {
          // Ignore network errors during polling
        }
      }

      if (!isReady) {
        throw new Error('Instagram media processing timed out');
      }

      // Publish the container
      const { data } = await axios.post(
        `${this.apiBase}/${credentials.accountId}/media_publish`,
        { creation_id: containerId, access_token: credentials.accessToken }
      );

      return {
        success: true,
        externalId: data.id,
        externalUrl: `https://instagram.com/p/${data.id}`,
        platform: 'instagram'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'instagram'
      };
    }
  }

  async createImageContainer(media, caption, credentials) {
    const { data } = await axios.post(
      `${this.apiBase}/${credentials.accountId}/media`,
      {
        image_url: media.processedUrl || media.originalUrl,
        caption,
        access_token: credentials.accessToken
      }
    );
    return data.id;
  }

  async createVideoContainer(media, caption, credentials) {
    const { data } = await axios.post(
      `${this.apiBase}/${credentials.accountId}/media`,
      {
        video_url: media.processedUrl || media.originalUrl,
        caption,
        media_type: 'REELS',
        access_token: credentials.accessToken
      }
    );
    return data.id;
  }

  async createCarousel(post, caption, credentials) {
    // Create individual media containers
    const childIds = [];
    for (const media of post.media) {
      const params = {
        is_carousel_item: true,
        access_token: credentials.accessToken
      };

      if (media.type === 'video') {
        params.video_url = media.processedUrl || media.originalUrl;
        params.media_type = 'VIDEO';
      } else {
        params.image_url = media.processedUrl || media.originalUrl;
      }

      const { data } = await axios.post(
        `${this.apiBase}/${credentials.accountId}/media`, params
      );
      childIds.push(data.id);
    }

    // Create carousel container
    const { data } = await axios.post(
      `${this.apiBase}/${credentials.accountId}/media`,
      {
        media_type: 'CAROUSEL',
        caption,
        children: childIds.join(','),
        access_token: credentials.accessToken
      }
    );
    return data.id;
  }

  async delete(externalId, credentials) {
    // Instagram doesn't support deletion via API for most content types
    return { success: false, error: 'Instagram API does not support post deletion' };
  }

  getAuthUrl() {
    const scopes = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI)}&scope=${scopes}&response_type=code`;
  }

  async handleCallback(code) {
    // Uses Facebook OAuth (Instagram Graph API is part of Facebook)
    const { data } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    // Get Instagram business account
    const { data: pages } = await axios.get(`${this.apiBase}/me/accounts`, {
      params: { access_token: data.access_token }
    });

    let igAccount = null;
    for (const page of pages.data) {
      const { data: igData } = await axios.get(
        `${this.apiBase}/${page.id}?fields=instagram_business_account&access_token=${data.access_token}`
      );
      if (igData.instagram_business_account) {
        igAccount = { ...igData.instagram_business_account, pageAccessToken: page.access_token };
        break;
      }
    }

    return {
      accessToken: igAccount?.pageAccessToken || data.access_token,
      accountId: igAccount?.id,
      expiresIn: data.expires_in || 5184000
    };
  }

  async refreshToken(token) {
    const { data } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: token
      }
    });
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }
}
