## Minimal Web Audio Components Structure (TypeScript)

```typescript
// Here's a simplified, complete SamplePlayerElement example
import { BaseAudioElement } from './base-audio-element';
import { audiolib, SamplePlayer } from '@repo/audiolib';
import { AudioContextManager } from './audio-context-manager';

export class SamplePlayerElement extends BaseAudioElement {
  // Properties
  private player: SamplePlayer | null = null;
  
  // Observed attributes
  static get observedAttributes(): string[] {
    return ['gain', 'attack', 'release', 'loop'];
  }
  
  constructor() {
    super();
    
    // Create shadow DOM with bare minimum structure
    this.attachShadow({ mode: 'open' });
    
    // Set up minimal HTML structure with elements the component needs
    // Focus on functionality over appearance
    this.shadowRoot!.innerHTML = `
      <div part="container">
        <div part="controls">
          <button part="init-button" id="init">Initialize</button>
          <button part="load-button" id="load" disabled>Load</button>
          <button part="play-button" id="play" disabled>Play</button>
          <button part="stop-button" id="stop" disabled>Stop</button>
        </div>
        
        <div part="parameters">
          <!-- Parameters will be dynamically added -->
        </div>
        
        <div part="status" id="status">Not initialized</div>
        <slot></slot>
      </div>
    `;
    
    // Bind methods to maintain correct 'this' context
    this.initialize = this.initialize.bind(this);
    this.loadSample = this.loadSample.bind(this);
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
  }
  
  // Lifecycle methods
  connectedCallback(): void {
    // Set up event listeners
    const initButton = this.shadowRoot!.getElementById('init');
    const loadButton = this.shadowRoot!.getElementById('load');
    const playButton = this.shadowRoot!.getElementById('play');
    const stopButton = this.shadowRoot!.getElementById('stop');
    
    if (initButton) initButton.addEventListener('click', this.initialize);
    if (loadButton) loadButton.addEventListener('click', this.loadSample);
    if (playButton) playButton.addEventListener('click', this.play);
    if (stopButton) stopButton.addEventListener('click', this.stop);
    
    // Auto-initialize if needed
    if (this.hasAttribute('auto-init') && this.getAttribute('auto-init') === 'true') {
      this.initialize();
    }
  }
  
  disconnectedCallback(): void {
    // Clean up everything
    this.dispose();
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue || !this.player) return;
    
    // Handle attribute changes
    switch (name) {
      case 'gain':
        this.setGain(parseFloat(newValue));
        break;
      case 'attack':
        this.setAttack(parseFloat(newValue));
        break;
      case 'release':
        this.setRelease(parseFloat(newValue));
        break;
      case 'loop':
        this.setLoop(newValue === 'true');
        break;
    }
  }
  
  // Core functionality methods
  async initialize(): Promise<void> {
    try {
      await audiolib.init();
      this.player = audiolib.createSamplePlayer();
      
      if (this.player) {
        this.outputNode = this.player as unknown as AudioNode;
        this.audioContext = audiolib.audioContext;
        this.initialized = true;
        
        // Create parameter controls
        this.createParameterControls();
        
        // Update UI
        this.updateStatus('Initialized. Please load a sample.');
        this.enableControls(['load']);
        
        // Apply initial attributes
        this.applyInitialAttributes();
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('initialized', {
          bubbles: true,
          detail: { player: this.player }
        }));
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.updateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async loadSample(): Promise<void> {
    if (!this.initialized || !this.player) {
      this.updateStatus('Error: Player not initialized');
      return;
    }
    
    // Create file input programmatically
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        try {
          this.updateStatus(`Loading: ${file.name}...`);
          
          // Load the file
          const arrayBuffer = await file.arrayBuffer();
          const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
          
          // Send to audio node
          await this.player!.loadSample(audioBuffer);
          
          // Update UI
          this.updateStatus(`Loaded: ${file.name}`);
          this.enableControls(['play', 'stop']);
          
          // Event
          this.dispatchEvent(new CustomEvent('sample-loaded', {
            bubbles: true,
            detail: {
              player: this.player,
              fileName: file.name,
              duration: audioBuffer.duration
            }
          }));
        } catch (error) {
          console.error('Failed to load sample:', error);
          this.updateStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };
    
    fileInput.click();
  }
  
  // Playback control methods
  play(note: number = 60, velocity: number = 0.8): void {
    if (!this.initialized || !this.player) return;
    
    new AudioContextManager().resume().then(() => {
      this.player!.play(note, velocity);
      
      // Update UI
      const playButton = this.shadowRoot!.getElementById('play') as HTMLButtonElement;
      if (playButton) {
        playButton.textContent = 'Pause';
        playButton.dataset.state = 'playing';
      }
      
      // Event
      this.dispatchEvent(new CustomEvent('playstart', {
        bubbles: true,
        detail: { startTime: this.audioContext?.currentTime }
      }));
    });
  }
  
  stop(): void {
    if (!this.initialized || !this.player) return;
    
    this.player.stop();
    
    // Update UI
    const playButton = this.shadowRoot!.getElementById('play') as HTMLButtonElement;
    if (playButton) {
      playButton.textContent = 'Play';
      playButton.dataset.state = 'stopped';
    }
    
    // Event
    this.dispatchEvent(new CustomEvent('playstop', {
      bubbles: true
    }));
  }
  
  // Parameter methods
  setGain(value: number): void {
    if (!this.player) return;
    this.player.setGain(value);
  }
  
  setAttack(value: number): void {
    if (!this.player) return;
    this.player.setAttackTime(value);
  }
  
  setRelease(value: number): void {
    if (!this.player) return;
    this.player.setReleaseTime(value);
  }
  
  setLoop(enabled: boolean): void {
    if (!this.player) return;
    this.player.setLoop(enabled);
  }
  
  // Helper methods
  private updateStatus(message: string): void {
    const statusElement = this.shadowRoot!.getElementById('status');
    if (statusElement) statusElement.textContent = message;
  }
  
  private enableControls(controls: string[]): void {
    const allControls = ['load', 'play', 'stop'];
    
    allControls.forEach(control => {
      const element = this.shadowRoot!.getElementById(control);
      if (element) {
        if (controls.includes(control)) {
          element.removeAttribute('disabled');
        } else {
          element.setAttribute('disabled', '');
        }
      }
    });
  }
  
  private createParameterControls(): void {
    // Define parameters
    interface ParameterDefinition {
      id: string;
      name: string;
      min: number;
      max: number;
      step: number;
      defaultValue: number;
      attribute: string;
      setter: (value: number) => void;
    }
    
    const parameters: ParameterDefinition[] = [
      {
        id: 'gain-control',
        name: 'Gain',
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.8,
        attribute: 'gain',
        setter: this.setGain.bind(this)
      },
      {
        id: 'attack-control',
        name: 'Attack',
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.01,
        attribute: 'attack',
        setter: this.setAttack.bind(this)
      },
      {
        id: 'release-control',
        name: 'Release',
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: ## Parameter Sliders for Audio Controls (TypeScript)

```typescript
// Add this inside your component's shadowRoot template
const sliderTemplate = `
  <div part="parameter-group" class="parameter-group">
    <label part="param-label" for="gain-slider">Gain</label>
    <input 
      part="slider"
      type="range" 
      id="gain-slider" 
      name="gain" 
      min="0" 
      max="1" 
      step="0.01" 
      value="0.8" 
    />
    <span part="value-display" class="value-display">0.8</span>
  </div>
`;

