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
  private audio: HTMLAudioElement | null = null;
  private diagnostics: boolean;

  constructor(options: NotificationSoundOptions) {
    this.enabled = options.enabled;
    this.volume = Math.max(0, Math.min(100, options.volume)) / 100;
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
