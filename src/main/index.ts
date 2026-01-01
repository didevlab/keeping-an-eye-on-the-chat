import * as path from 'path';
import { app, BrowserWindow, screen } from 'electron';
import { TwitchChatSource } from './chatSource';
import type { ChatMessage } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let chatSource: TwitchChatSource | null = null;

const createWindow = (): void => {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  const debugOverlay =
    process.env.OVERLAY_DEBUG === '1' ||
    (isDev && process.env.OVERLAY_DEBUG !== '0');
  const diagnosticsEnabled = process.env.DIAGNOSTICS === '1';
  const devtoolsEnabled = isDev && process.env.DEVTOOLS === '1';

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height, x, y } = primaryDisplay.workArea;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
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
      preload: path.join(__dirname, '..', 'preload', 'index.js')
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setBounds(primaryDisplay.workArea);

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), {
    query: { debug: debugOverlay ? '1' : '0' }
  });

  if (devtoolsEnabled) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  const chatUrl = process.env.TWITCH_CHAT_URL || '';
  if (diagnosticsEnabled) {
    console.info(`[diagnostics] TWITCH_CHAT_URL=${chatUrl || '(empty)'}`);
  }

  chatSource = new TwitchChatSource({
    url: chatUrl,
    diagnostics: diagnosticsEnabled,
    onMessage: (message: ChatMessage) => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        return;
      }

      if (diagnosticsEnabled) {
        console.info(`[diagnostics] Sending chat-message id=${message.id}`);
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