// Add this to your component class
interface ParameterChangeDetail {
  param: string;
  value: number;
}

interface ParameterDefinition {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatter?: (value: number) => string;
}

// Method to create parameter controls
private createParameterControl(param: ParameterDefinition): HTMLElement {
  const container = document.createElement('div');
  container.setAttribute('part', 'parameter-group');
  container.classList.add('parameter-group');
  
  const label = document.createElement('label');
  label.setAttribute('part', 'param-label');
  label.setAttribute('for', param.id);
  label.textContent = param.name;
  
  const slider = document.createElement('input');
  slider.setAttribute('part', 'slider');
  slider.type = 'range';
  slider.id = param.id;
  slider.name = param.name.toLowerCase();
  slider.min = param.min.toString();
  slider.max = param.max.toString();
  slider.step = param.step.toString();
  slider.value = param.defaultValue.toString();
  
  const valueDisplay = document.createElement('span');
  valueDisplay.setAttribute('part', 'value-display');
  valueDisplay.classList.add('value-display');
  valueDisplay.id = `${param.id}-value`;
  valueDisplay.textContent = param.formatter 
    ? param.formatter(param.defaultValue) 
    : param.defaultValue.toFixed(2);
  
  // Add event listener
  slider.addEventListener('input', (event) => this.handleParameterChange(event));
  
  // Assemble
  container.appendChild(label);
  container.appendChild(slider);
  container.appendChild(valueDisplay);
  
  return container;
}

