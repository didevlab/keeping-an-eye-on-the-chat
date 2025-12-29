const { contextBridge, ipcRenderer } = require('electron');

const DEFAULT_DISPLAY_SECONDS = 5;
const DEFAULT_OVERLAY_ANCHOR = 'bottom-left';
const DEFAULT_OVERLAY_MARGIN = 24;
const ALLOWED_ANCHORS = new Set([
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
const overlayAnchorRaw = process.env.OVERLAY_ANCHOR || '';
const overlayAnchor = ALLOWED_ANCHORS.has(overlayAnchorRaw)
  ? overlayAnchorRaw
  : DEFAULT_OVERLAY_ANCHOR;
const overlayMarginRaw = Number.parseInt(process.env.OVERLAY_MARGIN || '', 10);
const overlayMargin = Number.isFinite(overlayMarginRaw)
  ? Math.max(0, overlayMarginRaw)
  : DEFAULT_OVERLAY_MARGIN;

contextBridge.exposeInMainWorld('overlayChat', {
  onMessage: (handler) => {
    if (typeof handler !== 'function') {
      return;
    }

    ipcRenderer.on('chat-message', (_event, message) => {
      handler(message);
    });
  },
  getConfig: () => ({
    displaySeconds,
    overlayAnchor,
    overlayMargin
  })
});
