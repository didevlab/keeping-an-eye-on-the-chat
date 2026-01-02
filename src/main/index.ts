/**
 * Main process entry point.
 * Creates the configuration window first, then starts the overlay after user clicks Start.
 */

import * as path from 'path';
import { app, BrowserWindow, screen, Tray, Menu, nativeImage } from 'electron';
import { TwitchChatSource } from './chatSource';
import { setupConfigIPC, getCurrentConfig } from './ipcHandlers';
import { createConfigWindow, isConfigWindowOpen, focusConfigWindow } from './configWindow';
import type { ChatMessage } from '../shared/types';
import type { AppConfig } from '../config/types';

let mainWindow: BrowserWindow | null = null;
let chatSource: TwitchChatSource | null = null;
let tray: Tray | null = null;

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
const diagnosticsEnabled = process.env.DIAGNOSTICS === '1';
const devtoolsEnabled = isDev && process.env.DEVTOOLS === '1';

// Setup IPC handlers early (before any windows are created)
setupConfigIPC(diagnosticsEnabled);

/**
 * Create the system tray icon with context menu.
 */
const createTray = (): void => {
  const iconPath = path.join(__dirname, '..', 'logo.png');
  const icon = nativeImage.createFromPath(iconPath);

  // Resize for appropriate tray icon size (16x16 on Windows/Linux)
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Keeping an Eye on the Chat');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Configurações',
      click: () => showConfigWindow(),
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click opens settings
  tray.on('double-click', () => showConfigWindow());
};

/**
 * Create the overlay window with the given configuration.
 */
const createOverlayWindow = (config: AppConfig): void => {
  // Debug overlay only if explicitly enabled in config or via env var
  const debugOverlay = config.overlayDebug || process.env.OVERLAY_DEBUG === '1';

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
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.setBounds(primaryDisplay.workArea);

  // Send config to the overlay preload before loading HTML
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('set-config', {
      displaySeconds: config.displaySeconds,
      overlayAnchor: config.overlayAnchor,
      overlayMargin: config.overlayMargin,
      bubbleMaxWidth: config.bubbleMaxWidth,
      maxMessageLength: config.maxMessageLength,
      ignoreCommandPrefix: config.ignoreCommandPrefix,
      ignoreUsers: config.ignoreUsers,
      maxQueueLength: config.maxQueueLength,
      exitAnimationMs: config.exitAnimationMs,
      diagnostics: config.diagnostics,
      notificationSoundEnabled: config.notificationSoundEnabled,
      notificationSoundFile: config.notificationSoundFile,
      notificationSoundVolume: config.notificationSoundVolume,
    });
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), {
    query: { debug: debugOverlay ? '1' : '0' },
  });

  if (config.devtools || devtoolsEnabled) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  if (config.diagnostics) {
    console.info(`[diagnostics] Starting overlay with URL: ${config.twitchChatUrl}`);
  }

  // Start the chat source
  chatSource = new TwitchChatSource({
    url: config.twitchChatUrl,
    diagnostics: config.diagnostics,
    onMessage: (message: ChatMessage) => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        return;
      }

      if (config.diagnostics) {
        console.info(`[diagnostics] Sending chat-message id=${message.id}`);
      }
      mainWindow.webContents.send('chat-message', message);
    },
  });
  chatSource.start();

  // Create system tray icon for app access
  if (!tray) {
    createTray();
  }
};

/**
 * Show the configuration window.
 * If already open, focuses the existing window.
 */
const showConfigWindow = (): void => {
  // If config window is already open, just focus it
  if (isConfigWindowOpen()) {
    focusConfigWindow();
    return;
  }

  createConfigWindow({
    diagnostics: diagnosticsEnabled,
    devtools: devtoolsEnabled,
    onStart: () => {
      // Get the validated config and start the overlay
      const tracked = getCurrentConfig();
      if (tracked) {
        if (diagnosticsEnabled) {
          console.info('[startup] Config window closed, starting overlay');
        }
        createOverlayWindow(tracked.values);
      }
    },
    onCancel: () => {
      // User cancelled - quit the app if overlay isn't running
      if (!mainWindow) {
        if (diagnosticsEnabled) {
          console.info('[startup] Config cancelled, quitting');
        }
        app.quit();
      }
    },
  });
};

/**
 * Start the application.
 * Always shows config window first so user can review/modify settings.
 */
const startApp = (): void => {
  if (diagnosticsEnabled) {
    console.info('[startup] Showing config window');
  }
  showConfigWindow();
};

app.whenReady().then(startApp);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    startApp();
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