// Event handler for parameter changes
private handleParameterChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const { name, value, id } = target;
  const numValue = parseFloat(value);
  
  // Update value display
  const valueDisplay = this.shadowRoot!.querySelector(`#${id}-value`);
  if (valueDisplay) {
    valueDisplay.textContent = numValue.toFixed(2);
  }
  
  // Update audio parameter based on name
  switch (name) {
    case 'gain':
      this.setGain(numValue);
      break;
    case 'attack':
      this.setAttack(numValue);
      break;
    case 'release':
      this.setRelease(numValue);
      break;
    case 'playbackrate':
      this.setPlaybackRate(numValue);
      break;
  }
  
  // Dispatch event for external listeners
  this.dispatchEvent(new CustomEvent<ParameterChangeDetail>('paramchange', {
    bubbles: true,
    detail: { param: name, value: numValue }
  }));
}

// Helper to add multiple parameters efficiently
private addParameterControls(container: HTMLElement, parameters: ParameterDefinition[]): void {
  parameters.forEach(param => {
    const control = this.createParameterControl(param);
    container.appendChild(control);
  });
}

// Example usage in connectedCallback
connectedCallback(): void {
  // ...other initialization code
  
  // Find the parameters container
  const parametersContainer = this.shadowRoot!.querySelector('.parameters');
  if (parametersContainer) {
    // Define the parameters
    const parameters: ParameterDefinition[] = [
      {
        id: 'attack-slider',
        name: 'Attack',
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.01,
        formatter: (value) => `${value.toFixed(2)}s`
      },
      {
        id: 'release-slider',
        name: 'Release',
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 0.3,
        formatter: (value) => `${value.toFixed(2)}s`
      },
      {
        id: 'playbackrate-slider',
        name: 'Playback Rate',
        min: 0.25,
        max: 2,
        step: 0.01,
        defaultValue: 1.0,
        formatter: (value) => value.toFixed(2)
      }
    ];
    
    // Add all parameters
    this.addParameterControls(parametersContainer, parameters);
  }
}
```# Essential Code Snippets for Web Audio Components

## Audio Context Creation (TypeScript)

```typescript
// Create and manage AudioContext
export class AudioContextManager {
  private static instance: AudioContextManager;
  private context: AudioContext;
  
  constructor() {
    // Singleton pattern
    if (AudioContextManager.instance) {
      return AudioContextManager.instance;
    }
    
    // Create audio context with best options for low latency
    const contextOptions: AudioContextOptions = {
      latencyHint: 'interactive',
      sampleRate: 44100
    };
    
    this.context = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
    AudioContextManager.instance = this;
  }
  
  getContext(): AudioContext {
    return this.context;
  }
  
  async resume(): Promise<string> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context.state;
  }
  
  suspend(): Promise<void> {
    return this.context.suspend();
  }
  
  // Get current audio context state
  getState(): AudioContextState {
    return this.context.state;
  }
  
  // Get current sample rate
  getSampleRate(): number {
    return this.context.sampleRate;
  }
  
  // Get current output latency if available
  getOutputLatency(): number | undefined {
    if ('outputLatency' in this.context) {
      return (this.context as any).outputLatency;
    }
    return undefined;
  }
}

