/**
 * Unified configuration schema.
 * Single source of truth for validation, defaults, and UI metadata.
 */

import type { AppConfig, ConfigFieldMeta, ConfigSection } from './types';

/**
 * Current schema version. Increment when making breaking changes.
 */
export const CONFIG_VERSION = 1;

/**
 * Ordered list of configuration sections for UI rendering.
 */
export const CONFIG_SECTIONS: readonly ConfigSection[] = [
  'basic',
  'overlay',
  'performance',
  'advanced',
] as const;

/**
 * Section display names and descriptions.
 */
export const SECTION_META: Record<ConfigSection, { title: string; description: string }> = {
  basic: {
    title: 'Basic Settings',
    description: 'Essential configuration to get started',
  },
  overlay: {
    title: 'Overlay Settings',
    description: 'Customize the appearance and position of the chat bubble',
  },
  performance: {
    title: 'Performance',
    description: 'Message filtering and queue settings',
  },
  advanced: {
    title: 'Advanced Settings',
    description: 'Developer and debugging options',
  },
};

/**
 * Complete configuration schema with validation and UI metadata.
 */
export const CONFIG_SCHEMA: Record<keyof AppConfig, ConfigFieldMeta<AppConfig[keyof AppConfig]>> = {
  twitchChatUrl: {
    key: 'twitchChatUrl',
    label: 'Twitch Chat URL',
    description:
      'The popout chat URL from your Twitch channel (e.g., https://www.twitch.tv/popout/yourname/chat?popout=)',
    type: 'string',
    default: '',
    envVar: 'TWITCH_CHAT_URL',
    section: 'basic',
    required: true,
    placeholder: 'https://www.twitch.tv/popout/yourname/chat?popout=',
    validate: (value: unknown): string | null => {
      const str = value as string;
      if (!str || !str.trim()) {
        return 'Twitch Chat URL is required';
      }
      try {
        const url = new URL(str);
        if (!url.hostname.includes('twitch.tv')) {
          return 'URL must be from twitch.tv';
        }
        if (!url.pathname.includes('/popout/') && !url.pathname.includes('/chat')) {
          return 'URL should be a Twitch chat popout URL';
        }
        return null;
      } catch {
        return 'Invalid URL format';
      }
    },
  },

  displaySeconds: {
    key: 'displaySeconds',
    label: 'Display Duration',
    description: 'How long each message is shown on screen (in seconds)',
    type: 'number',
    default: 5,
    envVar: 'DISPLAY_SECONDS',
    section: 'overlay',
    min: 1,
    max: 60,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 1 || num > 60) {
        return 'Must be between 1 and 60 seconds';
      }
      return null;
    },
  },

  overlayAnchor: {
    key: 'overlayAnchor',
    label: 'Overlay Position',
    description: 'Where the chat bubble appears on screen',
    type: 'select',
    default: 'bottom-left',
    envVar: 'OVERLAY_ANCHOR',
    section: 'overlay',
    options: [
      { value: 'bottom-left', label: 'Bottom Left' },
      { value: 'bottom-right', label: 'Bottom Right' },
      { value: 'top-left', label: 'Top Left' },
      { value: 'top-right', label: 'Top Right' },
    ],
    validate: (value: unknown): string | null => {
      const allowed = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
      if (!allowed.includes(value as string)) {
        return 'Invalid overlay position';
      }
      return null;
    },
  },

  overlayMargin: {
    key: 'overlayMargin',
    label: 'Screen Margin',
    description: 'Distance from screen edge (in pixels)',
    type: 'number',
    default: 24,
    envVar: 'OVERLAY_MARGIN',
    section: 'overlay',
    min: 0,
    max: 200,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 0 || num > 200) {
        return 'Must be between 0 and 200 pixels';
      }
      return null;
    },
  },

  bubbleMaxWidth: {
    key: 'bubbleMaxWidth',
    label: 'Bubble Max Width',
    description: 'Maximum width of the chat bubble (in pixels)',
    type: 'number',
    default: 420,
    envVar: 'BUBBLE_MAX_WIDTH',
    section: 'overlay',
    min: 120,
    max: 800,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 120 || num > 800) {
        return 'Must be between 120 and 800 pixels';
      }
      return null;
    },
  },

  maxMessageLength: {
    key: 'maxMessageLength',
    label: 'Max Message Length',
    description: 'Messages longer than this will be truncated with an ellipsis',
    type: 'number',
    default: 140,
    envVar: 'MAX_MESSAGE_LENGTH',
    section: 'performance',
    min: 10,
    max: 500,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 10 || num > 500) {
        return 'Must be between 10 and 500 characters';
      }
      return null;
    },
  },

  ignoreCommandPrefix: {
    key: 'ignoreCommandPrefix',
    label: 'Ignore Command Prefix',
    description: 'Messages starting with this prefix are ignored (leave empty to disable)',
    type: 'string',
    default: '!',
    envVar: 'IGNORE_COMMAND_PREFIX',
    section: 'performance',
    placeholder: '!',
  },

  ignoreUsers: {
    key: 'ignoreUsers',
    label: 'Ignored Users',
    description: 'Comma-separated list of usernames to ignore (e.g., "nightbot, streamelements")',
    type: 'string[]',
    default: [],
    envVar: 'IGNORE_USERS',
    section: 'performance',
    placeholder: 'nightbot, streamelements',
  },

  maxQueueLength: {
    key: 'maxQueueLength',
    label: 'Max Queue Length',
    description: 'Maximum number of messages waiting to be displayed. Oldest are dropped when full.',
    type: 'number',
    default: 50,
    envVar: 'MAX_QUEUE_LENGTH',
    section: 'advanced',
    min: 1,
    max: 500,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 1 || num > 500) {
        return 'Must be between 1 and 500';
      }
      return null;
    },
  },

  exitAnimationMs: {
    key: 'exitAnimationMs',
    label: 'Exit Animation Duration',
    description: 'Duration of the exit animation (in milliseconds). Set to 0 to disable.',
    type: 'number',
    default: 400,
    envVar: 'EXIT_ANIMATION_MS',
    section: 'advanced',
    min: 0,
    max: 2000,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 0 || num > 2000) {
        return 'Must be between 0 and 2000 milliseconds';
      }
      return null;
    },
  },

  diagnostics: {
    key: 'diagnostics',
    label: 'Enable Diagnostics',
    description: 'Log detailed diagnostic information to the console',
    type: 'boolean',
    default: false,
    envVar: 'DIAGNOSTICS',
    section: 'advanced',
  },

  overlayDebug: {
    key: 'overlayDebug',
    label: 'Overlay Debug Mode',
    description: 'Show a visible frame around the overlay for positioning',
    type: 'boolean',
    default: false,
    envVar: 'OVERLAY_DEBUG',
    section: 'advanced',
  },

  devtools: {
    key: 'devtools',
    label: 'Open DevTools',
    description: 'Open developer tools on startup (for debugging)',
    type: 'boolean',
    default: false,
    envVar: 'DEVTOOLS',
    section: 'advanced',
  },

  notificationSoundEnabled: {
    key: 'notificationSoundEnabled',
    label: 'Enable Notification Sound',
    description: 'Play a sound when a new message appears',
    type: 'boolean',
    default: true,
    envVar: 'NOTIFICATION_SOUND_ENABLED',
    section: 'overlay',
  },

  notificationSoundDevice: {
    key: 'notificationSoundDevice',
    label: 'Audio Output Device',
    description: 'Select which audio device to play the notification sound',
    type: 'string',
    default: '',
    envVar: 'NOTIFICATION_SOUND_DEVICE',
    section: 'overlay',
    placeholder: 'System Default',
  },

  notificationSoundFile: {
    key: 'notificationSoundFile',
    label: 'Notification Sound',
    description: 'Audio file to play when a message appears',
    type: 'string',
    default: 'notification.wav',
    envVar: 'NOTIFICATION_SOUND_FILE',
    section: 'overlay',
    placeholder: 'notification.wav',
  },

  notificationSoundVolume: {
    key: 'notificationSoundVolume',
    label: 'Sound Volume',
    description: 'Volume level for the notification sound (0-100%)',
    type: 'number',
    default: 50,
    envVar: 'NOTIFICATION_SOUND_VOLUME',
    section: 'overlay',
    min: 0,
    max: 100,
    validate: (value: unknown): string | null => {
      const num = value as number;
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        return 'Must be between 0 and 100';
      }
      return null;
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfigFieldMeta = ConfigFieldMeta<any>;

/**
 * Get all fields for a specific section.
 */
export function getFieldsBySection(section: ConfigSection): AnyConfigFieldMeta[] {
  return Object.values(CONFIG_SCHEMA).filter((field) => field.section === section);
}

/**
 * Get a field by its key.
 */
export function getField<K extends keyof AppConfig>(key: K): AnyConfigFieldMeta {
  return CONFIG_SCHEMA[key];
}
