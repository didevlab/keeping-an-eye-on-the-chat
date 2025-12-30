class RiveAvatarController {
  constructor({
    container,
    assetPath = './assets/mascot.riv',
    artboard = 'Mascot',
    stateMachine = 'Overlay',
    diagnostics = false,
    intensity = 0.5
  } = {}) {
    this.container = container || null;
    this.assetPath = assetPath;
    this.artboard = artboard;
    this.stateMachine = stateMachine;
    this.diagnostics = Boolean(diagnostics);
    this.allowFallback = this.diagnostics;
    this.intensity = Number.isFinite(intensity) ? intensity : 0.5;
    this.riveInstance = null;
    this.canvas = null;
    this.buffer = null;
    this.assetUrl = null;
    this.inputs = [];
    this.visibleInput = null;
    this.talkingInput = null;
    this.reactTrigger = null;
    this.intensityInput = null;
    this.activeArtboard = null;
    this.activeStateMachine = null;
    this.activeAnimation = null;
    this.fallbackAttempted = false;
    this.ready = false;
    this.destroyed = false;
    this.resizeObserver = null;
    this.resizePending = false;
    this.dprQuery = null;
    this.pending = {
      visible: null,
      talking: null,
      react: false
    };

    this.log('RiveAvatarController init starting.');

    if (!this.container) {
      this.log('RiveAvatarController: missing container.');
      return;
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'avatar-ui__rive';
    this.canvas.style.position = 'absolute';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'none';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.borderRadius = '50%';
    this.container.appendChild(this.canvas);

    this.handleWindowResize = () => this.requestResize();
    this.handleDprChange = () => {
      this.setupDprListener();
      this.requestResize();
    };

    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => this.requestResize());
      this.resizeObserver.observe(this.container);
    }

    window.addEventListener('resize', this.handleWindowResize);
    this.setupDprListener();
    this.load();
  }

  log(message) {
    if (!this.diagnostics) {
      return;
    }

    console.info(`[diagnostics] [rive] ${message}`);
  }

  logCssFallback(reason) {
    if (!reason) {
      this.log('Fallback: CSS avatar active.');
      return;
    }
    this.log(`Fallback: CSS avatar active (${reason}).`);
  }

  resolveAssetUrl() {
    const baseHref = window.location ? window.location.href : '';
    try {
      return new URL(this.assetPath, baseHref);
    } catch (error) {
      this.log(`Failed to resolve asset URL: ${error.message}`);
      return null;
    }
  }

  setupDprListener() {
    if (!window.matchMedia) {
      return;
    }

    if (this.dprQuery) {
      if (this.dprQuery.removeEventListener) {
        this.dprQuery.removeEventListener('change', this.handleDprChange);
      } else if (this.dprQuery.removeListener) {
        this.dprQuery.removeListener(this.handleDprChange);
      }
    }

    const dpr = window.devicePixelRatio || 1;
    this.dprQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
    if (this.dprQuery.addEventListener) {
      this.dprQuery.addEventListener('change', this.handleDprChange);
    } else if (this.dprQuery.addListener) {
      this.dprQuery.addListener(this.handleDprChange);
    }
  }

  requestResize() {
    if (this.resizePending) {
      return;
    }

    this.resizePending = true;
    window.requestAnimationFrame(() => {
      this.resizePending = false;
      this.resizeToContainer();
    });
  }

  resizeToContainer() {
    if (!this.canvas || !this.container) {
      return;
    }

    const rect = this.container.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.round(rect.width * dpr));
    const targetHeight = Math.max(1, Math.round(rect.height * dpr));

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }

    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    if (this.riveInstance && typeof this.riveInstance.resizeDrawingSurfaceToCanvas === 'function') {
      this.riveInstance.resizeDrawingSurfaceToCanvas();
    }
  }

  async load() {
    if (this.destroyed) {
      return;
    }

    const riveRuntime = window.rive || window.Rive;
    if (!riveRuntime || !riveRuntime.Rive) {
      this.log('Rive runtime not available.');
      this.logCssFallback('runtime not available');
      return;
    }

    const assetUrl = this.resolveAssetUrl();
    if (!assetUrl) {
      this.log('Mascot asset URL could not be resolved.');
      this.logCssFallback('asset url unresolved');
      return;
    }

    this.assetUrl = assetUrl.href;
    this.log(`Renderer location: ${window.location ? window.location.href : 'unknown'}`);
    this.log(`Mascot asset path: ${this.assetPath}`);
    this.log(`Mascot asset resolved: ${assetUrl.href}`);

    let response = null;
    try {
      response = await fetch(assetUrl.href);
    } catch (error) {
      const stack = error && error.stack ? `\n${error.stack}` : '';
      this.log(`Mascot asset fetch failed: ${error.message}${stack}`);
      this.logCssFallback('asset fetch failed');
      return;
    }

    if (!response || !response.ok) {
      const status = response ? response.status : 'unknown';
      this.log(`Mascot asset missing (status ${status}).`);
      this.logCssFallback('asset missing');
      return;
    }

    let buffer = null;
    try {
      buffer = await response.arrayBuffer();
    } catch (error) {
      const stack = error && error.stack ? `\n${error.stack}` : '';
      this.log(`Mascot asset read failed: ${error.message}${stack}`);
      this.logCssFallback('asset read failed');
      return;
    }

    if (this.destroyed) {
      return;
    }

    this.buffer = buffer;
    this.startRiveInstance({
      artboard: this.artboard,
      stateMachine: this.stateMachine,
      animation: null,
      fallback: false
    });
  }

  startRiveInstance({ artboard, stateMachine, animation, fallback }) {
    if (this.destroyed || !this.canvas || !this.buffer) {
      return;
    }

    const riveRuntime = window.rive || window.Rive;
    if (!riveRuntime || !riveRuntime.Rive) {
      return;
    }

    if (this.riveInstance && typeof this.riveInstance.cleanup === 'function') {
      this.riveInstance.cleanup();
    }

    this.riveInstance = null;
    this.ready = false;
    this.inputs = [];
    this.visibleInput = null;
    this.talkingInput = null;
    this.reactTrigger = null;
    this.intensityInput = null;

    this.activeArtboard = artboard || null;
    this.activeStateMachine = stateMachine || null;
    this.activeAnimation = animation || null;

    const options = {
      canvas: this.canvas,
      buffer: this.buffer,
      autoplay: true,
      onLoad: () => this.handleLoad()
    };

    if (this.activeArtboard) {
      options.artboard = this.activeArtboard;
    }
    if (this.activeStateMachine) {
      options.stateMachines = this.activeStateMachine;
    }
    if (this.activeAnimation) {
      options.animations = this.activeAnimation;
    }

    if (fallback) {
      this.log('Diagnostics fallback: initializing with available artboard/animation.');
    }

    if (riveRuntime.Layout && riveRuntime.Fit && riveRuntime.Alignment) {
      options.layout = new riveRuntime.Layout({
        fit: riveRuntime.Fit.Contain,
        alignment: riveRuntime.Alignment.Center
      });
    }

    try {
      this.riveInstance = new riveRuntime.Rive(options);
    } catch (error) {
      const stack = error && error.stack ? `\n${error.stack}` : '';
      this.log(`Rive init failed: ${error.message}${stack}`);
      this.teardownRive();
      this.logCssFallback('initialization failed');
    }
  }

  handleLoad() {
    if (this.destroyed || !this.riveInstance) {
      return;
    }

    const artboardNames = Array.isArray(this.riveInstance.artboardNames)
      ? this.riveInstance.artboardNames
      : [];
    const stateMachineNames = Array.isArray(this.riveInstance.stateMachineNames)
      ? this.riveInstance.stateMachineNames
      : [];
    const animationNames = Array.isArray(this.riveInstance.animationNames)
      ? this.riveInstance.animationNames
      : [];

    if (this.activeArtboard && artboardNames.length > 0) {
      if (!artboardNames.includes(this.activeArtboard)) {
        if (this.allowFallback && !this.fallbackAttempted) {
          this.fallbackAttempted = true;
          const fallbackArtboard = artboardNames[0] || null;
          const fallbackStateMachine = stateMachineNames[0] || null;
          const fallbackAnimation = !fallbackStateMachine ? animationNames[0] || null : null;
          this.log(
            `Diagnostics fallback: artboard not found (${this.activeArtboard}).`
          );
          if (!fallbackArtboard && !fallbackStateMachine && !fallbackAnimation) {
            this.log('Diagnostics fallback unavailable: no artboards or animations found.');
            this.teardownRive();
            this.logCssFallback('missing artboard');
            return;
          }
          this.startRiveInstance({
            artboard: fallbackArtboard,
            stateMachine: fallbackStateMachine,
            animation: fallbackAnimation,
            fallback: true
          });
          return;
        }

        this.log(`Rive init failed: artboard not found (${this.activeArtboard}).`);
        this.teardownRive();
        this.logCssFallback('missing artboard');
        return;
      }
    }

    if (this.activeStateMachine && stateMachineNames.length > 0) {
      if (!stateMachineNames.includes(this.activeStateMachine)) {
        if (this.allowFallback && !this.fallbackAttempted) {
          this.fallbackAttempted = true;
          const fallbackStateMachine = stateMachineNames[0] || null;
          const fallbackAnimation = !fallbackStateMachine ? animationNames[0] || null : null;
          this.log(
            `Diagnostics fallback: state machine not found (${this.activeStateMachine}).`
          );
          if (!fallbackStateMachine && !fallbackAnimation) {
            this.log('Diagnostics fallback unavailable: no state machines or animations found.');
            this.teardownRive();
            this.logCssFallback('missing state machine');
            return;
          }
          this.startRiveInstance({
            artboard: this.activeArtboard,
            stateMachine: fallbackStateMachine,
            animation: fallbackAnimation,
            fallback: true
          });
          return;
        }

        this.log(`Rive init failed: state machine not found (${this.activeStateMachine}).`);
        this.teardownRive();
        this.logCssFallback('missing state machine');
        return;
      }
    }

    if (this.activeStateMachine) {
      try {
        this.inputs = this.riveInstance.stateMachineInputs(this.activeStateMachine) || [];
      } catch (error) {
        const stack = error && error.stack ? `\n${error.stack}` : '';
        this.log(`Rive init failed: state machine inputs unavailable: ${error.message}${stack}`);
        this.teardownRive();
        this.logCssFallback('state machine inputs unavailable');
        return;
      }
    }

    this.visibleInput = this.findBooleanInput('Visible');
    this.talkingInput = this.findBooleanInput('Talking');
    this.reactTrigger = this.findTriggerInput('Message');
    this.intensityInput = this.findNumberInput('Intensity');

    if (!this.visibleInput) {
      this.log('Input missing: Visible');
    }
    if (!this.reactTrigger) {
      this.log('Input missing: Message');
    }
    if (!this.intensityInput) {
      this.log('Input missing: Intensity');
    }

    this.ready = true;
    this.log('Rive init success.');
    this.log('Mascot loaded.');
    this.requestResize();
    this.applyPending();
  }

  findBooleanInput(name) {
    return this.inputs.find((input) =>
      input && input.name === name && typeof input.value === 'boolean'
    );
  }

  findNumberInput(name) {
    return this.inputs.find((input) =>
      input && input.name === name && typeof input.value === 'number'
    );
  }

  findTriggerInput(name) {
    return this.inputs.find((input) =>
      input && input.name === name && typeof input.fire === 'function'
    );
  }

  applyPending() {
    if (!this.ready) {
      return;
    }

    if (this.pending.visible !== null) {
      if (this.visibleInput) {
        this.visibleInput.value = this.pending.visible;
      }
      this.setCanvasVisible(this.pending.visible);
    }

    if (this.pending.talking !== null && this.talkingInput) {
      this.talkingInput.value = this.pending.talking;
    }

    if (this.intensityInput) {
      this.intensityInput.value = this.intensity;
    }

    if (this.pending.react && this.reactTrigger) {
      this.reactTrigger.fire();
    }

    this.pending.react = false;
    this.pending.visible = null;
  }

  setCanvasVisible(visible) {
    if (!this.canvas) {
      return;
    }

    this.canvas.style.display = visible ? 'block' : 'none';
  }

  setIdle() {
    this.pending.visible = false;
    this.pending.talking = false;
    this.applyPending();
  }

  setTalking(isTalking) {
    const talking = Boolean(isTalking);
    this.pending.talking = talking;
    if (talking) {
      this.pending.visible = true;
    }
    this.applyPending();
  }

  triggerReact() {
    this.pending.react = true;
    this.pending.visible = true;
    this.applyPending();
  }

  teardownRive() {
    this.ready = false;
    this.inputs = [];
    this.visibleInput = null;
    this.talkingInput = null;
    this.reactTrigger = null;
    this.intensityInput = null;
    this.setCanvasVisible(false);

    if (this.riveInstance && typeof this.riveInstance.cleanup === 'function') {
      this.riveInstance.cleanup();
    }

    this.riveInstance = null;
  }

  destroy() {
    this.destroyed = true;
    this.pending = { visible: null, talking: null, react: false };
    this.teardownRive();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener('resize', this.handleWindowResize);

    if (this.dprQuery) {
      if (this.dprQuery.removeEventListener) {
        this.dprQuery.removeEventListener('change', this.handleDprChange);
      } else if (this.dprQuery.removeListener) {
        this.dprQuery.removeListener(this.handleDprChange);
      }
      this.dprQuery = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.canvas = null;
  }
}

window.RiveAvatarController = RiveAvatarController;
