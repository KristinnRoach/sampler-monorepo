// SamplerElement.ts
import { Sampler } from '../instruments/Sampler';
import { audiolib } from '../index';
import { registry } from '../store/state/worklet-registry/ProcessorRegistry';

export class SamplerElement extends HTMLElement {
  private sampler: Sampler | null = null;
  private isInitialized = false;
  private audioInitButton: HTMLButtonElement;
  private loadSampleButton: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private statusDisplay: HTMLDivElement;
  private loopToggle: HTMLInputElement;

  static get observedAttributes() {
    return ['polyphony', 'loop-enabled', 'volume'];
  }

  constructor() {
    super();

    // Create shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    // Create basic structure
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
        }
        
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .status {
          margin-top: 10px;
          font-size: 0.9em;
        }
        
        /* Minimal styling - consuming apps can style using ::part() */
        ::part(button) {
          padding: 8px 12px;
        }
        
        ::part(toggle) {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      </style>
      
      <div class="controls">
        <button part="button init-button">Initialize Audio</button>
        <button part="button load-button" disabled>Load Sample</button>
        <input type="file" accept="audio/*" part="file-input" disabled>
        <label part="toggle">
          <input type="checkbox" disabled>
          <span>Loop</span>
        </label>
      </div>
      
      <slot></slot>
      
      <div class="status" part="status">Ready to initialize</div>
    `;

    // Get references to elements
    this.audioInitButton = shadow.querySelector('button[part~="init-button"]')!;
    this.loadSampleButton = shadow.querySelector(
      'button[part~="load-button"]'
    )!;
    this.fileInput = shadow.querySelector('input[type="file"]')!;
    this.loopToggle = shadow.querySelector('input[type="checkbox"]')!;
    this.statusDisplay = shadow.querySelector('.status')!;

    // Add event listeners
    this.audioInitButton.addEventListener('click', () => this.initAudio());
    this.loadSampleButton.addEventListener('click', () =>
      this.loadDefaultSample()
    );
    this.fileInput.addEventListener('change', (e) =>
      this.handleFileSelect(e as Event)
    );
    this.loopToggle.addEventListener('change', () => this.toggleLoop());
  }

  async connectedCallback() {
    await registry.registerDefaultProcessors();

    // Initialize with attribute values
    const polyphony = parseInt(this.getAttribute('polyphony') || '16', 10);
    const loopEnabled = this.hasAttribute('loop-enabled');
    // Set initial state based on attributes
    if (loopEnabled) {
      this.loopToggle.checked = true;
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (!this.sampler) return;

    switch (name) {
      case 'polyphony':
        // Can't change polyphony after creation, would need to reinitialize
        break;
      case 'loop-enabled':
        const loopEnabled = this.hasAttribute('loop-enabled');
        this.loopToggle.checked = loopEnabled;
        this.sampler.setLoopEnabled(loopEnabled);
        break;
      case 'volume':
        // Would need to be implemented in your Sampler class
        // this.sampler.setVolume(parseFloat(newValue));
        break;
    }
  }

  async initAudio() {
    try {
      await audiolib.init();
      const ctx = await audiolib.ensureAudioCtx();

      // Get polyphony from attribute or default
      const polyphony = parseInt(this.getAttribute('polyphony') || '16', 10);

      this.sampler = audiolib.createSampler(undefined, polyphony);

      if (!this.sampler) {
        throw new Error('Failed to create sampler');
      }

      this.isInitialized = true;
      this.statusDisplay.textContent = 'Audio initialized';
      this.loadSampleButton.disabled = false;
      this.fileInput.disabled = false;
      this.loopToggle.disabled = false;

      // Dispatch event
      this.dispatchEvent(
        new CustomEvent('sampler-initialized', {
          bubbles: true,
          composed: true,
          detail: { sampler: this.sampler },
        })
      );
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      this.statusDisplay.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async loadDefaultSample() {
    if (!this.isInitialized || !this.sampler) {
      this.statusDisplay.textContent = 'Please initialize audio first';
      return;
    }

    try {
      const response = await fetch('/audio-samples/init_sample.wav');
      if (!response.ok) {
        throw new Error(`Failed to fetch sample: ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], 'default_sample.wav', {
        type: 'audio/wav',
      });
      await this.loadSample(file);
    } catch (error) {
      console.error('Failed to load default sample:', error);
      this.statusDisplay.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      await this.loadSample(file);
    }
  }

  async loadSample(file: File) {
    if (!this.isInitialized || !this.sampler) {
      this.statusDisplay.textContent = 'Please initialize audio first';
      return;
    }

    try {
      const ctx = await audiolib.ensureAudioCtx();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      this.sampler.loadSample(audioBuffer);
      this.statusDisplay.textContent = `Sample loaded: ${file.name}`;

      // Dispatch event
      this.dispatchEvent(
        new CustomEvent('sample-loaded', {
          bubbles: true,
          composed: true,
          detail: {
            sampler: this.sampler,
            filename: file.name,
            duration: audioBuffer.duration,
          },
        })
      );
    } catch (error) {
      console.error('Failed to load sample:', error);
      this.statusDisplay.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  toggleLoop() {
    if (!this.sampler) return;

    const loopEnabled = this.loopToggle.checked;
    this.sampler.setLoopEnabled(loopEnabled);

    // Update attribute to match internal state
    if (loopEnabled) {
      this.setAttribute('loop-enabled', '');
    } else {
      this.removeAttribute('loop-enabled');
    }

    // Dispatch event
    this.dispatchEvent(
      new CustomEvent('loop-changed', {
        bubbles: true,
        composed: true,
        detail: { loopEnabled },
      })
    );
  }

  // Public API methods that mirror the Sampler class

  playNote(midiNote: number, velocity: number = 1) {
    if (!this.sampler) return;
    this.sampler.play(midiNote, velocity);

    this.dispatchEvent(
      new CustomEvent('note-on', {
        bubbles: true,
        composed: true,
        detail: { note: midiNote, velocity },
      })
    );
  }

  stopNote(midiNote: number) {
    if (!this.sampler) return;
    this.sampler.release(midiNote);

    this.dispatchEvent(
      new CustomEvent('note-off', {
        bubbles: true,
        composed: true,
        detail: { note: midiNote },
      })
    );
  }

  stopAll() {
    if (!this.sampler) return;
    this.sampler.stopAll();

    this.dispatchEvent(
      new CustomEvent('all-notes-off', {
        bubbles: true,
        composed: true,
      })
    );
  }

  setLoopStart(value: number, rampTime?: number) {
    if (!this.sampler) return;
    this.sampler.setLoopStart(value, rampTime);
  }

  setLoopEnd(value: number, rampTime?: number) {
    if (!this.sampler) return;
    this.sampler.setLoopEnd(value, rampTime);
  }

  // Getters to expose Sampler properties
  get isPlaying() {
    return this.sampler?.isPlaying || false;
  }

  get isLooping() {
    return this.sampler?.isLooping || false;
  }

  get sampleDuration() {
    return this.sampler?.sampleDuration || 0;
  }

  get activeNotesCount() {
    return this.sampler?.activeNotesCount || 0;
  }

  // Method to access the underlying Sampler
  getSampler() {
    return this.sampler;
  }
}

// Register the custom element
customElements.define('sampler-element', SamplerElement);

// Add to global declarations
declare global {
  interface HTMLElementTagNameMap {
    'sampler-element': SamplerElement;
  }
}
