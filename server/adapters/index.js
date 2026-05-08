import platforms from '../config/platforms.js';
import FacebookAdapter from './FacebookAdapter.js';
import InstagramAdapter from './InstagramAdapter.js';
import TwitterAdapter from './TwitterAdapter.js';
import LinkedInAdapter from './LinkedInAdapter.js';
import YouTubeAdapter from './YouTubeAdapter.js';
import TelegramAdapter, { PinterestAdapter, WhatsAppAdapter } from './TelegramAdapter.js';

/** Registry of all platform adapters — single access point */
const adapters = {
  facebook: new FacebookAdapter(platforms.facebook),
  instagram: new InstagramAdapter(platforms.instagram),
  twitter: new TwitterAdapter(platforms.twitter),
  linkedin: new LinkedInAdapter(platforms.linkedin),
  youtube: new YouTubeAdapter(platforms.youtube),
  pinterest: new PinterestAdapter(platforms.pinterest),
  telegram: new TelegramAdapter(platforms.telegram),
  whatsapp: new WhatsAppAdapter(platforms.whatsapp)
};

export const getAdapter = (platformId) => {
  const adapter = adapters[platformId];
  if (!adapter) throw new Error(`No adapter found for platform: ${platformId}`);
  return adapter;
};

export const getAllAdapters = () => adapters;
export const getSupportedPlatforms = () => Object.keys(adapters);

export default adapters;
