const path = require('path');
const { app, BrowserWindow } = require('electron');
const { TwitchChatSource } = require('./chatSource');

let mainWindow = null;
let chatSource = null;

const createWindow = () => {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  const debugOverlay =
    process.env.OVERLAY_DEBUG === '1' ||
    (isDev && process.env.OVERLAY_DEBUG !== '0');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'renderer/preload.js')
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'), {
    query: { debug: debugOverlay ? '1' : '0' }
  });

  const chatUrl = process.env.TWITCH_CHAT_URL || '';
  chatSource = new TwitchChatSource({
    url: chatUrl,
    onMessage: (message) => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        return;
      }

      mainWindow.webContents.send('chat-message', message);
    }
  });
  chatSource.start();
};

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (chatSource) {
    chatSource.stop();
  }
});
