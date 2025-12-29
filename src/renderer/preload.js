const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayChat', {
  onMessage: (handler) => {
    if (typeof handler !== 'function') {
      return;
    }

    ipcRenderer.on('chat-message', (_event, message) => {
      handler(message);
    });
  }
});
