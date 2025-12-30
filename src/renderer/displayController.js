class DisplayController {
  constructor({
    displaySeconds,
    exitAnimationMs,
    diagnostics,
    onUpdate,
    onDisplay,
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
    const fallbackExitMs = 400;
    const parsedExitMs = Number(exitAnimationMs);
    const safeExitMs =
      Number.isFinite(parsedExitMs) && parsedExitMs >= 0
        ? parsedExitMs
        : fallbackExitMs;
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
    this.exitMs = safeExitMs;
    this.maxMessageLength = safeMaxLength;
    this.maxQueueLength = safeQueueLength;
    this.ignoreCommandPrefix = safePrefix;
    this.ignoreUsers = new Set(
      normalizedIgnoreUsers
        .map((user) => String(user).trim().toLowerCase())
        .filter(Boolean)
    );
    this.diagnostics = Boolean(diagnostics);
    this.onUpdate = onUpdate;
    this.onDisplay = onDisplay || {};
    this.queue = [];
    this.seenIds = new Set();
    this.activeMessage = null;
    this.phase = 'idle';
    this.sequenceToken = 0;
    this.totalReceived = 0;
    this.totalDisplayed = 0;
    this.droppedCount = 0;
    this.ignoredCount = 0;
    this.truncatedCount = 0;
    this.displayTimer = null;
    this.exitTimer = null;
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

  // Previous lifecycle order:
  // startNextIfIdle -> emitUpdate (AvatarUI.setActiveMessage triggers entrance + startTalking)
  // -> start displayTimer immediately -> handleDisplayEnd -> emitUpdate (hide)
  // -> exitTimer -> handleExitDone -> startNextIfIdle.
  startNextIfIdle() {
    if (this.phase !== 'idle' || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();
    if (!next) {
      return;
    }

    this.activeMessage = next;
    this.phase = 'showing';
    this.totalDisplayed += 1;
    this.emitUpdate();
    this.logDiagnostics(`DISPLAY_START id=${next.id}`);

    const token = this.nextSequenceToken();
    void this.runDisplaySequence(next, token);
  }

  nextSequenceToken() {
    this.sequenceToken += 1;
    this.clearTimers();
    if (typeof this.onDisplay.cancel === 'function') {
      this.onDisplay.cancel();
    }
    return this.sequenceToken;
  }

  isSequenceActive(token) {
    return token === this.sequenceToken;
  }

  clearTimers() {
    if (this.displayTimer) {
      clearTimeout(this.displayTimer);
      this.displayTimer = null;
    }
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = null;
    }
  }

  async runDisplaySequence(message, token) {
    const playEntranceAnimation = this.onDisplay.playEntranceAnimation;
    const playReadingAnimation = this.onDisplay.playReadingAnimation;
    const playExitAnimation = this.onDisplay.playExitAnimation;

    if (typeof playEntranceAnimation === 'function') {
      this.logDiagnostics('entrance start');
      await playEntranceAnimation(message);
      if (!this.isSequenceActive(token)) {
        return;
      }
      this.logDiagnostics('entrance complete');
    }

    let readingDuration = 0;
    if (typeof playReadingAnimation === 'function') {
      this.logDiagnostics('reading start');
      readingDuration = await playReadingAnimation(message);
      if (!this.isSequenceActive(token)) {
        return;
      }
      const safeDuration = Number.isFinite(readingDuration) ? readingDuration : 0;
      this.logDiagnostics(
        `reading complete (duration=${safeDuration.toFixed(2)}s)`
      );
    }

    this.logDiagnostics('display timer start');
    await this.waitDisplayDuration(this.displayMs);
    if (!this.isSequenceActive(token)) {
      return;
    }
    this.logDiagnostics('display timer complete');

    const endedId = this.activeMessage ? this.activeMessage.id : message.id;
    this.activeMessage = null;
    this.phase = 'exiting';
    this.emitUpdate();
    this.logDiagnostics(`DISPLAY_END id=${endedId}`);

    this.logDiagnostics('exit start');
    if (typeof playExitAnimation === 'function') {
      await playExitAnimation();
    } else {
      await this.waitExitDuration(this.exitMs);
    }
    if (!this.isSequenceActive(token)) {
      return;
    }
    this.logDiagnostics('exit complete');

    this.phase = 'idle';
    this.logDiagnostics('EXIT_DONE');
    this.startNextIfIdle();
  }

  waitDisplayDuration(durationMs) {
    return new Promise((resolve) => {
      this.displayTimer = setTimeout(() => {
        this.displayTimer = null;
        resolve();
      }, durationMs);
    });
  }

  waitExitDuration(durationMs) {
    return new Promise((resolve) => {
      this.exitTimer = setTimeout(() => {
        this.exitTimer = null;
        resolve();
      }, durationMs);
    });
  }

  handleDisplayEnd() {
    if (this.phase !== 'showing') {
      return;
    }

    const endedId = this.activeMessage ? this.activeMessage.id : 'unknown';
    this.logDiagnostics(`DISPLAY_END id=${endedId}`);
    this.activeMessage = null;
    this.displayTimer = null;
    this.phase = 'exiting';
    this.emitUpdate();

    this.exitTimer = setTimeout(() => {
      this.handleExitDone();
    }, this.exitMs);
  }

  handleExitDone() {
    if (this.phase !== 'exiting') {
      return;
    }

    this.exitTimer = null;
    this.phase = 'idle';
    this.logDiagnostics('EXIT_DONE');
    this.startNextIfIdle();
  }

  logDiagnostics(message) {
    if (!this.diagnostics) {
      return;
    }

    console.info(`[diagnostics] ${message}`);
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