// Usage
const audioManager = new AudioContextManager();
const ctx = audioManager.getContext();
```

## File Upload for Audio Samples (TypeScript)

```typescript
// Add this inside your component's shadowRoot template
const fileUploadTemplate = `
  <div part="upload-container" class="upload-container">
    <input part="file-input" type="file" id="audio-upload" accept="audio/*" />
    <label part="upload-button" for="audio-upload" class="upload-button">Upload Sample</label>
    <span part="filename" class="filename"></span>
  </div>
`;

// Add this to your component class
async loadAudioFile(file: File): Promise<AudioBuffer | null> {
  if (!file) return null;
  
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode audio data
    const audioContext = new AudioContextManager().getContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Set the buffer to your audio node
    this.player?.loadSample(audioBuffer);
    
    // Update UI with filename
    const filenameElement = this.shadowRoot?.querySelector('.filename');
    if (filenameElement) {
      filenameElement.textContent = file.name;
    }
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('sample-loaded', {
      bubbles: true,
      detail: { 
        player: this.player,
        filename: file.name, 
        duration: audioBuffer.duration 
      }
    }));
    
    return audioBuffer;
  } catch (error) {
    console.error('Error loading audio file:', error);
    this.dispatchEvent(new CustomEvent('error', {
      bubbles: true,
      detail: { message: 'Failed to load audio file', error }
    }));
    return null;
  }
}

// Add this to your setupEventListeners method
private setupEventListeners(): void {
  // ...existing code
  
  const fileInput = this.shadowRoot!.querySelector('#audio-upload') as HTMLInputElement;
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.loadAudioFile(file);
      }
    });
  }
}

// Alternative method using a programmatic approach (no visible input element)
async openFilePicker(): Promise<void> {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*';
  
  fileInput.onchange = async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      await this.loadAudioFile(file);
    }
  };
  
  // Trigger file selection dialog
  fileInput.click();
}
```

## Play/Stop Controls (TypeScript)

```typescript
// Add this inside your component's shadowRoot template
const transportControlsTemplate = `
  <div part="transport-controls" class="transport-controls">
    <button part="play-button" id="play-button" data-state="stopped">Play</button>
    <button part="stop-button" id="stop-button">Stop</button>
  </div>
`;

// Interface for playback events
interface PlaybackEventDetail {
  startTime?: number;
  endTime?: number;
  duration?: number;
}

// Add these methods to your component class
play(noteOrFrequency?: number, velocity: number = 0.8): void {
  if (!this.player || !this.initialized) {
    console.warn('Cannot play - player not initialized');
    return;
  }
  
  // Resume AudioContext if suspended
  const audioManager = new AudioContextManager();
  audioManager.resume().then(() => {
    // If a note is provided, play that specific note
    if (typeof noteOrFrequency !== 'undefined') {
      this.player!.play(noteOrFrequency, velocity);
    } else {
      // Otherwise trigger general playback
      this.player!.start();
    }
    
    // Update UI
    const playButton = this.shadowRoot!.querySelector('#play-button') as HTMLButtonElement;
    if (playButton) {
      playButton.textContent = 'Pause';
      playButton.dataset.state = 'playing';
    }
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent<PlaybackEventDetail>('playstart', {
      bubbles: true,
      detail: {
        startTime: this.audioContext?.currentTime
      }
    }));
  });
}

stop(): void {
  if (!this.player || !this.initialized) {
    console.warn('Cannot stop - player not initialized');
    return;
  }
  
  // If it's a note-based player with no specific note, stop all notes
  if ('stopAll' in this.player) {
    (this.player as any).stopAll();
  } else if ('stop' in this.player) {
    this.player.stop();
  }
  
  // Update UI
  const playButton = this.shadowRoot!.querySelector('#play-button') as HTMLButtonElement;
  if (playButton) {
    playButton.textContent = 'Play';
    playButton.dataset.state = 'stopped';
  }
  
  // Dispatch event
  this.dispatchEvent(new CustomEvent<PlaybackEventDetail>('playstop', {
    bubbles: true,
    detail: {
      endTime: this.audioContext?.currentTime
    }
  }));
}

