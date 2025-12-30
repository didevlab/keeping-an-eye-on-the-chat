class AvatarAnimator {
  constructor({ avatar, eyes, eyeLeft, eyeRight, mouth, diagnostics }) {
    this.avatar = avatar;
    this.eyes = eyes;
    this.eyeLeft = eyeLeft;
    this.eyeRight = eyeRight;
    this.mouth = mouth;
    this.diagnostics = Boolean(diagnostics);
    this.gsap = window.gsap || null;
    this.isTalking = false;
    this.lookDirection = 'center';
    this.lookOffsetPx = 5;
    this.lookThreshold = 4;
    this.blinkTimer = null;
    this.blinkTimeline = null;
    this.talkTimeline = null;
    this.lookTween = null;
    this.blinking = false;
    this.isDestroyed = false;

    this.setup();
  }

  setup() {
    if (!this.gsap) {
      return;
    }
    if (this.eyes) {
      this.gsap.set(this.eyes, { x: 0, y: 0 });
    }
    if (this.eyeLeft && this.eyeRight) {
      this.gsap.set([this.eyeLeft, this.eyeRight], {
        scaleY: 1,
        transformOrigin: 'center'
      });
    }
    if (this.mouth) {
      this.gsap.set(this.mouth, {
        scaleY: 1,
        scaleX: 1,
        y: 0,
        transformOrigin: 'center'
      });
    }

    this.talkTimeline = this.gsap.timeline({
      repeat: -1,
      paused: true,
      repeatRefresh: true,
      defaults: { ease: 'power1.inOut' }
    });
    this.talkTimeline
      .to(this.mouth, {
        duration: 0.1,
        scaleY: () => this.randomFloat(1.5, 1.9),
        scaleX: () => this.randomFloat(0.92, 1.05),
        y: () => this.randomFloat(-0.5, 0.6)
      })
      .to(this.mouth, {
        duration: 0.1,
        scaleY: () => this.randomFloat(0.7, 0.95),
        scaleX: () => this.randomFloat(0.96, 1.02),
        y: 0
      })
      .to(this.mouth, {
        duration: 0.08,
        scaleY: () => this.randomFloat(1.2, 1.7),
        scaleX: () => this.randomFloat(0.9, 1.04),
        y: () => this.randomFloat(-0.5, 0.4)
      })
      .to(this.mouth, {
        duration: 0.09,
        scaleY: () => this.randomFloat(0.75, 1),
        scaleX: () => this.randomFloat(0.98, 1.02),
        y: 0
      });
  }

  log(message) {
    if (!this.diagnostics) {
      return;
    }
    console.info(`[diagnostics] avatar ${message}`);
  }

  startIdle() {
    this.startBlinking();
    this.stopTalking();
    this.lookCenter();
  }

  startTalking() {
    this.startBlinking();
    if (this.isTalking) {
      return;
    }
    this.isTalking = true;
    this.log('talk start');
    if (!this.talkTimeline) {
      return;
    }
    this.talkTimeline.play(0);
  }

  stopTalking() {
    if (!this.isTalking) {
      return;
    }
    this.isTalking = false;
    this.log('talk stop');
    if (!this.gsap || !this.mouth) {
      return;
    }
    if (this.talkTimeline) {
      this.talkTimeline.pause(0);
    }
    this.gsap.to(this.mouth, {
      duration: 0.14,
      scaleY: 1,
      scaleX: 1,
      y: 0,
      ease: 'power1.out'
    });
  }

  lookAtBubble(bubbleEl) {
    if (!bubbleEl || !this.avatar || !this.eyes) {
      this.lookCenter();
      return;
    }
    const bubbleRect = bubbleEl.getBoundingClientRect();
    const avatarRect = this.avatar.getBoundingClientRect();
    if (!bubbleRect.width || !avatarRect.width) {
      this.lookCenter();
      return;
    }

    const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
    const avatarCenterX = avatarRect.left + avatarRect.width / 2;
    const deltaX = bubbleCenterX - avatarCenterX;
    if (deltaX > this.lookThreshold) {
      this.lookAt('right');
    } else if (deltaX < -this.lookThreshold) {
      this.lookAt('left');
    } else {
      this.lookAt('center');
    }
  }

  lookCenter() {
    this.lookAt('center');
  }

  lookAt(direction) {
    const safeDirection = ['left', 'right', 'center'].includes(direction)
      ? direction
      : 'center';
    if (this.lookDirection === safeDirection) {
      return;
    }
    this.lookDirection = safeDirection;
    this.log(`look ${safeDirection}`);
    const offsetX =
      safeDirection === 'left'
        ? -this.lookOffsetPx
        : safeDirection === 'right'
          ? this.lookOffsetPx
          : 0;
    if (!this.gsap || !this.eyes) {
      return;
    }
    if (this.lookTween) {
      this.lookTween.kill();
    }
    this.lookTween = this.gsap.to(this.eyes, {
      x: offsetX,
      y: 0,
      duration: 0.18,
      ease: 'power2.out'
    });
  }

  startBlinking() {
    if (this.blinking) {
      return;
    }
    this.blinking = true;
    this.scheduleBlink();
  }

  stopBlinking() {
    this.blinking = false;
    if (this.blinkTimer) {
      window.clearTimeout(this.blinkTimer);
      this.blinkTimer = null;
    }
    if (this.blinkTimeline) {
      this.blinkTimeline.kill();
      this.blinkTimeline = null;
    }
  }

  scheduleBlink() {
    if (this.isDestroyed || !this.blinking) {
      return;
    }
    const delayMs = this.getBlinkDelay();
    this.blinkTimer = window.setTimeout(() => {
      this.blinkTimer = null;
      this.playBlink();
    }, delayMs);
  }

  playBlink() {
    if (this.isDestroyed) {
      return;
    }
    this.log('blink');
    if (!this.gsap || !this.eyeLeft || !this.eyeRight) {
      this.scheduleBlink();
      return;
    }
    if (this.blinkTimeline) {
      this.blinkTimeline.kill();
    }
    const downDuration = this.randomBetween(60, 90) / 1000;
    const upDuration = this.randomBetween(60, 90) / 1000;
    const closedScale = this.randomFloat(0.12, 0.2);
    this.blinkTimeline = this.gsap.timeline({
      onComplete: () => this.scheduleBlink()
    });
    this.blinkTimeline
      .to([this.eyeLeft, this.eyeRight], {
        duration: downDuration,
        scaleY: closedScale,
        ease: 'power1.out'
      })
      .to([this.eyeLeft, this.eyeRight], {
        duration: upDuration,
        scaleY: 1,
        ease: 'power1.out'
      });
  }

  getBlinkDelay() {
    if (this.isTalking) {
      return this.randomBetween(1800, 4200);
    }
    return this.randomBetween(2200, 5200);
  }

  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  destroy() {
    this.isDestroyed = true;
    this.stopBlinking();
    if (this.lookTween) {
      this.lookTween.kill();
      this.lookTween = null;
    }
    if (this.talkTimeline) {
      this.talkTimeline.kill();
      this.talkTimeline = null;
    }
    if (this.gsap) {
      this.gsap.killTweensOf([
        this.eyes,
        this.eyeLeft,
        this.eyeRight,
        this.mouth
      ]);
    }
  }
}

window.AvatarAnimator = AvatarAnimator;
