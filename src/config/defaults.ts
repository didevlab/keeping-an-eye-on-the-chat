/**
 * Default configuration values and presets.
 */

import type { AppConfig, ConfigPreset } from './types';
import { CONFIG_SCHEMA } from './schema';

/**
 * Build default configuration from schema.
 * Ensures defaults are always in sync with schema definitions.
 */
export function getDefaults(): AppConfig {
  const defaults: Partial<AppConfig> = {};

  for (const [key, meta] of Object.entries(CONFIG_SCHEMA)) {
    (defaults as Record<string, unknown>)[key] = meta.default;
  }

  return defaults as AppConfig;
}

/**
 * Built-in configuration presets.
 * These provide quick-start options for common use cases.
 */
export const PRESETS: readonly ConfigPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard settings for most streams',
    config: {},
  },
  {
    id: 'fast-chat',
    name: 'Fast-Paced Chat',
    description: 'Shorter display times for active chats with many messages',
    config: {
      displaySeconds: 3,
      maxQueueLength: 100,
      maxMessageLength: 100,
      exitAnimationMs: 250,
      attentionPauseMs: 500,
    },
  },
  {
    id: 'cozy',
    name: 'Cozy Stream',
    description: 'Longer display times for relaxed streams with slower chat',
    config: {
      displaySeconds: 8,
      maxQueueLength: 20,
      maxMessageLength: 200,
      exitAnimationMs: 500,
      attentionPauseMs: 1500,
    },
  },
] as const;

/**
 * Get a preset by ID.
 */
export function getPreset(id: string): ConfigPreset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}

/**
 * Apply a preset to defaults, returning a full config.
 */
export function applyPreset(presetId: string): AppConfig {
  const defaults = getDefaults();
  const preset = getPreset(presetId);

  if (!preset) {
    return defaults;
  }

  return { ...defaults, ...preset.config };
}
