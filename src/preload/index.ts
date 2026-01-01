import { contextBridge, ipcRenderer } from 'electron';
import type { ChatMessage, OverlayAnchor, OverlayConfig } from '../shared/types';

const DEFAULT_DISPLAY_SECONDS = 5;
const DEFAULT_BUBBLE_MAX_WIDTH = 420;
const DEFAULT_MAX_MESSAGE_LENGTH = 140;
const DEFAULT_IGNORE_COMMAND_PREFIX = '!';
const DEFAULT_MAX_QUEUE_LENGTH = 50;
const DEFAULT_OVERLAY_ANCHOR: OverlayAnchor = 'bottom-left';
const DEFAULT_OVERLAY_MARGIN = 24;
const DEFAULT_EXIT_ANIMATION_MS = 400;

const ALLOWED_ANCHORS = new Set<OverlayAnchor>([
  'bottom-left',
  'bottom-right',
  'top-left',
  'top-right'
]);

const displaySecondsRaw = process.env.DISPLAY_SECONDS;
const parsedSeconds = Number(displaySecondsRaw);
const displaySeconds =
  Number.isFinite(parsedSeconds) && parsedSeconds > 0
    ? parsedSeconds
    : DEFAULT_DISPLAY_SECONDS;

const overlayAnchorRaw = (process.env.OVERLAY_ANCHOR || '') as OverlayAnchor;
const overlayAnchor: OverlayAnchor = ALLOWED_ANCHORS.has(overlayAnchorRaw)
  ? overlayAnchorRaw
  : DEFAULT_OVERLAY_ANCHOR;

const overlayMarginRaw = Number.parseInt(process.env.OVERLAY_MARGIN || '', 10);
const overlayMargin = Number.isFinite(overlayMarginRaw)
  ? Math.max(0, overlayMarginRaw)
  : DEFAULT_OVERLAY_MARGIN;

const bubbleMaxWidthRaw = Number.parseInt(process.env.BUBBLE_MAX_WIDTH || '', 10);
const bubbleMaxWidth = Number.isFinite(bubbleMaxWidthRaw)
  ? Math.max(120, bubbleMaxWidthRaw)
  : DEFAULT_BUBBLE_MAX_WIDTH;

const maxMessageLengthRaw = Number.parseInt(process.env.MAX_MESSAGE_LENGTH || '', 10);
const maxMessageLength = Number.isFinite(maxMessageLengthRaw)
  ? Math.max(1, maxMessageLengthRaw)
  : DEFAULT_MAX_MESSAGE_LENGTH;

const ignoreCommandPrefixRaw = process.env.IGNORE_COMMAND_PREFIX;
const ignoreCommandPrefix =
  ignoreCommandPrefixRaw === undefined
    ? DEFAULT_IGNORE_COMMAND_PREFIX
    : ignoreCommandPrefixRaw;

const ignoreUsersRaw = process.env.IGNORE_USERS || '';
const ignoreUsers = ignoreUsersRaw
  .split(',')
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);

const maxQueueLengthRaw = Number.parseInt(process.env.MAX_QUEUE_LENGTH || '', 10);
const maxQueueLength = Number.isFinite(maxQueueLengthRaw)
  ? Math.max(1, maxQueueLengthRaw)
  : DEFAULT_MAX_QUEUE_LENGTH;

const exitAnimationMsRaw = Number.parseInt(process.env.EXIT_ANIMATION_MS || '', 10);
const exitAnimationMs = Number.isFinite(exitAnimationMsRaw)
  ? Math.max(0, exitAnimationMsRaw)
  : DEFAULT_EXIT_ANIMATION_MS;

const diagnostics = process.env.DIAGNOSTICS === '1';

type MessageHandler = (message: ChatMessage) => void;

contextBridge.exposeInMainWorld('overlayChat', {
  onMessage: (handler: MessageHandler): void => {
    if (typeof handler !== 'function') {
      return;
    }

    ipcRenderer.on('chat-message', (_event, message: ChatMessage) => {
      handler(message);
    });
  },
  getConfig: (): OverlayConfig => ({
    displaySeconds,
    overlayAnchor,
    overlayMargin,
    bubbleMaxWidth,
    maxMessageLength,
    ignoreCommandPrefix,
    ignoreUsers,
    maxQueueLength,
    exitAnimationMs,
    diagnostics
  })
});
