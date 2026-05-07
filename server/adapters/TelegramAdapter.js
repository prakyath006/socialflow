import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class TelegramAdapter extends BaseAdapter {
  constructor(config) {
    super('telegram', config);
    this.apiBase = 'https://api.telegram.org/bot';
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    const fullText = this.buildFullText(content);
    const token = credentials.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = credentials.chatId;
    try {
      let result;
      if (post.media?.[0]?.type === 'image') {
        const { data } = await axios.post(`${this.apiBase}${token}/sendPhoto`, { chat_id: chatId, photo: post.media[0].processedUrl || post.media[0].originalUrl, caption: fullText, parse_mode: 'HTML' });
        result = data.result;
      } else if (post.media?.[0]?.type === 'video') {
        const { data } = await axios.post(`${this.apiBase}${token}/sendVideo`, { chat_id: chatId, video: post.media[0].processedUrl || post.media[0].originalUrl, caption: fullText, parse_mode: 'HTML' });
        result = data.result;
      } else {
        const { data } = await axios.post(`${this.apiBase}${token}/sendMessage`, { chat_id: chatId, text: fullText, parse_mode: 'HTML', disable_web_page_preview: !content.link });
        result = data.result;
      }
      return { success: true, externalId: String(result.message_id), platform: 'telegram' };
    } catch (error) {
      return { success: false, error: error.response?.data?.description || error.message, platform: 'telegram' };
    }
  }

  async delete(externalId, credentials) {
    const token = credentials.botToken || process.env.TELEGRAM_BOT_TOKEN;
    try {
      await axios.post(`${this.apiBase}${token}/deleteMessage`, { chat_id: credentials.chatId, message_id: externalId });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  getAuthUrl() { return null; /* Telegram uses bot tokens, not OAuth */ }
  async handleCallback() { return null; }
  async refreshToken() { return null; }
}

export class PinterestAdapter extends BaseAdapter {
  constructor(config) {
    super('pinterest', config);
    this.apiBase = 'https://api.pinterest.com/v5';
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    try {
      const pinData = { title: content.title || content.text?.substring(0, 100), description: this.buildFullText(content), board_id: content.boardId || credentials.defaultBoardId, media_source: { source_type: 'image_url', url: post.media?.[0]?.processedUrl || post.media?.[0]?.originalUrl } };
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

export class WhatsAppAdapter extends BaseAdapter {
  constructor(config) {
    super('whatsapp', config);
    this.apiBase = 'https://graph.facebook.com/v19.0';
  }

  async publish(post, credentials) {
    const content = this.getContentForPlatform(post);
    const phoneId = credentials.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = credentials.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    try {
      const body = { messaging_product: 'whatsapp', to: credentials.recipientNumber, type: 'text', text: { body: this.buildFullText(content) } };
      const { data } = await axios.post(`${this.apiBase}/${phoneId}/messages`, body, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      return { success: true, externalId: data.messages?.[0]?.id, platform: 'whatsapp' };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message, platform: 'whatsapp' };
    }
  }

  async delete() { return { success: false, error: 'WhatsApp does not support message deletion via API' }; }
  getAuthUrl() { return null; }
  async handleCallback() { return null; }
  async refreshToken() { return null; }
}
