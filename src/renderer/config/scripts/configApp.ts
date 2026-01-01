/**
 * Configuration window application controller.
 * Renders the form from schema and handles user interactions.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ConfigAPI {
  getSchema: () => Promise<any>;
  load: () => Promise<any>;
  validate: (config: any) => Promise<Record<string, string>>;
  save: (config: any) => Promise<{ success: boolean; error: string | null }>;
  reset: () => Promise<{ success: boolean; error: string | null }>;
  testConnection: (url: string) => Promise<{
    success: boolean;
    error: string | null;
    latencyMs: number | null;
  }>;
  applyPreset: (presetId: string) => Promise<{
    success: boolean;
    config?: any;
    error?: string;
  }>;
  getDefaults: () => Promise<any>;
  start: (config: any) => Promise<{
    success: boolean;
    errors?: Record<string, string>;
  }>;
  notifyStarted: () => void;
}

declare global {
  interface Window {
    configAPI: ConfigAPI;
  }
}

/**
 * Main configuration application class.
 */
class ConfigApp {
  private schema: Record<string, any> = {};
  private sections: readonly string[] = [];
  private sectionMeta: Record<string, { title: string; description: string }> = {};
  private presets: any[] = [];
  private config: Record<string, any> = {};
  private sources: Record<string, string> = {};
  private originalConfig: Record<string, any> = {};
  private errors: Record<string, string> = {};
  private isDirty = false;
  private isFirstRun = false;

  /**
   * Initialize the application.
   */
  async init(): Promise<void> {
    try {
      // Load schema and presets
      const schemaData = await window.configAPI.getSchema();
      this.schema = schemaData.schema;
      this.sections = schemaData.sections;
      this.sectionMeta = schemaData.sectionMeta;
      this.presets = [...schemaData.presets];

      // Load saved config
      const loadResult = await window.configAPI.load();
      this.config = { ...loadResult.config };
      this.sources = loadResult.sources;
      this.originalConfig = { ...loadResult.config };
      this.isFirstRun = loadResult.isFirstRun;

      if (loadResult.loadError) {
        this.showAlert('warning', loadResult.loadError);
      }

      if (this.isFirstRun) {
        this.showAlert('info', 'Welcome! Enter your Twitch chat URL to get started.');
      }

      // Render UI
      this.renderPresets();
      this.renderSections();
      this.bindEvents();
      await this.validateAndUpdate();

      // Focus the first required field
      this.focusFirstRequiredField();
    } catch (err) {
      console.error('Failed to initialize config app:', err);
      this.showAlert('error', 'Failed to load configuration. Please restart the app.');
    }
  }

  /**
   * Render presets dropdown.
   */
  private renderPresets(): void {
    const select = document.getElementById('presetSelect') as HTMLSelectElement;
    if (!select) return;

    for (const preset of this.presets) {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = `${preset.name} - ${preset.description}`;
      select.appendChild(option);
    }
  }

  /**
   * Render all config sections.
   */
  private renderSections(): void {
    for (const section of this.sections) {
      const container = document.getElementById(`section-${section}`);
      if (!container) continue;

      const fields = Object.values(this.schema).filter(
        (field: any) => field.section === section
      ) as any[];

      for (const field of fields) {
        container.appendChild(this.createField(field));
      }
    }
  }

  /**
   * Create a form field element.
   */
  private createField(meta: any): HTMLElement {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field';
    fieldDiv.dataset.key = meta.key;

    const source = this.sources[meta.key];
    const isOverridden = source === 'env' || source === 'cli';

    // Label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'form-label';

    const labelText = document.createElement('span');
    labelText.textContent = meta.label;
    if (meta.required) {
      const req = document.createElement('span');
      req.className = 'required';
      req.textContent = ' *';
      labelText.appendChild(req);
    }
    labelDiv.appendChild(labelText);

    // Override badge
    if (isOverridden) {
      const badge = document.createElement('span');
      badge.className = `override-badge override-badge--${source}`;
      badge.textContent = source.toUpperCase();
      badge.title = `This value is set by ${source === 'env' ? 'environment variable' : 'command line'}`;
      labelDiv.appendChild(badge);
    }

    fieldDiv.appendChild(labelDiv);

    // Description
    if (meta.description) {
      const desc = document.createElement('p');
      desc.className = 'form-description';
      desc.textContent = meta.description;
      fieldDiv.appendChild(desc);
    }

    // Input element
    const inputContainer = this.createInput(meta, isOverridden);
    fieldDiv.appendChild(inputContainer);

    // Error container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.id = `error-${meta.key}`;
    fieldDiv.appendChild(errorDiv);

    return fieldDiv;
  }

