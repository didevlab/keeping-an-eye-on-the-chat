class AvatarAnimator {
  constructor({ avatar, eyes, eyeLeft, eyeRight, mouth, mouthInner, diagnostics }) {
    this.avatar = avatar;
    this.eyes = eyes;
    this.eyeLeft = eyeLeft;
    this.eyeRight = eyeRight;
    this.mouth = mouth;
    this.mouthInner = mouthInner || null;
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
    this.speechIntensity = 0.4;
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
    if (this.mouthInner) {
      this.gsap.set(this.mouthInner, { opacity: 0 });
    }

    this.talkTimeline = this.gsap.timeline({
      paused: true,
      defaults: { ease: 'power1.inOut' },
      onComplete: () => {
        if (!this.isTalking || this.isDestroyed) {
          return;
        }
        this.buildTalkCycle();
        this.talkTimeline.play(0);
      }
    });
    this.buildTalkCycle();
  }

  log(message) {
    if (!this.diagnostics) {
      return;
    }
    console.info(`[diagnostics] avatar ${message}`);
  }

  setSpeechIntensity(value) {
    if (!Number.isFinite(value)) {
      return;
    }
    const normalized = value <= 1 ? value : value / 140;
    this.speechIntensity = this.clamp(normalized, 0, 1);
  }

  buildTalkCycle() {
    if (!this.talkTimeline || !this.mouth) {
      return;
    }
    this.talkTimeline.clear();
    const steps = this.randomBetween(6, 12);
    for (let i = 0; i < steps; i += 1) {
      const preset = this.pickMouthPreset();
      const duration = this.randomFloat(0.06, 0.14);
      this.addMouthStep(preset, duration, true);
    }
    const restPreset = this.getRestPreset();
    const restDuration = this.randomFloat(0.08, 0.12);
    this.addMouthStep(restPreset, restDuration, false);
  }

  getRestPreset() {
    return {
      scaleY: 0.85,
      scaleX: 1,
      y: 0,
      innerOpacity: 0
    };
  }

  pickMouthPreset() {
    const intensity = this.speechIntensity;
    const presets = [
      {
        name: 'small',
        scaleY: 1.25,
        scaleX: 1.05,
        y: -0.3,
        innerOpacity: 0,
        weight: 4 + (1 - intensity) * 2
      },
      {
        name: 'medium',
        scaleY: 1.55,
        scaleX: 1.1,
        y: -0.6,
        innerOpacity: 0.32,
        weight: 2.6 + intensity * 2
      },
      {
        name: 'wide',
        scaleY: 1.85,
        scaleX: 1.18,
        y: -0.9,
        innerOpacity: 0.42,
        weight: 0.5 + intensity * 1.2
      },
      {
        name: 'closed',
        scaleY: 0.8,
        scaleX: 1,
        y: 0,
        innerOpacity: 0,
        weight: 1.6 - intensity * 0.6
      }
    ];

    const totalWeight = presets.reduce((sum, preset) => {
      return sum + Math.max(0.2, preset.weight);
    }, 0);
    let pick = Math.random() * totalWeight;
    for (const preset of presets) {
      const weight = Math.max(0.2, preset.weight);
      if (pick <= weight) {
        return preset;
      }
      pick -= weight;
    }
    return presets[0];
  }

  addMouthStep(preset, duration, allowJitter) {
    if (!this.talkTimeline || !this.mouth) {
      return;
    }
    const shape = this.applyMouthPreset(preset, allowJitter);
    this.talkTimeline.to(
      this.mouth,
      {
        duration,
        scaleY: shape.scaleY,
        scaleX: shape.scaleX,
        y: shape.y
      },
      '>'
    );
    if (this.mouthInner) {
      this.talkTimeline.to(
        this.mouthInner,
        {
          duration,
          opacity: shape.innerOpacity
        },
        '<'
      );
    }
  }

  applyMouthPreset(preset, allowJitter) {
    const jitter = allowJitter ? 1 : 0;
    const scaleY = this.clamp(
      preset.scaleY + this.randomFloat(-0.06, 0.06) * jitter,
      0.75,
      1.9
    );
    const scaleX = this.clamp(
      preset.scaleX + this.randomFloat(-0.04, 0.05) * jitter,
      0.95,
      1.22
    );
    const y = this.clamp(
      preset.y + this.randomFloat(-0.2, 0.2) * jitter,
      -1.5,
      0.5
    );
    let innerOpacity = 0;
    if (this.mouthInner && preset.innerOpacity > 0) {
      innerOpacity = this.clamp(
        preset.innerOpacity + this.randomFloat(-0.05, 0.05) * jitter,
        0.25,
        0.45
      );
    }
    return { scaleY, scaleX, y, innerOpacity };
  }

  startIdle() {
    this.startBlinking();
    this.stopTalking();
    this.lookCenter();
  }

  startTalking(intensityOrLength) {
    this.startBlinking();
    this.setSpeechIntensity(intensityOrLength);
    const wasTalking = this.isTalking;
    this.isTalking = true;
    if (!wasTalking) {
      this.log('talk start');
    }
    if (!this.talkTimeline) {
      return;
    }
    this.buildTalkCycle();
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
    if (this.mouthInner) {
      this.gsap.to(this.mouthInner, {
        duration: 0.14,
        opacity: 0,
        ease: 'power1.out'
      });
    }
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

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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
        this.mouth,
        this.mouthInner
      ]);
    }
  }
}

window.AvatarAnimator = AvatarAnimator;
