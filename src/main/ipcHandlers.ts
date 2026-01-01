/**
 * IPC handlers for configuration operations.
 */

import { ipcMain } from 'electron';
import type { AppConfig, TrackedConfig, ValidationErrors } from '../config/types';
import { ConfigStore } from '../config/store';
import { mergeConfig, validateConfig, diffFromDefaults } from '../config/merge';
import { getDefaults, PRESETS, applyPreset } from '../config/defaults';
import { CONFIG_SCHEMA, CONFIG_SECTIONS, SECTION_META } from '../config/schema';
import { testTwitchConnection } from './testConnection';

let configStore: ConfigStore;
let currentTrackedConfig: TrackedConfig | null = null;
let diagnosticsEnabled = false;

/**
 * Create a serializable version of the schema (without functions).
 */
function getSerializableSchema(): Record<string, unknown> {
  const serializable: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(CONFIG_SCHEMA)) {
    // Copy all properties except 'validate' function
    const { validate, ...rest } = field;
    serializable[key] = rest;
  }

  return serializable;
}

/**
 * Initialize and register all config-related IPC handlers.
 */
export function setupConfigIPC(diagnostics = false): void {
  diagnosticsEnabled = diagnostics;
  configStore = new ConfigStore(diagnostics);

  // Get schema metadata for UI rendering (serializable, no functions)
  ipcMain.handle('config:getSchema', () => {
    return {
      schema: getSerializableSchema(),
      sections: CONFIG_SECTIONS,
      sectionMeta: SECTION_META,
      presets: PRESETS,
    };
  });

  // Load merged config with source tracking
  ipcMain.handle('config:load', () => {
    const { config: saved, error } = configStore.load();

    const tracked = mergeConfig({
      saved,
      diagnostics: diagnosticsEnabled,
    });

    currentTrackedConfig = tracked;

    return {
      config: tracked.values,
      sources: tracked.sources,
      loadError: error,
      isFirstRun: saved === null && error === null,
    };
  });

  // Validate config values
  ipcMain.handle('config:validate', (_event, config: AppConfig): ValidationErrors => {
    return validateConfig(config);
  });

  // Save config to disk
  ipcMain.handle('config:save', (_event, config: Partial<AppConfig>) => {
    // Save only the diff from defaults to minimize storage
    const toSave = diffFromDefaults(config as AppConfig);
    return configStore.save(toSave);
  });

  // Reset config to defaults
  ipcMain.handle('config:reset', () => {
    return configStore.reset();
  });

  // Test Twitch connection
  ipcMain.handle('config:testConnection', async (_event, url: string) => {
    return testTwitchConnection(url, diagnosticsEnabled);
  });

  // Apply a preset
  ipcMain.handle('config:applyPreset', (_event, presetId: string) => {
    const config = applyPreset(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);

    if (!preset) {
      return { success: false, error: 'Preset not found' };
    }

    return { success: true, config };
  });

  // Get defaults
  ipcMain.handle('config:getDefaults', () => {
    return getDefaults();
  });

  // Start the overlay (called when user clicks Start)
  ipcMain.handle('config:start', async (_event, config: AppConfig) => {
    const errors = validateConfig(config);
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    // Save only the diff from defaults
    const toSave = diffFromDefaults(config);
    const saveResult = configStore.save(toSave);
    if (!saveResult.success) {
      return { success: false, errors: { _save: saveResult.error || 'Failed to save' } };
    }

    // Update tracked config with full values
    currentTrackedConfig = {
      values: config,
      sources: currentTrackedConfig?.sources || ({} as Record<keyof AppConfig, 'saved'>),
    };

    if (diagnosticsEnabled) {
      console.info('[IPC] Config start requested, validation passed');
    }

    return { success: true };
  });
}

/**
 * Get the current merged configuration.
 */
export function getCurrentConfig(): TrackedConfig | null {
  return currentTrackedConfig;
}

/**
 * Set the current configuration (used after config window closes).
 */
export function setCurrentConfig(config: AppConfig): void {
  currentTrackedConfig = {
    values: config,
    sources: currentTrackedConfig?.sources || ({} as Record<keyof AppConfig, 'saved'>),
  };
}

/**
 * Check if we can start without showing the config UI.
 * Returns true if TWITCH_CHAT_URL is provided via env/cli.
 */
export function canStartWithoutUI(): boolean {
  const { config: saved } = configStore.load();
  const tracked = mergeConfig({ saved, diagnostics: diagnosticsEnabled });

  // Can start if twitchChatUrl is present and valid
  const url = tracked.values.twitchChatUrl;
  if (!url || !url.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('twitch.tv');
  } catch {
    return false;
  }
}

/**
 * Load and merge configuration for direct startup (no config window).
 */
export function loadConfigForStartup(): TrackedConfig {
  const { config: saved } = configStore.load();
  const tracked = mergeConfig({ saved, diagnostics: diagnosticsEnabled });
  currentTrackedConfig = tracked;
  return tracked;
}
