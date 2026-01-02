/**
 * Notification sound player for the overlay.
 * Plays audio when new messages appear.
 */

/** Allowed audio file extensions */
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];

interface NotificationSoundOptions {
  /** Whether sound is enabled. */
  enabled: boolean;
  /** Sound file name (relative to assets/sounds/). */
  soundFile: string;
  /** Volume level (0-100). */
  volume: number;
  /** Audio output device ID (empty string for system default). */
  deviceId?: string;
  /** Enable diagnostic logging. */
  diagnostics?: boolean;
}

/**
 * Validates if a file has an allowed audio extension.
 */
function isValidAudioFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * Notification sound player class.
 */
export class NotificationSound {
  private enabled: boolean;
  private volume: number;
  private deviceId: string;
  private audio: HTMLAudioElement | null = null;
  private diagnostics: boolean;

  constructor(options: NotificationSoundOptions) {
    this.enabled = options.enabled;
    this.volume = Math.max(0, Math.min(100, options.volume)) / 100;
    this.deviceId = options.deviceId || '';
    this.diagnostics = Boolean(options.diagnostics);

    if (this.enabled && options.soundFile) {
      this.loadSound(options.soundFile);
    }
  }

  /**
   * Load the sound file.
   */
  private loadSound(soundFile: string): void {
    if (!isValidAudioFile(soundFile)) {
      this.log(`Invalid audio file extension: ${soundFile}`);
      this.enabled = false;
      return;
    }

    const soundPath = `./assets/sounds/${soundFile}`;
    this.log(`Loading sound: ${soundPath}`);

    this.audio = new Audio(soundPath);
    this.audio.volume = this.volume;

    // Set audio output device if specified
    if (this.deviceId) {
      this.setAudioDevice(this.deviceId);
    }

    // Pre-load the audio
    this.audio.load();

    this.audio.addEventListener('error', (e) => {
      this.log(`Failed to load sound: ${soundPath}`);
      console.error('Audio load error:', e);
      this.enabled = false;
    });

    this.audio.addEventListener('canplaythrough', () => {
      this.log(`Sound loaded successfully: ${soundPath}`);
    });
  }

  /**
   * Set the audio output device.
   * Uses setSinkId() which is supported in Chromium-based browsers (including Electron).
   */
  private async setAudioDevice(deviceId: string): Promise<void> {
    if (!this.audio) return;

    // Check if setSinkId is available (Chromium feature)
    const audioElement = this.audio as HTMLAudioElement & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };

    if (typeof audioElement.setSinkId === 'function') {
      try {
        await audioElement.setSinkId(deviceId);
        this.log(`Audio output set to device: ${deviceId}`);
      } catch (err) {
        this.log(`Failed to set audio device: ${err}`);
        console.error('setSinkId error:', err);
      }
    } else {
      this.log('setSinkId not supported in this browser');
    }
  }

  /**
   * Play the notification sound.
   */
  play(): void {
    if (!this.enabled || !this.audio) {
      return;
    }

    this.log('Playing notification sound');

    // Reset to start if already playing
    this.audio.currentTime = 0;
    this.audio.play().catch((err) => {
      this.log(`Failed to play sound: ${err.message}`);
    });
  }

  /**
   * Update volume level.
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(100, volume)) / 100;
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * Enable or disable sound.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log diagnostic messages.
   */
  private log(message: string): void {
    if (this.diagnostics) {
      console.info(`[NotificationSound] ${message}`);
    }
  }
}

// Expose to window for use in HTML script
(window as any).NotificationSound = NotificationSound;
