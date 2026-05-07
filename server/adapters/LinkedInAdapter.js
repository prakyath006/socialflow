import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class LinkedInAdapter extends BaseAdapter {
  constructor(config) {
    super('linkedin', config);
    this.apiBase = 'https://api.linkedin.com/v2';
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    const fullText = this.buildFullText(content);
    try {
      const body = {
        author: `urn:li:person:${credentials.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: fullText },
            shareMediaCategory: post.media?.length ? 'IMAGE' : content.link ? 'ARTICLE' : 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      };
      if (content.link && !post.media?.length) {
        body.specificContent['com.linkedin.ugc.ShareContent'].media = [{ status: 'READY', originalUrl: content.link }];
      }
      const { data } = await axios.post(`${this.apiBase}/ugcPosts`, body, {
        headers: { 'Authorization': `Bearer ${credentials.accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' }
      });
      return { success: true, externalId: data.id, externalUrl: `https://linkedin.com/feed/update/${data.id}`, platform: 'linkedin' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message, platform: 'linkedin' };
    }
  }

  async delete(externalId, credentials) {
    try {
      await axios.delete(`${this.apiBase}/ugcPosts/${externalId}`, { headers: { 'Authorization': `Bearer ${credentials.accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  getAuthUrl() {
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&scope=${encodeURIComponent('r_liteprofile w_member_social')}`;
  }

  async handleCallback(code) {
    const { data } = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: { grant_type: 'authorization_code', code, redirect_uri: process.env.LINKEDIN_REDIRECT_URI, client_id: process.env.LINKEDIN_CLIENT_ID, client_secret: process.env.LINKEDIN_CLIENT_SECRET }
    });
    const { data: profile } = await axios.get(`${this.apiBase}/me`, { headers: { 'Authorization': `Bearer ${data.access_token}` } });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, accountId: profile.id, accountName: `${profile.localizedFirstName} ${profile.localizedLastName}` };
  }

  async refreshToken(rt) {
    const { data } = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: { grant_type: 'refresh_token', refresh_token: rt, client_id: process.env.LINKEDIN_CLIENT_ID, client_secret: process.env.LINKEDIN_CLIENT_SECRET }
    });
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
  }
}
