import axios from 'axios';
import BaseAdapter from './BaseAdapter.js';

export default class WhatsAppAdapter extends BaseAdapter {
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
