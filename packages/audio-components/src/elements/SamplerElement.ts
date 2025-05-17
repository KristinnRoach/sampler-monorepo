import { BaseAudioElement } from '../base/BaseAudioElement';
import { audiolib, SamplePlayer } from '@repo/audiolib';

/**
 * Web component for a sample player instrument
 * Wraps the SamplePlayer class from audiolib
 */
export class SamplerElement extends BaseAudioElement {
  private samplePlayer: SamplePlayer | null = null;

  // Define observed attributes
  static get observedAttributes(): string[] {
    return ['polyphony', 'attack', 'release', 'hold-enabled'];
  }

  constructor() {
    super('sample-player');

    // Create basic UI template, using the light DOM
    this.innerHTML = `
      <div class="sampler-element">
        <div class="controls">
          <button class="init-button" id="init">Initialize</button>
          <button class="load-button" id="load" disabled>Load Sample</button>
        </div>
        <div class="parameters">
          <label>
            Attack: <input type="range" min="0" max="1" step="0.01" value="0.01" id="attack" disabled>
            <span id="attack-value">0.01</span>s
          </label>
          <label>
            Release: <input type="range" min="0" max="2" step="0.01" value="0.3" id="release" disabled>
            <span id="release-value">0.3</span>s
          </label>
          <label>
            <input type="checkbox" id="hold-enabled" disabled> Hold Enabled
          </label>
        </div>
        <div class="status" id="status">Not initialized</div>
      </div> 
    `;
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    // Set up event listeners
    const initButton = this.querySelector('#init');
    const loadButton = this.querySelector('#load');
    const attackSlider = this.querySelector('#attack') as HTMLInputElement;
    const releaseSlider = this.querySelector('#release') as HTMLInputElement;
    const holdCheckbox = this.querySelector(
      '#hold-enabled'
    ) as HTMLInputElement;

    if (initButton) {
      initButton.addEventListener('click', this.initialize.bind(this));
    }

    if (loadButton) {
      loadButton.addEventListener('click', this.loadSample.bind(this));
    }

    if (attackSlider) {
      attackSlider.addEventListener('input', () => {
        const value = parseFloat(attackSlider.value);
        this.setAttack(value);
        const valueDisplay = this.querySelector('#attack-value');
        if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
      });
    }

    if (releaseSlider) {
      releaseSlider.addEventListener('input', () => {
        const value = parseFloat(releaseSlider.value);
        this.setRelease(value);
        const valueDisplay = this.querySelector('#release-value');
        if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
      });
    }

    if (holdCheckbox) {
      holdCheckbox.addEventListener('change', () => {
        this.setHoldEnabled(holdCheckbox.checked);
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

    if (name === 'polyphony' && this.samplePlayer) {
      // Can't change polyphony after initialization
      console.warn('Cannot change polyphony after initialization');
    }

    if (name === 'attack' && this.samplePlayer) {
      const attack = parseFloat(newValue);
      this.setAttack(attack);

      const attackSlider = this.querySelector('#attack') as HTMLInputElement;
      if (attackSlider) attackSlider.value = newValue;

      const valueDisplay = this.querySelector('#attack-value');
      if (valueDisplay) valueDisplay.textContent = attack.toFixed(2);
    }

    if (name === 'release' && this.samplePlayer) {
      const release = parseFloat(newValue);
      this.setRelease(release);

      const releaseSlider = this.querySelector('#release') as HTMLInputElement;
      if (releaseSlider) releaseSlider.value = newValue;

      const valueDisplay = this.querySelector('#release-value');
      if (valueDisplay) valueDisplay.textContent = release.toFixed(2);
    }

    if (name === 'hold-enabled' && this.samplePlayer) {
      const holdEnabled = newValue === 'true';
      this.setHoldEnabled(holdEnabled);

      const holdCheckbox = this.querySelector(
        '#hold-enabled'
      ) as HTMLInputElement;
      if (holdCheckbox) holdCheckbox.checked = holdEnabled;
    }
  }

  /**
   * Initialize the sampler
   */
  async initialize(): Promise<void> {
    try {
      // Initialize audiolib
      await audiolib.init();

      // Get polyphony from attribute or use default
      const polyphony = parseInt(this.getAttribute('polyphony') || '16');

      // Create sampler
      this.samplePlayer = audiolib.createSamplePlayer(undefined, polyphony);

      if (this.samplePlayer) {
        // Set up audio nodes
        this.outputNode = this.samplePlayer as unknown as AudioNode;
        this.audioContext = audiolib.audioContext;
        this.initialized = true;

        // TEST
        this.samplePlayer.enableKeyboard();

        // Update UI
        this.updateStatus('Initialized. Please load a sample.');
        this.enableControls();

        // Dispatch event
        this.dispatchEvent(
          new CustomEvent('sampleplayer-initialized', {
            bubbles: true,
            detail: { sampler: this.samplePlayer },
          })
        );

        // Apply initial attributes
        if (this.hasAttribute('attack')) {
          this.setAttack(parseFloat(this.getAttribute('attack') || '0.01'));
        }

        if (this.hasAttribute('release')) {
          this.setRelease(parseFloat(this.getAttribute('release') || '0.3'));
        }

        if (this.hasAttribute('hold-enabled')) {
          this.setHoldEnabled(this.getAttribute('hold-enabled') === 'true');
        }
      }
    } catch (error) {
      console.error('Failed to initialize sampler:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load a sample into the sampler
   */
  async loadSample(): Promise<void> {
    if (!this.samplePlayer || !this.audioContext) {
      this.updateStatus('Error: Sampler not initialized');
      return;
    }

    try {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';

      fileInput.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (files && files.length > 0) {
          const file = files[0];
          this.updateStatus(`Loading sample: ${file.name}...`);

          try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio data
            const audioBuffer =
              await this.audioContext!.decodeAudioData(arrayBuffer);

            // Load sample into sampler
            await this.samplePlayer!.loadSample(audioBuffer);

            this.updateStatus(`Sample loaded: ${file.name}`);

            // Dispatch event
            this.dispatchEvent(
              new CustomEvent('sample-loaded', {
                bubbles: true,
                detail: {
                  sampler: this.samplePlayer,
                  fileName: file.name,
                  duration: audioBuffer.duration,
                },
              })
            );
          } catch (error) {
            console.error('Failed to load sample:', error);
            this.updateStatus(
              `Error loading sample: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      };

      // Trigger file selection
      fileInput.click();
    } catch (error) {
      console.error('Failed to load sample:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Play a note
   */
  playNote(midiNote: number, velocity: number = 0.8): void {
    if (!this.samplePlayer) {
      console.warn('Cannot play note - sample player not initialized');
      return;
    }

    this.samplePlayer.play(midiNote, velocity, { caps: false });
  }

  /**
   * Stop a note
   */
  stopNote(midiNote: number): void {
    if (!this.samplePlayer) {
      console.warn('Cannot stop note - sampler not initialized');
      return;
    }

    this.samplePlayer.release(midiNote, { caps: false });
  }

  /**
   * Set attack time
   */
  setAttack(value: number): void {
    if (!this.samplePlayer) return;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('attack') !== value.toString()) {
      this.setAttribute('attack', value.toString());
    }

    // Set attack time on sampler
    this.samplePlayer.setAttackTime(value); // using seconds for now
  }

  /**
   * Set release time
   */
  setRelease(value: number): void {
    if (!this.samplePlayer) return;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('release') !== value.toString()) {
      this.setAttribute('release', value.toString());
    }

    // Set release time on sampler
    this.samplePlayer.setReleaseTime(value); // using seconds for now
  }

  /**
   * Set hold enabled
   */
  setHoldEnabled(enabled: boolean): void {
    if (!this.samplePlayer) return;

    // Update attribute silently to avoid infinite loop
    if (this.getAttribute('hold-enabled') !== enabled.toString()) {
      this.setAttribute('hold-enabled', enabled.toString());
    }
    this.samplePlayer.setHoldEnabled(enabled);
  }

  /**
   * Update status message
   */
  private updateStatus(message: string): void {
    const statusElement = this.querySelector('#status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  /**
   * Enable controls after initialization
   */
  private enableControls(): void {
    const loadButton = this.querySelector('#load');
    const attackSlider = this.querySelector('#attack') as HTMLInputElement;
    const releaseSlider = this.querySelector('#release') as HTMLInputElement;
    const holdCheckbox = this.querySelector(
      '#hold-enabled'
    ) as HTMLInputElement;

    if (loadButton) loadButton.removeAttribute('disabled');
    if (attackSlider) attackSlider.removeAttribute('disabled');
    if (releaseSlider) releaseSlider.removeAttribute('disabled');
    if (holdCheckbox) holdCheckbox.removeAttribute('disabled');
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();

    if (this.samplePlayer) {
      this.samplePlayer.dispose();
      this.samplePlayer = null;
    }

    this.outputNode = null;
    this.audioContext = null;
  }
}

/*
        <slot></slot>


     <style>
        .sampler-element {
          display: block;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          color
          background-color: #2c2d2e;
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
        button.init-button {
          background: #4CAF50;
          color: white;
        }
        button.load-button {
          background: #2196F3;
          color: white;
        }
      </style>
      */
