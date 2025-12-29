class AvatarUI {
  constructor({ root, anchor, margin, bubbleMaxWidth }) {
    this.root = root || document.body;
    this.container = document.createElement('div');
    this.container.className = 'avatar-ui';
    this.activeMessageId = null;

    this.avatar = document.createElement('div');
    this.avatar.className = 'avatar-ui__avatar';

    this.bubble = document.createElement('div');
    this.bubble.className = 'avatar-ui__bubble';

    this.bubbleText = document.createElement('div');
    this.bubbleText.className = 'avatar-ui__text';

    this.bubble.appendChild(this.bubbleText);
    this.container.appendChild(this.avatar);
    this.container.appendChild(this.bubble);
    this.root.appendChild(this.container);
    this.setPosition(anchor, margin);
    this.setBubbleMaxWidth(bubbleMaxWidth);
  }

  setActiveMessage(message) {
    if (message) {
      const user = message.user || '';
      const text = message.text || '';
      this.bubbleText.textContent = user ? `${user}: ${text}` : text;
      const nextId = message.id || `${user}:${text}`;
      const shouldReplay = nextId !== this.activeMessageId;
      this.activeMessageId = nextId;
      if (shouldReplay) {
        this.replayEnterAnimation();
      } else {
        this.container.classList.add('avatar-ui--visible');
      }
      return;
    }

    this.container.classList.remove('avatar-ui--visible');
    this.activeMessageId = null;
  }

  setPosition(anchor, margin) {
    const allowedAnchors = new Set([
      'bottom-left',
      'bottom-right',
      'top-left',
      'top-right'
    ]);
    const safeAnchor = allowedAnchors.has(anchor) ? anchor : 'bottom-left';
    const parsedMargin = Number(margin);
    const safeMargin =
      Number.isFinite(parsedMargin) && parsedMargin >= 0 ? parsedMargin : 24;

    this.container.dataset.anchor = safeAnchor;
    this.container.style.setProperty('--overlay-margin', `${safeMargin}px`);
  }

  setBubbleMaxWidth(maxWidth) {
    const parsedWidth = Number(maxWidth);
    const safeWidth =
      Number.isFinite(parsedWidth) && parsedWidth >= 120 ? parsedWidth : 420;

    this.container.style.setProperty('--bubble-max-width', `${safeWidth}px`);
  }

  replayEnterAnimation() {
    this.container.classList.remove('avatar-ui--visible');
    void this.container.offsetHeight;
    this.container.classList.add('avatar-ui--visible');
  }
}

window.AvatarUI = AvatarUI;