// Release a specific note (for note-based players)
release(noteOrFrequency: number): void {
  if (!this.player || !this.initialized) {
    console.warn('Cannot release note - player not initialized');
    return;
  }
  
  if ('release' in this.player) {
    this.player.release(noteOrFrequency);
  }
}

// Add this to your setupEventListeners method
private setupEventListeners(): void {
  // ...existing code
  
  const playButton = this.shadowRoot!.querySelector('#play-button') as HTMLButtonElement;
  const stopButton = this.shadowRoot!.querySelector('#stop-button') as HTMLButtonElement;
  
  if (playButton) {
    playButton.addEventListener('click', () => {
      if (playButton.dataset.state !== 'playing') {
        this.play();
      } else {
        this.stop();
      }
    });
  }
  
  if (stopButton) {
    stopButton.addEventListener('click', () => {
      this.stop();
    });
  }
}
```

## Custom Events and Event Handling (TypeScript)

```typescript
// Define event interfaces for strongly typed events
interface AudioElementEventMap {
  'initialized': CustomEvent<{ player: any }>;
  'sample-loaded': CustomEvent<{ player: any, fileName: string, duration: number }>;
  'playstart': CustomEvent<{ startTime?: number }>;
  'playstop': CustomEvent<{ endTime?: number }>;
  'paramchange': CustomEvent<{ param: string, value: number }>;
  'error': CustomEvent<{ message: string, error?: any }>;
  'connection-change': CustomEvent<{ connected: boolean, source?: BaseAudioElement, destination?: BaseAudioElement | AudioNode }>;
}

// To enable type checking for event handlers
declare global {
  interface HTMLElementEventMap extends AudioElementEventMap {}
}

// Method to dispatch typed events
private dispatchAudioEvent<K extends keyof AudioElementEventMap>(
  type: K, 
  detail: AudioElementEventMap[K]['detail']
): void {
  this.dispatchEvent(new CustomEvent(type, {
    bubbles: true,
    composed: true, // Cross shadow DOM boundary
    detail
  }));
}

// Example usage
this.dispatchAudioEvent('initialized', { player: this.player });
this.dispatchAudioEvent('playstart', { startTime: this.audioContext?.currentTime });

// Example of setting up event listeners
connectedCallback(): void {
  // Set up listeners for other audio elements
  this.addEventListener('connection-change', this.handleConnectionChange);
  
  // Listen for keyboard events for MIDI note input
  document.addEventListener('keydown', this.handleKeyDown);
  document.addEventListener('keyup', this.handleKeyUp);
}

disconnectedCallback(): void {
  // Clean up event listeners
  this.removeEventListener('connection-change', this.handleConnectionChange);
  document.removeEventListener('keydown', this.handleKeyDown);
  document.removeEventListener('keyup', this.handleKeyUp);
}

// Event handler methods
private handleConnectionChange = (event: CustomEvent): void => {
  // Cast event to the correct type for type checking
  const detail = event.detail as AudioElementEventMap['connection-change']['detail'];
  if (detail.connected && detail.destination === this) {
    console.log(`Connected to ${detail.source}`);
  }
};

private handleKeyDown = (event: KeyboardEvent): void => {
  if (!this.player || !this.initialized || event.repeat) return;
  
  // Map keyboard keys to MIDI notes (simple example)
  const keyToNote: Record<string, number> = {
    'a': 60, // C4
    's': 62, // D4
    'd': 64, // E4
    'f': 65, // F4
    'g': 67, // G4
    'h': 69, // A4
    'j': 71, // B4
    'k': 72, // C5
  };
  
  const note = keyToNote[event.key.toLowerCase()];
  if (note !== undefined) {
    this.play(note, 0.8);
  }
};

