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
    this.intensity = Number.isFinite(intensity) ? intensity : 0.5;
    this.riveInstance = null;
    this.canvas = null;
    this.inputs = [];
    this.visibleInput = null;
    this.talkingInput = null;
    this.reactTrigger = null;
    this.intensityInput = null;
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
      return;
    }

    const assetUrl = this.resolveAssetUrl();
    if (!assetUrl) {
      this.log('Mascot asset URL could not be resolved.');
      return;
    }

    this.log(`Renderer location: ${window.location ? window.location.href : 'unknown'}`);
    this.log(`Mascot asset path: ${this.assetPath}`);
    this.log(`Mascot asset resolved: ${assetUrl.href}`);

    let response = null;
    try {
      response = await fetch(assetUrl.href);
    } catch (error) {
      const stack = error && error.stack ? `\n${error.stack}` : '';
      this.log(`Mascot asset fetch failed: ${error.message}${stack}`);
      return;
    }

    if (!response || !response.ok) {
      const status = response ? response.status : 'unknown';
      this.log(`Mascot asset missing (status ${status}).`);
      return;
    }

    let buffer = null;
    try {
      buffer = await response.arrayBuffer();
    } catch (error) {
      const stack = error && error.stack ? `\n${error.stack}` : '';
      this.log(`Mascot asset read failed: ${error.message}${stack}`);
      return;
    }

    if (this.destroyed) {
      return;
    }

    const options = {
      canvas: this.canvas,
      buffer,
      artboard: this.artboard,
      stateMachines: this.stateMachine,
      autoplay: true,
      onLoad: () => this.handleLoad()
    };

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
    }
  }

  handleLoad() {
    if (this.destroyed || !this.riveInstance) {
      return;
    }

    if (Array.isArray(this.riveInstance.stateMachineNames)) {
      if (!this.riveInstance.stateMachineNames.includes(this.stateMachine)) {
        this.log(`Rive init failed: state machine not found (${this.stateMachine}).`);
        this.teardownRive();
        return;
      }
    }

    try {
      this.inputs = this.riveInstance.stateMachineInputs(this.stateMachine) || [];
    } catch (error) {
      const stack = error && error.stack ? `\n${error.stack}` : '';
      this.log(`Rive init failed: state machine inputs unavailable: ${error.message}${stack}`);
      this.teardownRive();
      return;
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
