class AvatarUI {
  constructor({ root, anchor, margin, bubbleMaxWidth }) {
    this.root = root || document.body;
    this.container = document.createElement('div');
    this.container.className = 'avatar-ui';
    this.activeMessageId = null;
    this.isTalking = false;
    this.isVisible = false;
    this.lookDirection = 'center';
    this.lookFrame = null;
    this.blinkCall = null;
    this.blinkTimeline = null;
    this.visibilityTween = null;
    this.lookTween = null;
    this.talkTimeline = null;
    this.bobTween = null;
    this.pulseTween = null;
    this.gsap = window.gsap || null;
    this.blinkMinMs = 2000;
    this.blinkMaxMs = 5000;
    this.blinkDurationMs = 120;
    this.lookOffsetPx = 3;

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
    this.setupAnimations();
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
        this.show();
      }
      this.setTalking(true);
      this.updateLookDirectionTowardBubble();
      return;
    }

    this.hide();
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

  setupAnimations() {
    if (!this.gsap) {
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(16px) scale(0.98)';
      return;
    }

    this.gsap.set(this.container, { autoAlpha: 0, y: 16, scale: 0.98 });
    this.gsap.set(this.eyeGroup, { x: 0, y: 0 });
    this.gsap.set([this.eyeLeft, this.eyeRight], {
      scaleY: 1,
      transformOrigin: 'center'
    });
    this.gsap.set(this.mouth, { scaleY: 1, transformOrigin: 'center' });

    this.bobTween = this.gsap.to(this.avatar, {
      y: -2,
      duration: 1.3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: true
    });

    this.pulseTween = this.gsap.to(this.bubble, {
      y: -1,
      scale: 1.01,
      duration: 1.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: true
    });

    this.talkTimeline = this.gsap.timeline({
      repeat: -1,
      paused: true,
      defaults: { ease: 'power1.inOut' }
    });
    this.talkTimeline
      .to(this.mouth, { duration: 0.08, scaleY: 0.3 })
      .to(this.mouth, { duration: 0.1, scaleY: 1 })
      .to(this.mouth, { duration: 0.07, scaleY: 0.45 })
      .to(this.mouth, { duration: 0.1, scaleY: 0.85 });

    const blinkHalf = this.blinkDurationMs / 2000;
    this.blinkTimeline = this.gsap.timeline({
      paused: true,
      onComplete: () => {
        this.scheduleBlink();
      }
    });
    this.blinkTimeline
      .to([this.eyeLeft, this.eyeRight], {
        duration: blinkHalf,
        scaleY: 0.15,
        ease: 'power1.out'
      })
      .to([this.eyeLeft, this.eyeRight], {
        duration: blinkHalf,
        scaleY: 1,
        ease: 'power1.out'
      });
  }

  show(replay = false) {
    if (this.isVisible && !replay) {
      return;
    }
    this.container.classList.add('avatar-ui--visible');
    if (!this.gsap) {
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(0) scale(1)';
      this.isVisible = true;
      return;
    }

    if (this.visibilityTween) {
      this.visibilityTween.kill();
    }
    if (replay) {
      this.gsap.set(this.container, { autoAlpha: 0, y: 16, scale: 0.98 });
    }
    this.visibilityTween = this.gsap.to(this.container, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.35,
      ease: 'power2.out'
    });
    if (this.bobTween) {
      this.bobTween.play();
    }
    if (this.pulseTween) {
      this.pulseTween.play();
    }
    this.isVisible = true;
  }

  hide() {
    if (!this.isVisible) {
      return;
    }
    this.container.classList.remove('avatar-ui--visible');
    if (!this.gsap) {
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(16px) scale(0.98)';
      this.isVisible = false;
      return;
    }

    if (this.visibilityTween) {
      this.visibilityTween.kill();
    }
    this.visibilityTween = this.gsap.to(this.container, {
      autoAlpha: 0,
      y: 16,
      scale: 0.98,
      duration: 0.35,
      ease: 'power2.in'
    });
    if (this.bobTween) {
      this.bobTween.pause(0);
    }
    if (this.pulseTween) {
      this.pulseTween.pause(0);
    }
    this.isVisible = false;
  }

  replayEnterAnimation() {
    this.show(true);
  }

  setTalking(isTalking) {
    const nextState = Boolean(isTalking);
    if (this.isTalking === nextState) {
      return;
    }
    this.isTalking = nextState;
    this.avatar.classList.toggle('is-talking', nextState);
    if (!this.gsap || !this.talkTimeline) {
      return;
    }
    if (nextState) {
      this.talkTimeline.play(0);
    } else {
      this.talkTimeline.pause(0);
      this.gsap.to(this.mouth, {
        duration: 0.12,
        scaleY: 1,
        ease: 'power1.out'
      });
    }
  }

  startBlinking() {
    if (!this.gsap || !this.blinkTimeline) {
      return;
    }
    this.scheduleBlink();
  }

  scheduleBlink() {
    if (!this.gsap || !this.blinkTimeline) {
      return;
    }
    if (this.blinkCall) {
      this.blinkCall.kill();
    }
    const delaySeconds =
      this.randomBetween(this.blinkMinMs, this.blinkMaxMs) / 1000;
    this.blinkCall = this.gsap.delayedCall(delaySeconds, () => {
      this.playBlink();
    });
  }

  playBlink() {
    if (!this.blinkTimeline) {
      return;
    }
    this.blinkTimeline.restart();
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
    const offsetX =
      safeDirection === 'left'
        ? -this.lookOffsetPx
        : safeDirection === 'right'
          ? this.lookOffsetPx
          : 0;
    if (this.gsap) {
      if (this.lookTween) {
        this.lookTween.kill();
      }
      this.lookTween = this.gsap.to(this.eyeGroup, {
        x: offsetX,
        duration: 0.18,
        ease: 'power2.out'
      });
    } else if (this.eyeGroup) {
      this.eyeGroup.style.transform = `translateX(${offsetX}px)`;
    }
  }
}

window.AvatarUI = AvatarUI;
