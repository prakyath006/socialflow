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
      { message: fullText, url: media.originalUrl || media.processedPath || media.originalPath, access_token: credentials.accessToken }
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
        file_url: media.originalUrl || media.processedPath || media.originalPath,
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
    const scopes = 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_manage_metadata,business_management';
    return `https://www.facebook.com/v25.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI)}&scope=${scopes}&response_type=code`;
  }

  async handleCallback(code) {
    console.log('🔵 Facebook handleCallback started');
    console.log('🔵 Using redirect URI:', process.env.FACEBOOK_REDIRECT_URI);

    const { data } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });
    console.log('🔵 Short-lived token obtained');

    // Get long-lived token
    const { data: longLived } = await axios.get(`${this.apiBase}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: data.access_token
      }
    });
    console.log('🔵 Long-lived token obtained, expires_in:', longLived.expires_in);

    // Debug: Check what permissions the token actually has
    let targetPageIds = new Set();
    try {
      const { data: debugData } = await axios.get(`${this.apiBase}/debug_token`, {
        params: { input_token: longLived.access_token, access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}` }
      });
      console.log('🔵 Token debug info:', JSON.stringify(debugData.data?.scopes));
      console.log('🔵 Token granular_scopes:', JSON.stringify(debugData.data?.granular_scopes));
      
      // Extract target_ids from granular scopes
      if (debugData.data?.granular_scopes) {
        for (const scope of debugData.data.granular_scopes) {
          if (scope.target_ids) {
            scope.target_ids.forEach(id => targetPageIds.add(id));
          }
        }
      }
    } catch (e) {
      console.log('🔵 debug_token failed:', e.response?.data?.error?.message || e.message);
    }

    // Debug: Check granted permissions via /me/permissions
    try {
      const { data: permsData } = await axios.get(`${this.apiBase}/me/permissions`, {
        params: { access_token: longLived.access_token }
      });
      console.log('🔵 Granted permissions:', JSON.stringify(permsData.data));
    } catch (e) {
      console.log('🔵 /me/permissions failed:', e.message);
    }

    // Get user info
    try {
      const { data: me } = await axios.get(`${this.apiBase}/me`, {
        params: { access_token: longLived.access_token, fields: 'id,name' }
      });
      console.log('🔵 Facebook user:', me.id, me.name);
    } catch (e) {
      console.log('🔵 Could not fetch /me:', e.message);
    }

    // Get user pages with explicit fields
    const { data: pages } = await axios.get(`${this.apiBase}/me/accounts`, {
      params: { access_token: longLived.access_token, fields: 'id,name,access_token,category' }
    });
    console.log('🔵 Facebook /me/accounts returned:', JSON.stringify(pages));

    // If no pages found, try with the short-lived token as well
    if (!pages.data || pages.data.length === 0) {
      console.log('🔵 No pages with long-lived token, trying short-lived...');
      try {
        const { data: pages2 } = await axios.get(`${this.apiBase}/me/accounts`, {
          params: { access_token: data.access_token, fields: 'id,name,access_token,category' }
        });
        console.log('🔵 Short-lived /me/accounts returned:', JSON.stringify(pages2));
        if (pages2.data && pages2.data.length > 0) {
          pages.data = pages2.data;
        }
      } catch (e) {
        console.log('🔵 Short-lived /me/accounts failed:', e.message);
      }
    }

    // NEW FALLBACK: Use target_ids from debug_token if /me/accounts is empty
    if ((!pages.data || pages.data.length === 0) && targetPageIds.size > 0) {
      console.log(`🔵 /me/accounts is empty, but we found target_ids in granular_scopes: ${Array.from(targetPageIds)}`);
      pages.data = [];
      for (const pageId of targetPageIds) {
        try {
          const { data: pageData } = await axios.get(`${this.apiBase}/${pageId}`, {
            params: { access_token: longLived.access_token, fields: 'id,name,access_token,category' }
          });
          console.log(`🔵 Fetched page directly: ${pageData.name} (${pageData.id})`);
          
          // If the page endpoint didn't return a page access token, we try fetching it via an admin token
          // Or we just fall back to the user token which has granular scopes anyway
          pages.data.push({
            id: pageData.id,
            name: pageData.name,
            category: pageData.category,
            access_token: pageData.access_token || longLived.access_token
          });
        } catch (e) {
          console.log(`🔵 Failed to fetch page ${pageId} directly:`, e.response?.data?.error?.message || e.message);
        }
      }
    }

    if (!pages.data || pages.data.length === 0) {
      console.error('❌ No Facebook Pages found! The user must manage at least one Facebook Page and grant pages_show_list permission.');
    }

    return {
      accessToken: longLived.access_token,
      expiresIn: longLived.expires_in || 5184000,
      pages: pages.data || []
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
