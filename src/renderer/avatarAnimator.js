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
    this.sentencePauseBias = 0;
    this.lastTalkText = '';
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

    this.talkTimeline = null;
  }

  log(message) {
    if (!this.diagnostics) {
      return;
    }
    console.info(`[diagnostics] avatar ${message}`);
  }

  setSpeechProfile(input) {
    let length = 0;
    let sentenceCount = 0;
    if (typeof input === 'string') {
      length = input.length;
      const matches = input.match(/[.!?]/g);
      sentenceCount = matches ? matches.length : 0;
    } else if (Number.isFinite(input)) {
      length = input;
    }
    const normalized = length > 0 ? length / 120 : 0;
    this.speechIntensity = this.clamp(normalized, 0, 1);
    this.sentencePauseBias = Math.min(sentenceCount, 3);
  }

  tokenizeText(text) {
    if (typeof text !== 'string') {
      return [];
    }
    const tokens = text.match(/(\s+|[.,!?;:]+|[^\s.,!?;:]+)/g);
    return tokens ? tokens.filter(Boolean) : [];
  }

  formatTokenPreview(tokens, limit = 12) {
    if (!Array.isArray(tokens) || tokens.length === 0) {
      return '';
    }
    return tokens
      .slice(0, limit)
      .map((token) => (/\s+/.test(token) ? '<ws>' : token))
      .join(' | ');
  }

  buildTalkTimeline(text) {
    if (!this.gsap || !this.mouth) {
      return { tokens: [], duration: 0 };
    }
    if (this.talkTimeline) {
      this.talkTimeline.kill();
    }
    this.talkTimeline = this.gsap.timeline({
      paused: true,
      defaults: { ease: 'power1.inOut' }
    });

    const tokens = this.tokenizeText(text);
    let duration = this.addTokensToTimeline(tokens, this.talkTimeline);
    if (duration === 0) {
      duration = this.addWordToTimeline('hi', this.talkTimeline);
    }
    this.addIdleTail(this.talkTimeline);

    return { tokens, duration };
  }

  addTokensToTimeline(tokens, timeline) {
    if (!timeline) {
      return 0;
    }
    let total = 0;
    let hasWord = false;
    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        const pause = this.randomFloat(0.04, 0.1);
        this.addPauseDuration(timeline, pause);
        total += pause;
        continue;
      }
      if (/^[.,!?;:]+$/.test(token)) {
        const isSentence = /[.!?]/.test(token);
        let pause = isSentence
          ? this.randomFloat(0.16, 0.28)
          : this.randomFloat(0.1, 0.18);
        if (isSentence && this.sentencePauseBias > 0) {
          pause += this.randomFloat(0.02, 0.05) * this.sentencePauseBias;
        }
        this.addPauseDuration(timeline, pause);
        total += pause;
        continue;
      }
      hasWord = true;
      total += this.addWordToTimeline(token, timeline);
    }
    if (!hasWord) {
      total += this.addWordToTimeline('hi', timeline);
    }
    return total;
  }

  addWordToTimeline(word, timeline) {
    if (!timeline) {
      return 0;
    }
    const wordLength = this.getWordLength(word);
    const wordDuration = this.getWordDuration(wordLength);
    const syllables = this.getSyllableCount(wordLength);
    const restDurations = [];
    for (let i = 0; i < syllables - 1; i += 1) {
      restDurations.push(Math.random() < 0.3 ? this.randomFloat(0.03, 0.06) : 0);
    }
    let restTotal = restDurations.reduce((sum, value) => sum + value, 0);
    const maxRest = wordDuration * 0.35;
    if (restTotal > maxRest && restTotal > 0) {
      const scale = maxRest / restTotal;
      for (let i = 0; i < restDurations.length; i += 1) {
        restDurations[i] *= scale;
      }
      restTotal = maxRest;
    }
    let perSyllable = (wordDuration - restTotal) / syllables;
    perSyllable = this.clamp(perSyllable, 0.05, 0.16);

    let total = 0;
    for (let i = 0; i < syllables; i += 1) {
      const duration = this.applyTimingJitter(perSyllable, 0.15, 0.05, 0.18);
      const preset = this.pickVisemePreset();
      this.addVisemeStep(timeline, preset, duration);
      total += duration;
      if (i < syllables - 1 && restDurations[i] > 0) {
        this.addPauseDuration(timeline, restDurations[i]);
        total += restDurations[i];
      }
    }
    return total;
  }

  getWordLength(word) {
    if (typeof word !== 'string') {
      return 0;
    }
    const stripped = word.replace(/[^a-z0-9]/gi, '');
    return stripped.length || word.length;
  }

  getWordDuration(length) {
    const base = 0.1 + 0.02 * Math.min(length, 10);
    return this.clamp(base, 0.14, 0.34);
  }

  getSyllableCount(length) {
    if (length <= 3) {
      return 1;
    }
    if (length <= 6) {
      return 2;
    }
    return 3;
  }

  pickVisemePreset() {
    const intensity = this.speechIntensity;
    const smallWeight = 0.55 - intensity * 0.08;
    const medWeight = 0.3 + intensity * 0.08;
    const closedWeight = 0.12 - intensity * 0.04;
    const wideWeight = 0.03 + intensity * 0.04;
    const presets = [
      {
        name: 'small',
        weight: Math.max(0.2, smallWeight),
        scaleY: [1.2, 1.35],
        scaleX: [1.02, 1.06],
        y: [-0.35, -0.15],
        innerOpacity: [0.08, 0.14]
      },
      {
        name: 'medium',
        weight: Math.max(0.15, medWeight),
        scaleY: [1.45, 1.65],
        scaleX: [1.06, 1.12],
        y: [-0.75, -0.45],
        innerOpacity: [0.22, 0.32]
      },
      {
        name: 'closed',
        weight: Math.max(0.08, closedWeight),
        scaleY: [0.82, 0.9],
        scaleX: [0.98, 1.02],
        y: [-0.05, 0.05],
        innerOpacity: [0, 0]
      },
      {
        name: 'wide',
        weight: Math.max(0.02, wideWeight),
        scaleY: [1.7, 1.9],
        scaleX: [1.1, 1.18],
        y: [-1, -0.75],
        innerOpacity: [0.32, 0.45]
      }
    ];
    const totalWeight = presets.reduce((sum, preset) => sum + preset.weight, 0);
    let pick = Math.random() * totalWeight;
    for (const preset of presets) {
      if (pick <= preset.weight) {
        return preset;
      }
      pick -= preset.weight;
    }
    return presets[0];
  }

  addVisemeStep(timeline, preset, duration) {
    if (!timeline || !preset || !this.mouth) {
      return;
    }
    const shape = this.resolveVisemeShape(preset);
    timeline.to(
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
      timeline.to(
        this.mouthInner,
        {
          duration,
          opacity: shape.innerOpacity
        },
        '<'
      );
    }
  }

  addPauseDuration(timeline, duration) {
    const restPreset = {
      scaleY: [0.88, 0.94],
      scaleX: [0.98, 1.02],
      y: [-0.02, 0.02],
      innerOpacity: [0, 0]
    };
    this.addVisemeStep(timeline, restPreset, duration);
  }

  addIdleTail(timeline) {
    if (!timeline || !this.mouth) {
      return;
    }
    const idleDuration = this.randomFloat(0.6, 0.8);
    timeline.to(
      this.mouth,
      {
        duration: idleDuration,
        scaleY: 1.02,
        scaleX: 1.01,
        y: -0.15,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      },
      '>'
    );
    if (this.mouthInner) {
      timeline.to(
        this.mouthInner,
        {
          duration: idleDuration,
          opacity: 0,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true
        },
        '<'
      );
    }
  }

  resolveVisemeShape(preset) {
    const scaleY = this.clamp(
      this.randomFromRange(preset.scaleY),
      0.75,
      1.9
    );
    const scaleX = this.clamp(
      this.randomFromRange(preset.scaleX),
      0.95,
      1.22
    );
    const y = this.clamp(this.randomFromRange(preset.y), -1.5, 0.5);
    const innerOpacity = this.mouthInner
      ? this.clamp(this.randomFromRange(preset.innerOpacity), 0, 0.45)
      : 0;
    return { scaleY, scaleX, y, innerOpacity };
  }

  randomFromRange(value) {
    if (Array.isArray(value)) {
      return this.randomFloat(value[0], value[1]);
    }
    return value;
  }

  applyTimingJitter(duration, percent, min, max) {
    const delta = duration * percent;
    return this.clamp(this.randomFloat(duration - delta, duration + delta), min, max);
  }

  startIdle() {
    this.startBlinking();
    this.stopTalking();
    this.lookCenter();
  }

  startTalking(textOrLength) {
    this.startBlinking();
    const text = typeof textOrLength === 'string' ? textOrLength : '';
    this.setSpeechProfile(textOrLength);
    const wasTalking = this.isTalking;
    if (wasTalking && this.lastTalkText === text && this.talkTimeline) {
      this.talkTimeline.play();
      return;
    }
    this.isTalking = true;
    if (!wasTalking) {
      this.log('talk start');
    }
    this.lastTalkText = text;
    const { tokens, duration } = this.buildTalkTimeline(text);
    if (this.diagnostics) {
      const preview = this.formatTokenPreview(tokens) || '<none>';
      this.log(`tokens ${preview}`);
      this.log(`talk duration ${duration.toFixed(2)}s`);
    }
    if (this.talkTimeline) {
      this.talkTimeline.play(0);
    }
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
      this.talkTimeline.kill();
      this.talkTimeline = null;
    }
    this.gsap.to(this.mouth, {
      duration: 0.16,
      scaleY: 1,
      scaleX: 1,
      y: 0,
      ease: 'power1.out'
    });
    if (this.mouthInner) {
      this.gsap.to(this.mouthInner, {
        duration: 0.16,
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
