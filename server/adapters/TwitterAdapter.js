import axios from 'axios';
import crypto from 'crypto';
import BaseAdapter from './BaseAdapter.js';

export default class TwitterAdapter extends BaseAdapter {
  constructor(config) {
    super('twitter', config);
    this.apiBase = 'https://api.twitter.com/2';
    this.uploadBase = 'https://upload.twitter.com/1.1';
  }

  validate(post) {
    const baseValidation = super.validate(post);
    const content = this.getContentForPlatform(post);
    const fullText = this.buildFullText(content);

    // Links count as ~23 characters on Twitter
    let effectiveLength = fullText.length;
    if (content.link) {
      effectiveLength += 24; // t.co URL length
    }

    if (effectiveLength > 280) {
      baseValidation.errors.push(`Tweet exceeds 280 character limit (effective: ${effectiveLength} chars). Links count as ~23 chars.`);
    }

    baseValidation.valid = baseValidation.errors.length === 0;
    return baseValidation;
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    let fullText = this.buildFullText(content);

    if (content.link) {
      fullText = `${fullText}\n${content.link}`;
    }

    try {
      const body = { text: fullText };

      // Upload media first if present
      if (post.media?.length > 0) {
        const mediaIds = [];
        for (const media of post.media.slice(0, 4)) { // Max 4 media per tweet
          const mediaId = await this.uploadMedia(media, credentials);
          if (mediaId) mediaIds.push(mediaId);
        }
        if (mediaIds.length > 0) {
          body.media = { media_ids: mediaIds };
        }
      }

      const { data } = await axios.post(`${this.apiBase}/tweets`, body, {
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        externalId: data.data.id,
        externalUrl: `https://twitter.com/i/status/${data.data.id}`,
        platform: 'twitter'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.title || error.message,
        platform: 'twitter'
      };
    }
  }

  async uploadMedia(media, credentials) {
    try {
      // Using v1.1 media upload endpoint
      const formData = new FormData();
      formData.append('media_data', media.processedUrl || media.originalUrl);

      const { data } = await axios.post(
        `${this.uploadBase}/media/upload.json`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`
          }
        }
      );
      return data.media_id_string;
    } catch (error) {
      console.error('Twitter media upload failed:', error.message);
      return null;
    }
  }

  async delete(externalId, credentials) {
    try {
      await axios.delete(`${this.apiBase}/tweets/${externalId}`, {
        headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  }

  getAuthUrl() {
    const state = crypto.randomBytes(16).toString('hex');
    const scopes = 'tweet.read tweet.write users.read offline.access';
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_API_KEY}&redirect_uri=${encodeURIComponent(process.env.TWITTER_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
  }

  async handleCallback(code) {
    const { data } = await axios.post('https://api.twitter.com/2/oauth2/token', {
      code,
      grant_type: 'authorization_code',
      client_id: process.env.TWITTER_API_KEY,
      redirect_uri: process.env.TWITTER_REDIRECT_URI,
      code_verifier: 'challenge'
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: process.env.TWITTER_API_KEY, password: process.env.TWITTER_API_SECRET }
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  async refreshToken(refreshToken) {
    const { data } = await axios.post('https://api.twitter.com/2/oauth2/token', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.TWITTER_API_KEY
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: process.env.TWITTER_API_KEY, password: process.env.TWITTER_API_SECRET }
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }
}
