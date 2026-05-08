/**
 * Platform-specific configurations and constraints
 * Used by adapters and content editor for validation
 */

const platforms = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    maxTextLength: 63206,
    supportedMedia: ['image', 'video', 'gif'],
    imageSpecs: {
      maxSize: 10 * 1024 * 1024, // 10MB
      formats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'],
      recommended: { width: 1200, height: 630 },
      aspectRatios: ['1.91:1', '1:1', '4:5']
    },
    videoSpecs: {
      maxSize: 10 * 1024 * 1024 * 1024, // 10GB
      maxDuration: 240 * 60, // 240 min
      formats: ['mp4', 'mov', 'avi', 'wmv'],
      recommended: { width: 1280, height: 720 }
    },
    features: ['text', 'image', 'video', 'link', 'hashtags', 'mentions', 'scheduling'],
    linkPreview: true,
    hashtagSupport: true,
    mentionFormat: '@{username}'
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    maxTextLength: 2200,
    maxHashtags: 30,
    supportedMedia: ['image', 'video', 'carousel'],
    imageSpecs: {
      maxSize: 8 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png'],
      recommended: { width: 1080, height: 1080 },
      aspectRatios: ['1:1', '4:5', '1.91:1']
    },
    videoSpecs: {
      maxSize: 100 * 1024 * 1024,
      maxDuration: 60,
      formats: ['mp4', 'mov'],
      recommended: { width: 1080, height: 1920 }
    },
    features: ['text', 'image', 'video', 'carousel', 'hashtags', 'mentions', 'scheduling'],
    linkPreview: false, // No links in captions
    hashtagSupport: true,
    mentionFormat: '@{username}',
    notes: 'Links not supported in captions. Use link in bio.'
  },

  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'twitter',
    color: '#000000',
    maxTextLength: 280,
    supportedMedia: ['image', 'video', 'gif'],
    imageSpecs: {
      maxSize: 5 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      recommended: { width: 1200, height: 675 },
      aspectRatios: ['16:9', '1:1']
    },
    videoSpecs: {
      maxSize: 512 * 1024 * 1024,
      maxDuration: 140,
      formats: ['mp4', 'mov'],
      recommended: { width: 1920, height: 1080 }
    },
    features: ['text', 'image', 'video', 'gif', 'link', 'hashtags', 'mentions', 'poll', 'thread', 'scheduling'],
    linkPreview: true,
    hashtagSupport: true,
    mentionFormat: '@{username}',
    notes: 'Character limit of 280. Links count toward limit (~23 chars).'
  },

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    maxTextLength: 3000,
    supportedMedia: ['image', 'video', 'document'],
    imageSpecs: {
      maxSize: 10 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png', 'gif'],
      recommended: { width: 1200, height: 627 },
      aspectRatios: ['1.91:1', '1:1']
    },
    videoSpecs: {
      maxSize: 5 * 1024 * 1024 * 1024,
      maxDuration: 10 * 60,
      formats: ['mp4', 'avi', 'mov'],
      recommended: { width: 1920, height: 1080 }
    },
    features: ['text', 'image', 'video', 'document', 'link', 'hashtags', 'mentions', 'article', 'scheduling'],
    linkPreview: true,
    hashtagSupport: true,
    mentionFormat: '@{name}',
    notes: 'Supports long-form articles. Professional tone recommended.'
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    supportedMedia: ['video'],
    videoSpecs: {
      maxSize: 256 * 1024 * 1024 * 1024,
      maxDuration: 12 * 60 * 60,
      formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'],
      recommended: { width: 1920, height: 1080 }
    },
    thumbnailSpecs: {
      maxSize: 2 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png'],
      recommended: { width: 1280, height: 720 }
    },
    features: ['video', 'link', 'hashtags', 'tags', 'thumbnail', 'scheduling'],
    linkPreview: false,
    hashtagSupport: true,
    mentionFormat: '@{channel}'
  },

  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'pinterest',
    color: '#E60023',
    maxTextLength: 500,
    maxTitleLength: 100,
    supportedMedia: ['image', 'video'],
    imageSpecs: {
      maxSize: 20 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png'],
      recommended: { width: 1000, height: 1500 },
      aspectRatios: ['2:3', '1:1']
    },
    features: ['image', 'video', 'link', 'hashtags', 'scheduling'],
    linkPreview: true,
    hashtagSupport: true
  },

  telegram: {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    color: '#26A5E4',
    maxTextLength: 4096,
    supportedMedia: ['image', 'video', 'document', 'audio'],
    imageSpecs: {
      maxSize: 10 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      recommended: { width: 1280, height: 720 }
    },
    features: ['text', 'image', 'video', 'document', 'link', 'hashtags', 'scheduling'],
    linkPreview: true,
    hashtagSupport: true
  },

  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: 'whatsapp',
    color: '#25D366',
    maxTextLength: 4096,
    supportedMedia: ['image', 'video', 'document', 'audio'],
    imageSpecs: {
      maxSize: 5 * 1024 * 1024,
      formats: ['jpg', 'jpeg', 'png'],
      recommended: { width: 1024, height: 1024 }
    },
    features: ['text', 'image', 'video', 'template', 'scheduling'],
    linkPreview: true,
    hashtagSupport: false
  }
};

export default platforms;
