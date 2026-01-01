/**
 * Test connection to a Twitch chat URL.
 * Uses a hidden webview to verify the URL is accessible.
 */

import { BrowserWindow } from 'electron';
import type { ConnectionTestResult } from '../config/types';

const TEST_TIMEOUT_MS = 10000;

/**
 * Test if a Twitch chat URL is accessible.
 * Creates a hidden window, loads the URL, and checks for success or failure.
 */
export async function testTwitchConnection(
  url: string,
  diagnostics = false
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  // Validate URL format first
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('twitch.tv')) {
      return { success: false, error: 'URL must be from twitch.tv', latencyMs: null };
    }
  } catch {
    return { success: false, error: 'Invalid URL format', latencyMs: null };
  }

  return new Promise((resolve) => {
    let testWindow: BrowserWindow | null = null;
    let resolved = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (testWindow && !testWindow.isDestroyed()) {
        testWindow.close();
      }
      testWindow = null;
    };

    const finish = (result: ConnectionTestResult): void => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    try {
      testWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });

      timeoutId = setTimeout(() => {
        if (diagnostics) {
          console.info('[TestConnection] Timeout after', TEST_TIMEOUT_MS, 'ms');
        }
        finish({ success: false, error: 'Connection timed out', latencyMs: null });
      }, TEST_TIMEOUT_MS);

      testWindow.webContents.on('did-finish-load', () => {
        const latencyMs = Date.now() - startTime;
        if (diagnostics) {
          console.info(`[TestConnection] Success in ${latencyMs}ms`);
        }
        finish({ success: true, error: null, latencyMs });
      });

      testWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        if (diagnostics) {
          console.info(`[TestConnection] Failed: ${errorDescription} (code: ${errorCode})`);
        }
        finish({ success: false, error: errorDescription || 'Failed to load', latencyMs: null });
      });

      testWindow.loadURL(url).catch((err: Error) => {
        if (diagnostics) {
          console.info('[TestConnection] Load error:', err.message);
        }
        finish({ success: false, error: err.message, latencyMs: null });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (diagnostics) {
        console.info('[TestConnection] Exception:', message);
      }
      finish({ success: false, error: message, latencyMs: null });
    }
  });
}