private handleKeyUp = (event: KeyboardEvent): void => {
  if (!this.player || !this.initialized) return;
  
  // Map keyboard keys to MIDI notes
  const keyToNote: Record<string, number> = {
    'a': 60, 's': 62, 'd': 64, 'f': 65, 'g': 67, 'h': 69, 'j': 71, 'k': 72,
  };
  
  const note = keyToNote[event.key.toLowerCase()];
  if (note !== undefined) {
    this.release(note);
  }
};
```

## Complete SamplePlayer Component Example

```javascript
import { AudioContextManager } from '../utils/audio-context-manager.js';
import { SamplePlayer } from 'your-audio-library';

export class SamplePlayerElement extends HTMLElement {
  #audioNode;
  #buffer = null;
  #isPlaying = false;
  
  static get observedAttributes() {
    return ['gain', 'enabled', 'loop', 'playback-rate'];
  }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize shadow DOM with all controls
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .sample-player {
          border: 1px solid #eee;
          padding: 10px;
        }
        .slider-container {
          margin-bottom: 10px;
        }
        .transport-controls {
          display: flex;
          gap: 5px;
          margin-top: 10px;
        }
        .upload-container {
          margin-bottom: 10px;
        }
        .upload-button {
          padding: 5px 10px;
          background: #f0f0f0;
          border-radius: 4px;
          cursor: pointer;
        }
        #audio-upload {
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
      </style>
      
      <div class="sample-player">
        <div class="upload-container">
          <input type="file" id="audio-upload" accept="audio/*" />
          <label for="audio-upload" class="upload-button">Upload Sample</label>
          <span class="filename"></span>
        </div>
        
        <div class="slider-container">
          <label for="gain-slider">Gain</label>
          <input type="range" id="gain-slider" name="gain" min="0" max="1" step="0.01" value="0.8" />
          <span class="value-display">0.8</span>
        </div>
        
        <div class="slider-container">
          <label for="rate-slider">Playback Rate</label>
          <input type="range" id="rate-slider" name="playbackRate" min="0.25" max="2" step="0.01" value="1" />
          <span class="value-display">1.00</span>
        </div>
        
        <div class="checkbox-container">
          <input type="checkbox" id="loop-checkbox" name="loop" />
          <label for="loop-checkbox">Loop</label>
        </div>
        
        <div class="transport-controls">
          <button id="play-button" data-state="stopped">Play</button>
          <button id="stop-button">Stop</button>
        </div>
      </div>
    `;
    
    // Bind methods
    this.handleInput = this.handleInput.bind(this);
    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
  }
  
  connectedCallback() {
    // Get AudioContext
    const audioContext = new AudioContextManager().context;
    
    // Create audio node from your library
    this.#audioNode = new SamplePlayer(audioContext);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize from attributes
    this.initializeFromAttributes();
  }
  
  disconnectedCallback() {
    // Clean up
    this.removeEventListeners();
    
    if (this.#isPlaying) {
      this.stop();
    }
    
    if (this.#audioNode) {
      this.#audioNode.disconnect();
    }
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'gain':
        this.updateGain(parseFloat(newValue));
        break;
      case 'enabled':
        this.updateEnabled(newValue !== 'false' && newValue !== null);
        break;
      case 'loop':
        this.updateLoop(newValue !== 'false' && newValue !== null);
        break;
      case 'playback-rate':
        this.updatePlaybackRate(parseFloat(newValue));
        break;
    }
  }
  
  // All the implementation methods as described in previous snippets
  
  // Connect method for audio routing
  connect(destination) {
    if (!this.#audioNode) return null;
    
    this.#audioNode.connect(destination.audioNode || destination);
    return destination;
  }
  
  // Public API
  get audioNode() {
    return this.#audioNode;
  }
  
  get buffer() {
    return this.#buffer;
  }
  
  get isPlaying() {
    return this.#isPlaying;
  }
}

// Register it
customElements.define('audio-sample-player', SamplePlayerElement);
```
