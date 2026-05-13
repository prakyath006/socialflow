import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class PinterestAdapter extends BaseAdapter {
  constructor(config) {
    super('pinterest', config);
    this.apiBase = 'https://api.pinterest.com/v5';
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    try {
      const pinData = { 
        title: content.title || content.text?.substring(0, 100), 
        description: this.buildFullText(content), 
        board_id: content.boardId || credentials.defaultBoardId, 
        media_source: { source_type: 'image_url', url: post.media?.[0]?.processedUrl || post.media?.[0]?.originalUrl } 
      };
      if (content.link) pinData.link = content.link;
      if (content.altText) pinData.alt_text = content.altText;
      const { data } = await axios.post(`${this.apiBase}/pins`, pinData, { headers: { 'Authorization': `Bearer ${credentials.accessToken}` } });
      return { success: true, externalId: data.id, externalUrl: `https://pinterest.com/pin/${data.id}`, platform: 'pinterest' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message, platform: 'pinterest' };
    }
  }

  async delete(externalId, credentials) {
    try {
      await axios.delete(`${this.apiBase}/pins/${externalId}`, { headers: { 'Authorization': `Bearer ${credentials.accessToken}` } });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  getAuthUrl() {
    return `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_APP_ID}&redirect_uri=${encodeURIComponent(process.env.PINTEREST_REDIRECT_URI)}&response_type=code&scope=boards:read,pins:read,pins:write`;
  }

  async handleCallback(code) {
    const { data } = await axios.post('https://api.pinterest.com/v5/oauth/token', { grant_type: 'authorization_code', code, redirect_uri: process.env.PINTEREST_REDIRECT_URI }, { auth: { username: process.env.PINTEREST_APP_ID, password: process.env.PINTEREST_APP_SECRET } });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }

  async refreshToken(rt) {
    const { data } = await axios.post('https://api.pinterest.com/v5/oauth/token', { grant_type: 'refresh_token', refresh_token: rt }, { auth: { username: process.env.PINTEREST_APP_ID, password: process.env.PINTEREST_APP_SECRET } });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }
}
