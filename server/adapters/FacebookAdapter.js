import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class FacebookAdapter extends BaseAdapter {
  constructor(config) {
    super('facebook', config);
    this.apiBase = 'https://graph.facebook.com/v25.0';
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    const fullText = this.buildFullText(content);

    try {
      let result;

      // Determine post type
      if (post.media?.length > 0 && post.media[0].type === 'video') {
        result = await this.publishVideo(post, content, credentials);
      } else if (post.media?.length > 0) {
        result = await this.publishWithImage(post, content, credentials);
      } else if (content.link) {
        result = await this.publishLink(fullText, content.link, credentials);
      } else {
        result = await this.publishText(fullText, credentials);
      }

      return {
        success: true,
        externalId: result.id,
        externalUrl: `https://facebook.com/${result.id}`,
        platform: 'facebook'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'facebook'
      };
    }
  }

  async publishText(message, credentials) {
    const { data } = await axios.post(
      `${this.apiBase}/${credentials.pageId}/feed`,
      { message, access_token: credentials.accessToken }
    );
    return data;
  }

  async publishLink(message, link, credentials) {
    const { data } = await axios.post(
      `${this.apiBase}/${credentials.pageId}/feed`,
      { message, link, access_token: credentials.accessToken }
    );
    return data;
  }

  async publishWithImage(post, content, credentials) {
    const fullText = this.buildFullText(content);
    const media = post.media[0];

    const { data } = await axios.post(
      `${this.apiBase}/${credentials.pageId}/photos`,
      { message: fullText, url: media.processedUrl || media.originalUrl, access_token: credentials.accessToken }
    );
    return data;
  }

  async publishVideo(post, content, credentials) {
    const fullText = this.buildFullText(content);
    const media = post.media[0];

    const { data } = await axios.post(
      `${this.apiBase}/${credentials.pageId}/videos`,
      {
        description: fullText,
        file_url: media.processedUrl || media.originalUrl,
        access_token: credentials.accessToken
      }
    );
    return data;
  }

  async delete(externalId, credentials) {
    try {
      await axios.delete(
        `${this.apiBase}/${externalId}`,
        { params: { access_token: credentials.accessToken } }
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  getAuthUrl() {
    const scopes = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_manage_metadata';
    return `https://www.facebook.com/v25.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}&scope=${scopes}&response_type=code`;
  }

  async handleCallback(code) {
    const { data } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    // Get long-lived token
    const { data: longLived } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: data.access_token
      }
    });

    // Get user pages
    const { data: pages } = await axios.get(`${this.apiBase}/me/accounts`, {
      params: { access_token: longLived.access_token }
    });

    return {
      accessToken: longLived.access_token,
      expiresIn: longLived.expires_in || 5184000,
      pages: pages.data
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
