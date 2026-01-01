/**
 * Global type declarations for config window.
 */

interface ConfigAPI {
  getSchema: () => Promise<any>;
  load: () => Promise<any>;
  validate: (config: any) => Promise<Record<string, string>>;
  save: (config: any) => Promise<{ success: boolean; error: string | null }>;
  reset: () => Promise<{ success: boolean; error: string | null }>;
  testConnection: (url: string) => Promise<{
    success: boolean;
    error: string | null;
    latencyMs: number | null;
  }>;
  applyPreset: (presetId: string) => Promise<{
    success: boolean;
    config?: any;
    error?: string;
  }>;
  getDefaults: () => Promise<any>;
  start: (config: any) => Promise<{
    success: boolean;
    errors?: Record<string, string>;
  }>;
  notifyStarted: () => void;
}

declare global {
  interface Window {
    configAPI: ConfigAPI;
  }
}

export {};
