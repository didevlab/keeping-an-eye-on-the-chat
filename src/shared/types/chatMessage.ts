/**
 * Represents a normalized chat message from the Twitch chat source.
 */
export interface ChatMessage {
  /** Unique identifier for the message (either from Twitch or locally generated). */
  id: string;
  /** Display name of the message author. */
  user: string;
  /** Text content of the message. */
  text: string;
  /** Unix timestamp in milliseconds when the message was sent or captured. */
  timestamp: number;
}

/**
 * Raw message item as extracted from the Twitch chat DOM.
 */
export interface RawChatItem {
  id: string;
  user: string;
  text: string;
  timestamp: number | null;
  capturedAt: number;
}
