const { contextBridge, ipcRenderer } = require('electron');

const DEFAULT_DISPLAY_SECONDS = 5;
const displaySecondsRaw = process.env.DISPLAY_SECONDS;
const parsedSeconds = Number(displaySecondsRaw);
const displaySeconds =
  Number.isFinite(parsedSeconds) && parsedSeconds > 0
    ? parsedSeconds
    : DEFAULT_DISPLAY_SECONDS;

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
    displaySeconds
  })
});