  /**
   * Create the appropriate input element for a field.
   */
  private createInput(meta: any, disabled: boolean): HTMLElement {
    const value = this.config[meta.key];

    // Boolean checkbox
    if (meta.type === 'boolean') {
      const label = document.createElement('label');
      label.className = 'form-checkbox';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `input-${meta.key}`;
      input.checked = Boolean(value);
      input.disabled = disabled;

      label.appendChild(input);
      label.appendChild(document.createTextNode(' Enable'));
      return label;
    }

    // Select dropdown
    if (meta.type === 'select') {
      const select = document.createElement('select');
      select.className = 'form-select';
      select.id = `input-${meta.key}`;
      select.disabled = disabled;

      for (const opt of meta.options || []) {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        option.selected = value === opt.value;
        select.appendChild(option);
      }

      return select;
    }

    // Text/number input (possibly with test button)
    const container = document.createElement('div');
    container.className = 'form-input-group';

    const input = document.createElement('input');
    input.className = 'form-input';
    input.id = `input-${meta.key}`;
    input.type = meta.type === 'number' ? 'number' : 'text';
    input.value = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    input.disabled = disabled;

    if (meta.placeholder) {
      input.placeholder = meta.placeholder;
    }
    if (meta.min !== undefined) {
      input.min = String(meta.min);
    }
    if (meta.max !== undefined) {
      input.max = String(meta.max);
    }

    container.appendChild(input);

    // Add Test Connection button for twitchChatUrl
    if (meta.key === 'twitchChatUrl') {
      const testBtn = document.createElement('button');
      testBtn.type = 'button';
      testBtn.className = 'btn btn--secondary btn--small';
      testBtn.textContent = 'Test';
      testBtn.id = 'testConnectionBtn';
      testBtn.disabled = disabled;
      container.appendChild(testBtn);
    }

    return container;
  }

