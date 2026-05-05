/** Platform metadata for UI rendering */
export const PLATFORMS = {
  facebook: { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: '📘', maxLength: 63206 },
  instagram: { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: '📸', maxLength: 2200, noLinks: true },
  twitter: { id: 'twitter', name: 'X (Twitter)', color: '#000000', icon: '𝕏', maxLength: 280 },
  linkedin: { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: '💼', maxLength: 3000 },
  youtube: { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: '▶️', maxLength: 5000 },
  pinterest: { id: 'pinterest', name: 'Pinterest', color: '#E60023', icon: '📌', maxLength: 500 },
  telegram: { id: 'telegram', name: 'Telegram', color: '#26A5E4', icon: '✈️', maxLength: 4096 },
  whatsapp: { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: '💬', maxLength: 4096 }
};

export const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'badge-draft', icon: '📝' },
  queued: { label: 'Queued', class: 'badge-info', icon: '⏳' },
  scheduled: { label: 'Scheduled', class: 'badge-warning', icon: '📅' },
  publishing: { label: 'Publishing', class: 'badge-info', icon: '🔄' },
  published: { label: 'Published', class: 'badge-success', icon: '✅' },
  partially_published: { label: 'Partial', class: 'badge-warning', icon: '⚠️' },
  failed: { label: 'Failed', class: 'badge-error', icon: '❌' },
  cancelled: { label: 'Cancelled', class: 'badge-draft', icon: '🚫' }
};

export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};
