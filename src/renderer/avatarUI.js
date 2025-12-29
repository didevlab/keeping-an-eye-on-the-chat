class AvatarUI {
  constructor({ root, anchor, margin }) {
    this.root = root || document.body;
    this.container = document.createElement('div');
    this.container.className = 'avatar-ui';

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
  }

  setActiveMessage(message) {
    if (message) {
      const user = message.user || '';
      const text = message.text || '';
      this.bubbleText.textContent = user ? `${user}: ${text}` : text;
      this.container.classList.add('avatar-ui--visible');
      return;
    }

    this.container.classList.remove('avatar-ui--visible');
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
}

window.AvatarUI = AvatarUI;