  /**
   * Bind event listeners.
   */
  private bindEvents(): void {
    const form = document.getElementById('configForm');

    // Form input changes
    form?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleInputChange(target);
    });

    form?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleInputChange(target);
    });

    // Preset selection
    document.getElementById('presetSelect')?.addEventListener('change', async (e) => {
      const select = e.target as HTMLSelectElement;
      if (select.value) {
        await this.applyPreset(select.value);
        select.value = '';
      }
    });

    // Advanced section toggle
    document.getElementById('advancedToggle')?.addEventListener('click', () => {
      this.toggleAdvancedSection();
    });

    // Test connection button
    document.getElementById('testConnectionBtn')?.addEventListener('click', () => {
      this.testConnection();
    });

    // Reset button
    document.getElementById('resetBtn')?.addEventListener('click', async () => {
      await this.resetToDefaults();
    });

    // Cancel button
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
      this.handleCancel();
    });

    // Start button
    document.getElementById('startBtn')?.addEventListener('click', () => {
      this.startOverlay();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl+Enter to start
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
        if (!startBtn.disabled) {
          this.startOverlay();
        }
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        const modal = document.getElementById('connectionModal');
        if (modal && !modal.hidden) {
          // Modal is open, don't close window
          return;
        }
        this.handleCancel();
      }
    });
  }

  /**
   * Handle input value changes.
   */
  private handleInputChange(target: HTMLInputElement | HTMLSelectElement): void {
    const id = target.id;
    if (!id.startsWith('input-')) return;

    const key = id.replace('input-', '');
    const meta = this.schema[key];
    if (!meta) return;

    let value: any;
    if (target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    } else if (meta.type === 'number') {
      value = Number(target.value);
    } else if (meta.type === 'string[]') {
      value = target.value
        .split(',')
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
    } else {
      value = target.value;
    }

    this.config[key] = value;
    this.isDirty = true;
    this.validateAndUpdate();
  }

  /**
   * Update form inputs from current config.
   */
  private updateFormFromConfig(): void {
    for (const [key, value] of Object.entries(this.config)) {
      const input = document.getElementById(`input-${key}`) as HTMLInputElement | null;
      if (!input) continue;

      if (input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else if (Array.isArray(value)) {
        input.value = value.join(', ');
      } else {
        input.value = String(value ?? '');
      }
    }
  }

  /**
   * Validate config and update UI state.
   */
  private async validateAndUpdate(): Promise<void> {
    this.errors = await window.configAPI.validate(this.config);

    // Update error displays
    for (const key of Object.keys(this.schema)) {
      const errorEl = document.getElementById(`error-${key}`);
      const inputEl = document.getElementById(`input-${key}`);

      if (errorEl) {
        errorEl.textContent = this.errors[key] || '';
      }

      if (inputEl) {
        inputEl.classList.toggle('form-input--error', Boolean(this.errors[key]));
      }
    }

    // Update start button
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const hasErrors = Object.keys(this.errors).length > 0;
    startBtn.disabled = hasErrors;
  }

  /**
   * Apply a preset configuration.
   */
  private async applyPreset(presetId: string): Promise<void> {
    const result = await window.configAPI.applyPreset(presetId);
    if (result.success && result.config) {
      this.config = { ...result.config };
      this.updateFormFromConfig();
      await this.validateAndUpdate();
      this.isDirty = true;
      this.showAlert('success', 'Preset applied. Click Start to begin.');
    } else {
      this.showAlert('error', result.error || 'Failed to apply preset');
    }
  }

  /**
   * Toggle the advanced section.
   */
  private toggleAdvancedSection(): void {
    const button = document.getElementById('advancedToggle') as HTMLButtonElement;
    const section = button.closest('.config-section');
    const content = document.getElementById('section-advanced');
    const icon = button.querySelector('.toggle-icon');

    if (!content || !icon || !section) return;

    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isExpanded));
    content.hidden = isExpanded;
    icon.textContent = isExpanded ? '+' : '-';
    section.classList.toggle('config-section--collapsed', isExpanded);
  }

  /**
   * Test connection to Twitch URL.
   */
  private async testConnection(): Promise<void> {
    const url = this.config.twitchChatUrl;
    if (!url || !url.trim()) {
      this.showAlert('error', 'Enter a Twitch Chat URL first');
      return;
    }

    const modal = document.getElementById('connectionModal');
    if (modal) modal.hidden = false;

    try {
      const result = await window.configAPI.testConnection(url);

      if (result.success) {
        this.showAlert('success', `Connection successful! (${result.latencyMs}ms)`);
      } else {
        this.showAlert('error', `Connection failed: ${result.error}`);
      }
    } catch (err) {
      this.showAlert('error', 'Connection test failed unexpectedly');
    } finally {
      if (modal) modal.hidden = true;
    }
  }

  /**
   * Reset configuration to defaults.
   */
  private async resetToDefaults(): Promise<void> {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    const defaults = await window.configAPI.getDefaults();
    this.config = { ...defaults };
    this.updateFormFromConfig();
    await this.validateAndUpdate();
    this.isDirty = true;
    this.showAlert('info', 'Settings reset to defaults.');
  }

  /**
   * Handle cancel button click.
   */
  private handleCancel(): void {
    if (this.isDirty) {
      if (!confirm('Discard unsaved changes?')) {
        return;
      }
    }
    window.close();
  }

  /**
   * Start the overlay with current configuration.
   */
  private async startOverlay(): Promise<void> {
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';

    try {
      const result = await window.configAPI.start(this.config);

      if (result.success) {
        window.configAPI.notifyStarted();
      } else if (result.errors) {
        this.errors = result.errors;
        for (const [key, error] of Object.entries(result.errors)) {
          const errorEl = document.getElementById(`error-${key}`);
          if (errorEl) errorEl.textContent = error;
        }
        this.showAlert('error', 'Please fix the errors above');
        startBtn.disabled = false;
        startBtn.textContent = 'Start Overlay';
      }
    } catch (err) {
      this.showAlert('error', 'Failed to start overlay');
      startBtn.disabled = false;
      startBtn.textContent = 'Start Overlay';
    }
  }

  /**
   * Focus the first required field that's empty.
   */
  private focusFirstRequiredField(): void {
    for (const [key, meta] of Object.entries(this.schema) as [string, any][]) {
      if (meta.required && !this.config[key]) {
        const input = document.getElementById(`input-${key}`);
        if (input) {
          input.focus();
          break;
        }
      }
    }
  }

  /**
   * Show an alert message.
   */
  private showAlert(type: 'error' | 'warning' | 'success' | 'info', message: string): void {
    const container = document.getElementById('alerts');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert--${type}`;
    alert.textContent = message;

    container.innerHTML = '';
    container.appendChild(alert);

    // Auto-dismiss success/info after 5s
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 5000);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ConfigApp();
  app.init().catch(console.error);
});

export {};
