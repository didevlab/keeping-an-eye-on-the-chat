class DisplayController {
  constructor({
    displaySeconds,
    onUpdate,
    maxMessageLength,
    ignoreCommandPrefix,
    ignoreUsers,
    maxQueueLength
  }) {
    const fallbackSeconds = 5;
    const parsedSeconds = Number(displaySeconds);
    const safeSeconds =
      Number.isFinite(parsedSeconds) && parsedSeconds > 0
        ? parsedSeconds
        : fallbackSeconds;
    const fallbackMaxLength = 140;
    const parsedMaxLength = Number(maxMessageLength);
    const safeMaxLength =
      Number.isFinite(parsedMaxLength) && parsedMaxLength > 0
        ? parsedMaxLength
        : fallbackMaxLength;
    const fallbackQueueLength = 50;
    const parsedQueueLength = Number(maxQueueLength);
    const safeQueueLength =
      Number.isFinite(parsedQueueLength) && parsedQueueLength > 0
        ? parsedQueueLength
        : fallbackQueueLength;
    const safePrefix =
      typeof ignoreCommandPrefix === 'string' ? ignoreCommandPrefix : '!';
    const normalizedIgnoreUsers = Array.isArray(ignoreUsers) ? ignoreUsers : [];

    this.displayMs = safeSeconds * 1000;
    this.maxMessageLength = safeMaxLength;
    this.maxQueueLength = safeQueueLength;
    this.ignoreCommandPrefix = safePrefix;
    this.ignoreUsers = new Set(
      normalizedIgnoreUsers
        .map((user) => String(user).trim().toLowerCase())
        .filter(Boolean)
    );
    this.onUpdate = onUpdate;
    this.queue = [];
    this.seenIds = new Set();
    this.activeMessage = null;
    this.totalReceived = 0;
    this.totalDisplayed = 0;
    this.droppedCount = 0;
    this.ignoredCount = 0;
    this.truncatedCount = 0;
    this.timer = null;
  }

  enqueue(message) {
    if (!message || typeof message.id !== 'string') {
      return;
    }

    if (this.seenIds.has(message.id)) {
      return;
    }

    this.seenIds.add(message.id);
    this.totalReceived += 1;
    const user =
      typeof message.user === 'string' ? message.user.trim() : String(message.user || '').trim();
    const text =
      typeof message.text === 'string' ? message.text.trim() : String(message.text || '').trim();

    if (this.ignoreUsers.has(user.toLowerCase())) {
      this.ignoredCount += 1;
      this.emitUpdate();
      return;
    }

    if (this.ignoreCommandPrefix && text.startsWith(this.ignoreCommandPrefix)) {
      this.ignoredCount += 1;
      this.emitUpdate();
      return;
    }

    let finalText = text;
    if (finalText.length > this.maxMessageLength) {
      finalText = `${finalText.slice(0, this.maxMessageLength).trimEnd()}…`;
      this.truncatedCount += 1;
    }

    const normalizedMessage = {
      ...message,
      user,
      text: finalText
    };

    this.queue.push(normalizedMessage);
    while (this.queue.length > this.maxQueueLength) {
      this.queue.shift();
      this.droppedCount += 1;
    }

    this.emitUpdate();
    this.startNextIfIdle();
  }

  startNextIfIdle() {
    if (this.activeMessage || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    this.activeMessage = next;
    this.totalDisplayed += 1;
    this.emitUpdate();

    this.timer = setTimeout(() => {
      this.activeMessage = null;
      this.timer = null;
      this.emitUpdate();
      this.startNextIfIdle();
    }, this.displayMs);
  }

  emitUpdate() {
    if (typeof this.onUpdate !== 'function') {
      return;
    }

    this.onUpdate(this.getState());
  }

  getState() {
    return {
      activeMessage: this.activeMessage,
      queueLength: this.queue.length,
      totalReceived: this.totalReceived,
      totalDisplayed: this.totalDisplayed,
      droppedCount: this.droppedCount,
      ignoredCount: this.ignoredCount,
      truncatedCount: this.truncatedCount
    };
  }
}

window.DisplayController = DisplayController;
