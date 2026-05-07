import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class YouTubeAdapter extends BaseAdapter {
  constructor(config) {
    super('youtube', config);
    this.apiBase = 'https://www.googleapis.com/youtube/v3';
  }

  validate(post) {
    const base = super.validate(post);
    if (!post.media?.some(m => m.type === 'video')) {
      base.errors.push('YouTube requires a video file.');
    }
    base.valid = base.errors.length === 0;
    return base;
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    try {
      if (!post.media || post.media.length === 0) {
        throw new Error('YouTube requires a video file to be attached.');
      }

      const boundary = 'foo_bar_baz_socialflow';
      const metadata = JSON.stringify({
        snippet: { 
          title: content.title || content.text?.substring(0, 100) || 'Untitled', 
          description: content.description || this.buildFullText(content), 
          tags: content.tags || [], 
          categoryId: content.category || '22' 
        },
        status: { privacyStatus: content.privacy || 'public', selfDeclaredMadeForKids: false }
      });

      const videoRes = await axios.get(post.media[0].originalUrl, { responseType: 'arraybuffer' });

      const body = Buffer.concat([
        Buffer.from(`\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`),
        Buffer.from(videoRes.data),
        Buffer.from(`\r\n--${boundary}--`)
      ]);

      const { data } = await axios.post(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status`, body, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': body.length
        }
      });

      return { success: true, externalId: data.id, externalUrl: `https://youtube.com/watch?v=${data.id}`, platform: 'youtube' };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message, platform: 'youtube' };
    }
  }

  async delete(externalId, credentials) {
    try {
      await axios.delete(`${this.apiBase}/videos?id=${externalId}`, { headers: { 'Authorization': `Bearer ${credentials.accessToken}` } });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  getAuthUrl() {
    const scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
  }

  async handleCallback(code) {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', { code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: process.env.GOOGLE_REDIRECT_URI, grant_type: 'authorization_code' });
    const { data: channel } = await axios.get(`${this.apiBase}/channels?part=snippet&mine=true`, { headers: { 'Authorization': `Bearer ${data.access_token}` } });
    const ch = channel.items?.[0];
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, accountId: ch?.id, accountName: ch?.snippet?.title };
  }

  async refreshToken(rt) {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', { client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: rt, grant_type: 'refresh_token' });
    return { accessToken: data.access_token, expiresIn: data.expires_in };
  }
}
