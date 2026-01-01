/**
 * Overlay anchor positions.
 */
export type OverlayAnchor = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/**
 * Configuration options passed from preload to renderer.
 */
export interface OverlayConfig {
  /** Duration in seconds to display each message. */
  displaySeconds: number;
  /** Overlay position anchor. */
  overlayAnchor: OverlayAnchor;
  /** Margin in pixels from screen edge. */
  overlayMargin: number;
  /** Maximum width of chat bubble in pixels. */
  bubbleMaxWidth: number;
  /** Maximum message length before truncation. */
  maxMessageLength: number;
  /** Prefix for commands to ignore (e.g., "!"). */
  ignoreCommandPrefix: string;
  /** List of usernames to ignore (lowercase). */
  ignoreUsers: string[];
  /** Maximum queue length before dropping old messages. */
  maxQueueLength: number;
  /** Exit animation duration in milliseconds. */
  exitAnimationMs: number;
  /** Whether diagnostics logging is enabled. */
  diagnostics: boolean;
}
