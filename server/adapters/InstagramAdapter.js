import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class InstagramAdapter extends BaseAdapter {
  constructor(config) {
    super('instagram', config);
    this.apiBase = 'https://graph.facebook.com/v25.0';
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
        image_url: media.originalUrl || media.processedPath || media.originalPath,
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
        video_url: media.originalUrl || media.processedPath || media.originalPath,
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
        params.video_url = media.originalUrl || media.processedPath || media.originalPath;
        params.media_type = 'VIDEO';
      } else {
        params.image_url = media.originalUrl || media.processedPath || media.originalPath;
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
    const scopes = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_posts,business_management';
    return `https://www.facebook.com/v25.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI)}&scope=${scopes}&response_type=code&auth_type=rerequest`;
  }

  async handleCallback(code) {
    console.log('🟣 Instagram handleCallback started');
    console.log('🟣 Using redirect URI:', process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI);

    // 1. Exchange code for short-lived token
    const { data } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });
    console.log('🟣 Short-lived token obtained');

    // 2. Exchange for long-lived token
    let userAccessToken = data.access_token;
    let expiresIn = data.expires_in || 5184000;
    try {
      const { data: longLived } = await axios.get(`${this.apiBase}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: data.access_token
        }
      });
      userAccessToken = longLived.access_token || userAccessToken;
      expiresIn = longLived.expires_in || expiresIn;
      console.log('🟣 Long-lived token obtained, expires_in:', expiresIn);
    } catch (error) {
      console.warn('🟣 Long-lived token exchange failed:', error.response?.data?.error?.message || error.message);
    }

    // NEW: Extract target_ids from granular scopes
    let targetPageIds = new Set();
    try {
      const { data: debugData } = await axios.get(`${this.apiBase}/debug_token`, {
        params: { input_token: userAccessToken, access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}` }
      });
      if (debugData.data?.granular_scopes) {
        for (const scope of debugData.data.granular_scopes) {
          if (scope.target_ids) {
            scope.target_ids.forEach(id => targetPageIds.add(id));
          }
        }
      }
    } catch (e) {
      console.log('🟣 debug_token failed:', e.message);
    }

    // 3. Get user pages (with long-lived token and proper fields)
    const { data: pages } = await axios.get(`${this.apiBase}/me/accounts`, {
      params: { access_token: userAccessToken, fields: 'id,name,access_token' }
    });
    console.log('🟣 Instagram /me/accounts returned:', JSON.stringify(pages));

    if ((!pages.data || pages.data.length === 0) && targetPageIds.size > 0) {
      console.log(`🟣 /me/accounts is empty, using target_ids: ${Array.from(targetPageIds)}`);
      pages.data = Array.from(targetPageIds).map(id => ({ id }));
    }

    // 4. Find Instagram Business Account linked to a page
    let igAccount = null;
    let selectedPage = null;
    for (const page of pages.data || []) {
      const pageAccessToken = page.access_token || userAccessToken;
      try {
        const { data: igData } = await axios.get(
          `${this.apiBase}/${page.id}`, {
            params: { fields: 'instagram_business_account{id,username}', access_token: pageAccessToken }
          }
        );
        console.log(`🟣 Page ${page.id} (${page.name}) IG account:`, JSON.stringify(igData.instagram_business_account));
        if (igData.instagram_business_account) {
          selectedPage = page;
          igAccount = { ...igData.instagram_business_account, pageAccessToken };
          break;
        }
      } catch (e) {
        console.warn(`🟣 Failed to check IG account for page ${page.id}:`, e.message);
      }
    }

    console.log('🟣 Final result: igAccount=', igAccount?.id, 'selectedPage=', selectedPage?.id);

    return {
      accessToken: igAccount?.pageAccessToken || userAccessToken,
      accountId: igAccount?.id,
      accountName: igAccount?.username ? `@${igAccount.username}` : undefined,
      pageId: selectedPage?.id,
      pageName: selectedPage?.name,
      expiresIn,
      pages: pages.data || [],
      selectedPage,
      instagramBusinessAccount: igAccount ? { id: igAccount.id, username: igAccount.username } : null
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
