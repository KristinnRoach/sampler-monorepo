import { BaseAudioElement } from './base/BaseAudioElement';
import { audiolib } from '@repo/audiolib';

/**
 * Web component for audio output
 * Connects to the audio context destination
 */
export class OutputElement extends BaseAudioElement {
  private gainNode: GainNode | null = null;
  private shadow: ShadowRoot;

  // Define observed attributes
  static get observedAttributes(): string[] {
    return ['volume'];
  }

  constructor() {
    super('output');

    // Create shadow DOM
    this.shadow = this.attachShadow({ mode: 'open' });

    // Create basic UI template
    this.shadow.innerHTML = `
      <div class="output-element">
        <div class="controls">
          <button part="button init-button" id="init">Initialize</button>
        </div>
        <div class="parameters">
          <label>
            Volume: <input type="range" min="0" max="1" step="0.01" value="0.5" id="volume" disabled>
            <span id="volume-value">0.5</span>
          </label>
        </div>
        <div class="status" id="status">Not initialized</div>

    `;
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    // Set up event listeners
    const initButton = this.shadow.getElementById('init');
    const volumeSlider = this.shadow.getElementById(
      'volume'
    ) as HTMLInputElement;

    if (initButton) {
      initButton.addEventListener('click', this.initialize.bind(this));
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        const value = parseFloat(volumeSlider.value);
        this.setVolume(value);
        const valueDisplay = this.shadow.getElementById('volume-value');
        if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
      });
    }

    // Initialize from attributes
    if (
      this.hasAttribute('auto-init') &&
      this.getAttribute('auto-init') === 'true'
    ) {
      this.initialize();
    }
  }

  /**
   * Called when an observed attribute changes
   */
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (oldValue === newValue) return;

    if (name === 'volume' && this.gainNode) {
      const volume = parseFloat(newValue);
      this.setVolume(volume);

      const volumeSlider = this.shadow.getElementById(
        'volume'
      ) as HTMLInputElement;
      if (volumeSlider) volumeSlider.value = newValue;

      const valueDisplay = this.shadow.getElementById('volume-value');
      if (valueDisplay) valueDisplay.textContent = volume.toFixed(2);
    }
  }

  /**
   * Initialize the output
   */
  async initialize(): Promise<void> {
    try {
      // Initialize audiolib if needed
      await audiolib.init();

      // Get audio context
      this.audioContext = audiolib.audioContext;

      if (!this.audioContext) {
        throw new Error('Failed to get audio context');
      }

      // Create gain node
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = parseFloat(
        this.getAttribute('volume') || '0.5'
      );

      // Connect to destination
      this.gainNode.connect(this.audioContext.destination);

      // Set up audio nodes
      this.inputNode = this.gainNode;
      this.outputNode = null; // Output element doesn't have an output
      this.initialized = true;

      // Update UI
      this.updateStatus('Initialized. Ready for input.');
      this.enableControls();

      // Dispatch event
      this.dispatchEvent(
        new CustomEvent('output-initialized', {
          bubbles: true,
          detail: { output: this },
        })
      );

      // Apply initial volume
      if (this.hasAttribute('volume')) {
        this.setVolume(parseFloat(this.getAttribute('volume') || '0.5'));
      }
    } catch (error) {
      console.error('Failed to initialize output:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set volume
   */
  setVolume(value: number): void {
    if (!this.gainNode) return;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('volume') !== value.toString()) {
      this.setAttribute('volume', value.toString());
    }

    // Set gain value
    this.gainNode.gain.setValueAtTime(
      value,
      this.audioContext?.currentTime || 0
    );
  }

  /**
   * Update status message
   */
  private updateStatus(message: string): void {
    const statusElement = this.shadow.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  /**
   * Enable controls after initialization
   */
  private enableControls(): void {
    const volumeSlider = this.shadow.getElementById(
      'volume'
    ) as HTMLInputElement;
    if (volumeSlider) volumeSlider.removeAttribute('disabled');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    this.inputNode = null;
    this.audioContext = null;
  }
}

/*

        <slot></slot>
      </div>
      <style>
        .output-element {
          display: block;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #f5f5f5;
          font-family: system-ui, sans-serif;
        }
        .controls {
          margin-bottom: 1rem;
        }
        .parameters {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .parameters label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .status {
          padding: 0.5rem;
          background: #eee;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        button {
          padding: 0.5rem 1rem;
          margin-right: 0.5rem;
          border: none;
          border-radius: 4px;
          background: #ddd;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        button[part="init-button"] {
          background: #4CAF50;
          color: white;
        }
      </style>
      */
