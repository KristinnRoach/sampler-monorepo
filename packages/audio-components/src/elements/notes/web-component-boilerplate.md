# Web Component Boilerplate Template

## Basic Custom Element Structure (TypeScript)

```typescript
// base-audio-element.ts
export abstract class BaseAudioElement extends HTMLElement {
  protected audioContext: AudioContext | null = null;
  protected outputNode: AudioNode | null = null;
  protected initialized: boolean = false;

  // Connect this audio element to another audio element or node
  connect(destination: BaseAudioElement | AudioNode): AudioNode | null {
    if (!this.outputNode || !this.initialized) {
      console.warn('Cannot connect - output node not initialized');
      return null;
    }

    if (destination instanceof BaseAudioElement) {
      // Connect to another audio element
      if (destination.getInputNode()) {
        this.outputNode.connect(destination.getInputNode()!);
        return destination.getInputNode();
      }
      return null;
    } else {
      // Connect directly to an AudioNode
      this.outputNode.connect(destination);
      return destination;
    }
  }

  // Disconnect this audio element
  disconnect(): void {
    if (this.outputNode) {
      this.outputNode.disconnect();
    }
  }

  // Get the input node for connections
  getInputNode(): AudioNode | null {
    return this.outputNode;
  }

  // Clean up resources
  dispose(): void {
    if (this.outputNode) {
      this.outputNode.disconnect();
      this.outputNode = null;
    }
    this.initialized = false;
  }
}

// sample-player-element.ts
import { BaseAudioElement } from './base-audio-element';
import { audiolib, SamplePlayer } from '@repo/audiolib';

export class SamplePlayerElement extends BaseAudioElement {
  private player: SamplePlayer | null = null;
  
  // Observed attributes that will trigger attributeChangedCallback
  static get observedAttributes(): string[] {
    return ['attack', 'release', 'loop', 'hold-enabled'];
  }
  
  constructor() {
    super();
    
    // Create shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
    
    // Initialize the shadow DOM with minimal structure
    // Focus on functionality, let consuming app handle styling
    this.shadowRoot!.innerHTML = `
      <div part="container" class="sample-player">
        <div part="controls" class="controls">
          <button part="init-button" id="init">Initialize</button>
          <button part="load-button" id="load" disabled>Load Sample</button>
        </div>
        <div part="parameters" class="parameters">
          <label part="attack-label">
            Attack: <input part="attack-input" type="range" min="0" max="1" step="0.01" value="0.01" id="attack" disabled>
            <span part="attack-value" id="attack-value">0.01</span>s
          </label>
          <label part="release-label">
            Release: <input part="release-input" type="range" min="0" max="2" step="0.01" value="0.3" id="release" disabled>
            <span part="release-value" id="release-value">0.3</span>s
          </label>
          <label part="hold-label">
            <input part="hold-input" type="checkbox" id="hold-enabled" disabled> Hold
          </label>
        </div>
        <div part="status" id="status">Not initialized</div>
        <slot></slot>
      </div>
    `;
  }
  
  // Lifecycle: When element is added to the DOM
  connectedCallback(): void {
    // Set up event listeners
    const initButton = this.shadowRoot!.getElementById('init');
    const loadButton = this.shadowRoot!.getElementById('load');
    const attackSlider = this.shadowRoot!.getElementById('attack') as HTMLInputElement;
    const releaseSlider = this.shadowRoot!.getElementById('release') as HTMLInputElement;
    const holdCheckbox = this.shadowRoot!.getElementById('hold-enabled') as HTMLInputElement;

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
        const valueDisplay = this.shadowRoot!.getElementById('attack-value');
        if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
      });
    }

    if (releaseSlider) {
      releaseSlider.addEventListener('input', () => {
        const value = parseFloat(releaseSlider.value);
        this.setRelease(value);
        const valueDisplay = this.shadowRoot!.getElementById('release-value');
        if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
      });
    }

    if (holdCheckbox) {
      holdCheckbox.addEventListener('change', () => {
        this.setHoldEnabled(holdCheckbox.checked);
      });
    }

    // Auto-initialize if attribute is set
    if (this.hasAttribute('auto-init') && this.getAttribute('auto-init') === 'true') {
      this.initialize();
    }
  }
  
  // Lifecycle: When element is removed from the DOM
  disconnectedCallback(): void {
    this.dispose();
  }
  
  // Lifecycle: When attributes change
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'attack':
        const attack = parseFloat(newValue);
        this.setAttack(attack);
        break;
      case 'release':
        const release = parseFloat(newValue);
        this.setRelease(release);
        break;
      case 'loop':
        const loop = newValue === 'true';
        this.setLoop(loop);
        break;
      case 'hold-enabled':
        const holdEnabled = newValue === 'true';
        this.setHoldEnabled(holdEnabled);
        break;
    }
  }
  
  // Initialize the sample player
  async initialize(): Promise<void> {
    try {
      // Initialize audiolib
      await audiolib.init();

      // Create sample player
      this.player = audiolib.createSamplePlayer();

      if (this.player) {
        // Set up audio nodes
        this.outputNode = this.player as unknown as AudioNode;
        this.audioContext = audiolib.audioContext;
        this.initialized = true;

        // Update UI
        this.updateStatus('Initialized. Please load a sample.');
        this.enableControls();

        // Dispatch event
        this.dispatchEvent(
          new CustomEvent('player-initialized', {
            bubbles: true,
            detail: { player: this.player },
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

        if (this.hasAttribute('loop')) {
          this.setLoop(this.getAttribute('loop') === 'true');
        }
      }
    } catch (error) {
      console.error('Failed to initialize sample player:', error);
      this.updateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Load a sample
  async loadSample(): Promise<void> {
    if (!this.player || !this.audioContext) {
      this.updateStatus('Error: Player not initialized');
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
            const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

            // Load sample into player
            await this.player!.loadSample(audioBuffer);

            this.updateStatus(`Sample loaded: ${file.name}`);

            // Dispatch event
            this.dispatchEvent(
              new CustomEvent('sample-loaded', {
                bubbles: true,
                detail: {
                  player: this.player,
                  fileName: file.name,
                  duration: audioBuffer.duration,
                },
              })
            );
          } catch (error) {
            console.error('Failed to load sample:', error);
            this.updateStatus(`Error loading sample: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      };

      // Trigger file selection
      fileInput.click();
    } catch (error) {
      console.error('Failed to load sample:', error);
      this.updateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Play methods
  play(note: number, velocity: number = 0.8): void {
    if (!this.player) {
      console.warn('Cannot play - player not initialized');
      return;
    }
    this.player.play(note, velocity);
  }
  
  release(note: number): void {
    if (!this.player) {
      console.warn('Cannot release - player not initialized');
      return;
    }
    this.player.release(note);
  }
  
  // Parameter setters
  setAttack(value: number): void {
    if (!this.player) return;
    
    // Update visual state without triggering attributeChangedCallback
    const attackSlider = this.shadowRoot!.getElementById('attack') as HTMLInputElement;
    const valueDisplay = this.shadowRoot!.getElementById('attack-value');
    
    if (attackSlider) attackSlider.value = value.toString();
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
    
    // Set value on player
    this.player.setAttackTime(value);
  }
  
  setRelease(value: number): void {
    if (!this.player) return;
    
    // Update visual state without triggering attributeChangedCallback
    const releaseSlider = this.shadowRoot!.getElementById('release') as HTMLInputElement;
    const valueDisplay = this.shadowRoot!.getElementById('release-value');
    
    if (releaseSlider) releaseSlider.value = value.toString();
    if (valueDisplay) valueDisplay.textContent = value.toFixed(2);
    
    // Set value on player
    this.player.setReleaseTime(value);
  }
  
  setHoldEnabled(enabled: boolean): void {
    if (!this.player) return;
    
    // Update visual state
    const holdCheckbox = this.shadowRoot!.getElementById('hold-enabled') as HTMLInputElement;
    if (holdCheckbox) holdCheckbox.checked = enabled;
    
    // Set value on player
    this.player.setHoldEnabled(enabled);
  }
  
  setLoop(enabled: boolean): void {
    if (!this.player) return;
    this.player.setLoop(enabled);
  }
  
  // Helper methods
  private updateStatus(message: string): void {
    const statusElement = this.shadowRoot!.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
  
  private enableControls(): void {
    const loadButton = this.shadowRoot!.getElementById('load');
    const attackSlider = this.shadowRoot!.getElementById('attack') as HTMLInputElement;
    const releaseSlider = this.shadowRoot!.getElementById('release') as HTMLInputElement;
    const holdCheckbox = this.shadowRoot!.getElementById('hold-enabled') as HTMLInputElement;

    if (loadButton) loadButton.removeAttribute('disabled');
    if (attackSlider) attackSlider.removeAttribute('disabled');
    if (releaseSlider) releaseSlider.removeAttribute('disabled');
    if (holdCheckbox) holdCheckbox.removeAttribute('disabled');
  }
  
  // Getters for public API
  get isInitialized(): boolean {
    return this.initialized;
  }
  
  get hasLoadedSample(): boolean {
    return this.player?.hasLoadedSample() || false;
  }
  
  // Override from base class
  override dispose(): void {
    super.dispose();
    
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
  }
}

// Register the custom element
customElements.define('audio-sample-player', SamplePlayerElement);
```

## Simple Component Registration File

```javascript
// index.js - Register all components
import { SamplePlayerElement } from './components/sample-player-element.js';
import { RecorderElement } from './components/recorder-element.js';
import { MasterOutBusElement } from './components/master-out-bus-element.js';

// Register all custom elements
customElements.define('audio-sample-player', SamplePlayerElement);
customElements.define('audio-recorder', RecorderElement);
customElements.define('audio-master-out', MasterOutBusElement);

// Export for direct access
export {
  SamplePlayerElement,
  RecorderElement,
  MasterOutBusElement
};
```

## Usage Example

```html
<!-- Example usage in HTML -->
<audio-sample-player gain="0.8" enabled="true">
  <!-- Slots can be used for nested content -->
</audio-sample-player>

<script>
  // Connect components
  const player = document.querySelector('audio-sample-player');
  const master = document.querySelector('audio-master-out');
  
  // Connect audio nodes
  player.connect(master);
  
  // Access component API
  player.updateGain(0.5);
</script>
```
