const { BrowserWindow } = require('electron');

const CHAT_OBSERVER_SCRIPT = `(() => {
  if (window.__twitchChatObserverInstalled) {
    return;
  }

  window.__twitchChatObserverInstalled = true;
  window.__twitchChatQueue = [];

  const seen = new WeakSet();
  const messageSelectors = [
    '[data-a-target="chat-line-message"]',
    '[data-a-target="chat-message"]',
    '.chat-line__message'
  ];
  const selectorList = messageSelectors.join(',');

  const isElement = (node) => node && node.nodeType === Node.ELEMENT_NODE;

  const isSystemNotice = (node) => {
    if (!isElement(node)) {
      return true;
    }

    return (
      node.matches('[data-a-target="user-notice-line"]') ||
      node.querySelector('[data-a-target="user-notice-line"]') ||
      node.querySelector('.chat-line__status') ||
      node.querySelector('[data-a-target="chat-deleted-message"]')
    );
  };

  const getUser = (node) => {
    const userEl =
      node.querySelector('[data-a-target="chat-message-username"]') ||
      node.querySelector('.chat-author__display-name');
    return userEl ? userEl.textContent.trim() : '';
  };

  const getText = (node) => {
    const textContainer =
      node.querySelector('[data-a-target="chat-message-text"]') ||
      node.querySelector('.chat-line__message-body');

    if (textContainer) {
      return textContainer.textContent.trim();
    }

    const fragments = node.querySelectorAll('.text-fragment');
    if (fragments.length === 0) {
      return '';
    }

    return Array.from(fragments)
      .map((fragment) => fragment.textContent)
      .join('')
      .trim();
  };

  const getId = (node) => {
    return (
      node.getAttribute('data-id') ||
      node.getAttribute('data-message-id') ||
      node.getAttribute('id') ||
      ''
    );
  };

  const getTimestamp = (node) => {
    const timeEl =
      node.querySelector('time') ||
      node.querySelector('[data-a-target="chat-timestamp"]');
    if (!timeEl) {
      return null;
    }

    const datetime = timeEl.getAttribute('datetime');
    if (!datetime) {
      return null;
    }

    const parsed = Date.parse(datetime);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const enqueueMessage = (node) => {
    if (isSystemNotice(node)) {
      return;
    }

    const user = getUser(node);
    const text = getText(node);

    if (!user || !text) {
      return;
    }

    window.__twitchChatQueue.push({
      id: getId(node),
      user,
      text,
      timestamp: getTimestamp(node),
      capturedAt: Date.now()
    });
  };

  const collectMessageNodes = (node) => {
    if (!isElement(node)) {
      return [];
    }

    const nodes = [];
    if (node.matches(selectorList)) {
      nodes.push(node);
    }

    node.querySelectorAll(selectorList).forEach((match) => nodes.push(match));
    return nodes;
  };

  const handleNode = (node) => {
    const nodes = collectMessageNodes(node);
    for (const messageNode of nodes) {
      if (seen.has(messageNode)) {
        continue;
      }

      seen.add(messageNode);
      enqueueMessage(messageNode);
    }
  };

  const markExisting = () => {
    document.querySelectorAll(selectorList).forEach((node) => {
      seen.add(node);
    });
  };

  const startObserving = () => {
    if (!document.body) {
      return;
    }

    markExisting();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          try {
            handleNode(added);
          } catch (_) {
            // Best-effort extraction; ignore malformed nodes.
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  startObserving();
})();`;

class TwitchChatSource {
  constructor({ url, onMessage, logger }) {
    this.url = url;
    this.onMessage = onMessage;
    this.logger = logger || console;
    this.window = null;
    this.poller = null;
    this.localCounter = 0;
    this.seenIds = new Set();
  }

  start() {
    if (!this.url) {
      this.logger.info('Chat source disabled: no URL provided.');
      return;
    }

    try {
      new URL(this.url);
    } catch (error) {
      this.logger.warn('Chat source disabled: invalid URL.');
      return;
    }

    this.window = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    this.window.webContents.on('did-fail-load', () => {
      this.logger.warn('Chat source unavailable: failed to load URL.');
    });

    this.window.webContents.on('dom-ready', () => {
      this.installObserver();
    });

    this.window.webContents.on('did-finish-load', () => {
      this.installObserver();
    });

    this.window.loadURL(this.url).catch(() => {
      this.logger.warn('Chat source unavailable: failed to load URL.');
    });

    this.startPolling();
  }

  stop() {
    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
    }

    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }

    this.window = null;
    this.seenIds.clear();
  }

  installObserver() {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    this.window.webContents.executeJavaScript(CHAT_OBSERVER_SCRIPT).catch(() => {
      // Ignore injection failures to keep best-effort behavior.
    });
  }

  startPolling() {
    if (this.poller) {
      return;
    }

    this.poller = setInterval(() => {
      this.flushQueue();
    }, 250);
  }

  async flushQueue() {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }

    if (this.window.webContents.isLoading()) {
      return;
    }

    try {
      const items = await this.window.webContents.executeJavaScript(
        'window.__twitchChatQueue ? window.__twitchChatQueue.splice(0) : []'
      );

      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      for (const item of items) {
        const message = this.normalizeMessage(item);
        if (!message) {
          continue;
        }

        if (this.seenIds.has(message.id)) {
          continue;
        }

        this.seenIds.add(message.id);
        this.onMessage?.(message);
      }
    } catch (_) {
      // Best-effort polling; ignore failures.
    }
  }

  normalizeMessage(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const user = typeof item.user === 'string' ? item.user.trim() : '';
    const text = typeof item.text === 'string' ? item.text.trim() : '';

    if (!user || !text) {
      return null;
    }

    const rawId = typeof item.id === 'string' ? item.id.trim() : '';
    const timestamp =
      Number.isFinite(item.timestamp) && item.timestamp > 0
        ? item.timestamp
        : Number.isFinite(item.capturedAt)
          ? item.capturedAt
          : Date.now();

    const id = rawId || this.buildLocalId(user, text, timestamp);

    return {
      id,
      user,
      text,
      timestamp
    };
  }

  buildLocalId(user, text, timestamp) {
    this.localCounter += 1;
    const hash = this.hashString(`${user}|${text}`);
    return `local-${this.localCounter}-${timestamp}-${hash}`;
  }

  hashString(value) {
    let hash = 5381;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) + hash + value.charCodeAt(i);
      hash &= 0xffffffff;
    }
    return Math.abs(hash).toString(16);
  }
}

module.exports = { TwitchChatSource };
