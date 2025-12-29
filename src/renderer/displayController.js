class DisplayController {
  constructor({ displaySeconds, onUpdate }) {
    const fallbackSeconds = 5;
    const parsedSeconds = Number(displaySeconds);
    const safeSeconds =
      Number.isFinite(parsedSeconds) && parsedSeconds > 0
        ? parsedSeconds
        : fallbackSeconds;

    this.displayMs = safeSeconds * 1000;
    this.onUpdate = onUpdate;
    this.queue = [];
    this.seenIds = new Set();
    this.activeMessage = null;
    this.totalReceived = 0;
    this.totalDisplayed = 0;
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
    this.queue.push(message);
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
      totalDisplayed: this.totalDisplayed
    };
  }
}

window.DisplayController = DisplayController;
