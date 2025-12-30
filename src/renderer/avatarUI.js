class AvatarUI {
  constructor({ root, anchor, margin, bubbleMaxWidth }) {
    this.root = root || document.body;
    this.container = document.createElement('div');
    this.container.className = 'avatar-ui';
    this.activeMessageId = null;
    this.isTalking = false;
    this.lookDirection = 'center';
    this.blinkTimer = null;
    this.blinkResetTimer = null;
    this.lookFrame = null;
    this.blinkMinMs = 2000;
    this.blinkMaxMs = 5000;
    this.blinkDurationMs = 120;

    this.avatar = document.createElement('div');
    this.avatar.className = 'avatar-ui__avatar';
    this.avatar.dataset.look = 'center';

    this.eyeGroup = document.createElement('div');
    this.eyeGroup.className = 'avatar-ui__eyes';

    this.eyeLeft = document.createElement('div');
    this.eyeLeft.className = 'avatar-ui__eye avatar-ui__eye--left';

    this.eyeRight = document.createElement('div');
    this.eyeRight.className = 'avatar-ui__eye avatar-ui__eye--right';

    this.eyeGroup.appendChild(this.eyeLeft);
    this.eyeGroup.appendChild(this.eyeRight);

    this.mouth = document.createElement('div');
    this.mouth.className = 'avatar-ui__mouth';

    this.avatar.appendChild(this.eyeGroup);
    this.avatar.appendChild(this.mouth);

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
    this.startBlinking();
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
      this.setTalking(true);
      this.updateLookDirectionTowardBubble();
      return;
    }

    this.container.classList.remove('avatar-ui--visible');
    this.activeMessageId = null;
    this.setTalking(false);
    this.setLookDirection('center');
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

  setTalking(isTalking) {
    const nextState = Boolean(isTalking);
    if (this.isTalking === nextState) {
      return;
    }
    this.isTalking = nextState;
    this.avatar.classList.toggle('is-talking', nextState);
  }

  setBlinking(isBlinking) {
    this.avatar.classList.toggle('is-blinking', Boolean(isBlinking));
  }

  startBlinking() {
    const schedule = () => {
      const delay = this.randomBetween(this.blinkMinMs, this.blinkMaxMs);
      this.blinkTimer = window.setTimeout(() => {
        this.setBlinking(true);
        this.blinkResetTimer = window.setTimeout(() => {
          this.setBlinking(false);
          schedule();
        }, this.blinkDurationMs);
      }, delay);
    };

    schedule();
  }

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  updateLookDirectionTowardBubble() {
    if (!this.avatar || !this.bubble) {
      this.setLookDirection('center');
      return;
    }

    if (this.lookFrame) {
      window.cancelAnimationFrame(this.lookFrame);
    }

    this.lookFrame = window.requestAnimationFrame(() => {
      this.lookFrame = null;
      const bubbleRect = this.bubble.getBoundingClientRect();
      const avatarRect = this.avatar.getBoundingClientRect();
      if (!bubbleRect.width || !avatarRect.width) {
        this.setLookDirection('center');
        return;
      }

      const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
      const avatarCenterX = avatarRect.left + avatarRect.width / 2;
      const deltaX = bubbleCenterX - avatarCenterX;
      const threshold = 4;
      if (Math.abs(deltaX) <= threshold) {
        this.setLookDirection('center');
      } else {
        this.setLookDirection(deltaX < 0 ? 'left' : 'right');
      }
    });
  }

  setLookDirection(direction) {
    const safeDirection = ['left', 'right', 'center'].includes(direction)
      ? direction
      : 'center';
    if (this.lookDirection === safeDirection) {
      return;
    }
    this.lookDirection = safeDirection;
    this.avatar.dataset.look = safeDirection;
  }
}

window.AvatarUI = AvatarUI;
