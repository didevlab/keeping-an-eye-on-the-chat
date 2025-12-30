class AvatarUI {
  constructor({ root, anchor, margin, bubbleMaxWidth, diagnostics }) {
    this.root = root || document.body;
    this.container = document.createElement('div');
    this.container.className = 'avatar-ui';
    this.activeMessageId = null;
    this.lookFrame = null;
    this.diagnostics = Boolean(diagnostics);

    this.avatar = document.createElement('div');
    this.avatar.className = 'avatar';

    this.face = document.createElement('div');
    this.face.className = 'avatar__face';

    this.eyeGroup = document.createElement('div');
    this.eyeGroup.className = 'avatar__eyes';

    this.eyeLeft = document.createElement('div');
    this.eyeLeft.className = 'avatar__eye avatar__eye--left';

    this.eyeRight = document.createElement('div');
    this.eyeRight.className = 'avatar__eye avatar__eye--right';

    this.eyeGroup.appendChild(this.eyeLeft);
    this.eyeGroup.appendChild(this.eyeRight);

    this.mouth = document.createElement('div');
    this.mouth.className = 'avatar__mouth';
    this.mouthInner = document.createElement('div');
    this.mouthInner.className = 'avatar__mouth-inner';
    this.mouth.appendChild(this.mouthInner);

    this.face.appendChild(this.eyeGroup);
    this.face.appendChild(this.mouth);
    this.avatar.appendChild(this.face);

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

    this.animator = window.AvatarAnimator
      ? new window.AvatarAnimator({
          avatar: this.avatar,
          eyes: this.eyeGroup,
          eyeLeft: this.eyeLeft,
          eyeRight: this.eyeRight,
          mouth: this.mouth,
          mouthInner: this.mouthInner,
          diagnostics: this.diagnostics
        })
      : null;
    if (this.animator) {
      this.animator.startIdle();
    }
  }

  setActiveMessage(message, options = {}) {
    const {
      animateEntrance = true,
      startTalking = true,
      lookAtBubble = true
    } = options;
    if (message) {
      const user = message.user || '';
      const text = message.text || '';
      this.bubbleText.textContent = user ? `${user}: ${text}` : text;
      const nextId = message.id || `${user}:${text}`;
      const shouldReplay = nextId !== this.activeMessageId;
      this.activeMessageId = nextId;
      if (shouldReplay) {
        if (animateEntrance) {
          this.replayEnterAnimation();
        } else {
          this.container.classList.remove('avatar-ui--visible');
        }
      } else if (animateEntrance) {
        this.container.classList.add('avatar-ui--visible');
      }
      if (this.animator && startTalking && shouldReplay) {
        this.animator.startTalking(text, this.bubble, message.id);
        if (lookAtBubble) {
          this.queueLookAtBubble();
        }
      }
      return;
    }

    this.container.classList.remove('avatar-ui--visible');
    this.activeMessageId = null;
    if (this.animator) {
      this.animator.stopTalkingAndReset();
      this.animator.lookCenter();
      this.animator.startBlinking();
    }
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

  waitForTransition(element, fallbackMs = 450) {
    if (!element) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        element.removeEventListener('transitionend', onEnd);
        window.clearTimeout(timer);
        resolve();
      };
      const onEnd = (event) => {
        if (event.target !== element) {
          return;
        }
        finish();
      };
      const timer = window.setTimeout(finish, fallbackMs);
      element.addEventListener('transitionend', onEnd);
    });
  }

  playEntranceAnimation() {
    if (!this.container) {
      return Promise.resolve();
    }
    this.replayEnterAnimation();
    return this.waitForTransition(this.container);
  }

  playReadingAnimation(message) {
    if (!message || !this.animator) {
      return Promise.resolve(0);
    }
    const text = message.text || '';
    let settled = false;
    return new Promise((resolve) => {
      const finish = (duration) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(duration || 0);
      };
      const duration = this.animator.startTalking(text, this.bubble, message.id, {
        onComplete: finish
      });
      this.queueLookAtBubble();
      if (!duration) {
        finish(0);
      }
    });
  }

  playExitAnimation(fallbackMs) {
    if (!this.container) {
      return Promise.resolve();
    }
    this.container.classList.remove('avatar-ui--visible');
    return this.waitForTransition(this.container, fallbackMs);
  }

  cancelDisplaySequence() {
    if (this.lookFrame) {
      window.cancelAnimationFrame(this.lookFrame);
      this.lookFrame = null;
    }
    if (this.animator) {
      this.animator.stopTalkingAndReset();
      this.animator.lookCenter();
      this.animator.startBlinking();
    }
  }

  queueLookAtBubble() {
    if (!this.animator) {
      return;
    }
    if (this.lookFrame) {
      window.cancelAnimationFrame(this.lookFrame);
    }
    this.lookFrame = window.requestAnimationFrame(() => {
      this.lookFrame = null;
      this.animator.lookAtBubble(this.bubble);
    });
  }

  destroy() {
    if (this.lookFrame) {
      window.cancelAnimationFrame(this.lookFrame);
      this.lookFrame = null;
    }
    if (this.animator) {
      this.animator.destroy();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

window.AvatarUI = AvatarUI;
