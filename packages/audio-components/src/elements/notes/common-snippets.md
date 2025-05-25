# Essential Code Snippets for Web Audio Components

## Audio Context Creation

```javascript
// Create and manage AudioContext
export class AudioContextManager {
  static #instance;
  #context;

  constructor() {
    // Singleton pattern
    if (AudioContextManager.#instance) {
      return AudioContextManager.#instance;
    }

    // Create audio context with best options for low latency
    const contextOptions = {
      latencyHint: 'interactive',
      sampleRate: 48000,
    };

    this.#context = new (window.AudioContext || window.webkitAudioContext)(
      contextOptions
    );
    AudioContextManager.#instance = this;
  }

  get context() {
    return this.#context;
  }

  async resume() {
    if (this.#context.state === 'suspended') {
      await this.#context.resume();
    }
    return this.#context.state;
  }

  suspend() {
    return this.#context.suspend();
  }
}

// Usage
const audioManager = new AudioContextManager();
const ctx = audioManager.context;
```

## File Upload for Audio Samples

```javascript
// Add this inside your component's shadowRoot template
const fileUploadTemplate = `
  <div class="upload-container">
    <input type="file" id="audio-upload" accept="audio/*" />
    <label for="audio-upload" class="upload-button">Upload Sample</label>
  </div>
`;

// Add this to your component class
async loadAudioFile(file) {
  if (!file) return null;

  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode audio data
    const audioContext = new AudioContextManager().context;
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Set the buffer to your audio node
    this.#audioNode.setBuffer(audioBuffer);

    // Dispatch event
    this.dispatchEvent(new CustomEvent('sampleloaded', {
      bubbles: true,
      detail: { filename: file.name, duration: audioBuffer.duration }
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
setupEventListeners() {
  // ...existing code

  const fileInput = this.shadowRoot.querySelector('#audio-upload');
  if (fileInput) {
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.loadAudioFile(file);
      }
    });
  }
}
```

## Parameter Sliders

```javascript
// Add this inside your component's shadowRoot template
const sliderTemplate = `
  <div class="slider-container">
    <label for="gain-slider">Gain</label>
    <input
      type="range"
      id="gain-slider"
      name="gain"
      min="0"
      max="1"
      step="0.01"
      value="0.8"
    />
    <span class="value-display">0.8</span>
  </div>
`;

// Add this to your handleInput method
handleInput(event) {
  const { name, value, type, id } = event.target;

  if (type === 'range') {
    const numValue = parseFloat(value);

    // Update value display
    const valueDisplay = this.shadowRoot.querySelector(`#${id}`).nextElementSibling;
    if (valueDisplay) {
      valueDisplay.textContent = numValue.toFixed(2);
    }

    // Update audio parameter
    switch (name) {
      case 'gain':
        this.#audioNode.setGain(numValue);
        break;
      case 'playbackRate':
        this.#audioNode.setPlaybackRate(numValue);
        break;
      // Add other parameters as needed
    }

    // Dispatch event
    this.dispatchEvent(new CustomEvent('paramchange', {
      bubbles: true,
      detail: { param: name, value: numValue }
    }));
  }
}
```

## Play/Stop Buttons

```javascript
// Add this inside your component's shadowRoot template
const transportTemplate = `
  <div class="transport-controls">
    <button id="play-button">Play</button>
    <button id="stop-button">Stop</button>
  </div>
`;

// Add these methods to your component class
play() {
  if (!this.#audioNode) return;

  // Resume AudioContext if suspended
  new AudioContextManager().resume().then(() => {
    this.#audioNode.play();

    // Update UI
    const playButton = this.shadowRoot.querySelector('#play-button');
    if (playButton) {
      playButton.textContent = 'Pause';
      playButton.dataset.state = 'playing';
    }

    // Dispatch event
    this.dispatchEvent(new CustomEvent('playstart', {
      bubbles: true
    }));
  });
}

stop() {
  if (!this.#audioNode) return;

  this.#audioNode.stop();

  // Update UI
  const playButton = this.shadowRoot.querySelector('#play-button');
  if (playButton) {
    playButton.textContent = 'Play';
    playButton.dataset.state = 'stopped';
  }

  // Dispatch event
  this.dispatchEvent(new CustomEvent('playstop', {
    bubbles: true
  }));
}

// Add this to your setupEventListeners method
setupEventListeners() {
  // ...existing code

  const playButton = this.shadowRoot.querySelector('#play-button');
  const stopButton = this.shadowRoot.querySelector('#stop-button');

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
