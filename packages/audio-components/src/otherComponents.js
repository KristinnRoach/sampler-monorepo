// audioComponents.js
import { AudioContextProvider } from './audioContext.js';

class BaseAudioNode extends HTMLElement {
  constructor() {
    super();
    this.inputs = new Map();
    this.outputs = new Map();
    this.initialized = false;
    this.contextProvider = AudioContextProvider.getInstance();
    this._initializationPromise = null;
  }

  async getContext() {
    return this.contextProvider.getContext();
  }

  // Add initialization promise handling
  async waitForInit() {
    if (this.initialized) {
      return Promise.resolve();
    }
    if (!this._initializationPromise) {
      this._initializationPromise = new Promise((resolve) => {
        const checkInit = () => {
          if (this.initialized) {
            resolve();
          } else {
            requestAnimationFrame(checkInit);
          }
        };
        checkInit();
      });
    }
    return this._initializationPromise;
  }

  async connect(destination, outputName = 'default', inputName = 'default') {
    console.log('Waiting for nodes to initialize...');
    // Wait for both nodes to be initialized
    await Promise.all([this.waitForInit(), destination.waitForInit()]);

    console.log('Nodes initialized, checking connection points...');
    console.log('Available outputs:', [...this.outputs.keys()]);
    console.log('Available inputs:', [...destination.inputs.keys()]);

    const output = this.outputs.get(outputName);
    const input = destination.inputs.get(inputName);

    if (!output || !input) {
      throw new Error(
        `Invalid connection points: ${outputName} -> ${inputName}. ` +
          `Available outputs: [${[...this.outputs.keys()]}], ` +
          `Available inputs: [${[...destination.inputs.keys()]}]`
      );
    }

    console.log('Connecting nodes...');
    output.connect(input);
    return destination;
  }

  disconnect(destination, outputName = 'default', inputName = 'default') {
    const output = this.outputs.get(outputName);
    const input = destination.inputs.get(inputName);

    if (output && input) {
      output.disconnect(input);
    }
  }
}

class OscillatorNode extends BaseAudioNode {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.oscillator = null;
    this.gainNode = null;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .container {
          display: grid;
          gap: 0.5rem;
        }
        
        button {
          padding: 0.5rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        input, select {
          width: 100%;
        }
      </style>
      
      <div class="container">
        <button id="toggle">Start</button>
        <div>
          <label for="frequency">Frequency: <span id="freqValue">440</span>Hz</label>
          <input type="range" id="frequency" min="20" max="2000" value="440">
        </div>
        <div>
          <label for="waveform">Waveform:</label>
          <select id="waveform">
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
      </div>
    `;

    this.toggleButton = this.shadowRoot.getElementById('toggle');
    this.frequencyInput = this.shadowRoot.getElementById('frequency');
    this.waveformSelect = this.shadowRoot.getElementById('waveform');
    this.freqValueSpan = this.shadowRoot.getElementById('freqValue');

    this.toggle = this.toggle.bind(this);
    this.updateFrequency = this.updateFrequency.bind(this);
    this.updateWaveform = this.updateWaveform.bind(this);
  }

  async connectedCallback() {
    try {
      const context = await this.getContext();

      this.gainNode = context.createGain();
      this.outputs.set('default', this.gainNode);

      this.toggleButton.addEventListener('click', this.toggle);
      this.frequencyInput.addEventListener('input', this.updateFrequency);
      this.waveformSelect.addEventListener('input', this.updateWaveform);

      this.initialized = true;
      console.log('Oscillator initialized');
    } catch (error) {
      console.error('Error initializing oscillator:', error);
    }
  }

  disconnectedCallback() {
    this.stop();
    this.toggleButton.removeEventListener('click', this.toggle);
    this.frequencyInput.removeEventListener('input', this.updateFrequency);
    this.waveformSelect.removeEventListener('input', this.updateWaveform);
  }

  async toggle() {
    if (!this.oscillator) {
      await this.start();
    } else {
      this.stop();
    }
  }

  async start() {
    const context = await this.getContext();
    this.oscillator = context.createOscillator();
    this.oscillator.type = this.waveformSelect.value;
    this.oscillator.frequency.value = this.frequencyInput.value;

    this.oscillator.connect(this.gainNode);
    this.oscillator.start();

    this.toggleButton.textContent = 'Stop';
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
      this.toggleButton.textContent = 'Start';
    }
  }

  updateFrequency(event) {
    const frequency = event.target.value;
    this.freqValueSpan.textContent = frequency;

    if (this.oscillator) {
      this.oscillator.frequency.value = frequency;
    }
  }

  updateWaveform(event) {
    if (this.oscillator) {
      this.oscillator.type = event.target.value;
    }
  }
}

class FilterNode extends BaseAudioNode {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.filter = null;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .container {
          display: grid;
          gap: 0.5rem;
        }
        
        input, select {
          width: 100%;
        }
      </style>
      
      <div class="container">
        <div>
          <label for="frequency">Cutoff: <span id="freqValue">1000</span>Hz</label>
          <input type="range" id="frequency" min="20" max="20000" value="1000">
        </div>
        <div>
          <label for="resonance">Resonance: <span id="resValue">1</span></label>
          <input type="range" id="resonance" min="0" max="20" value="1" step="0.1">
        </div>
        <div>
          <label for="type">Filter Type:</label>
          <select id="type">
            <option value="lowpass">Low Pass</option>
            <option value="highpass">High Pass</option>
            <option value="bandpass">Band Pass</option>
          </select>
        </div>
      </div>
    `;

    this.frequencyInput = this.shadowRoot.getElementById('frequency');
    this.resonanceInput = this.shadowRoot.getElementById('resonance');
    this.typeSelect = this.shadowRoot.getElementById('type');
    this.freqValueSpan = this.shadowRoot.getElementById('freqValue');
    this.resValueSpan = this.shadowRoot.getElementById('resValue');

    this.updateFrequency = this.updateFrequency.bind(this);
    this.updateResonance = this.updateResonance.bind(this);
    this.updateType = this.updateType.bind(this);
  }

  async connectedCallback() {
    try {
      const context = await this.getContext();

      this.filter = context.createBiquadFilter();
      this.filter.type = this.typeSelect.value;
      this.filter.frequency.value = this.frequencyInput.value;
      this.filter.Q.value = this.resonanceInput.value;

      this.inputs.set('default', this.filter);
      this.outputs.set('default', this.filter);

      this.frequencyInput.addEventListener('input', this.updateFrequency);
      this.resonanceInput.addEventListener('input', this.updateResonance);
      this.typeSelect.addEventListener('input', this.updateType);

      this.initialized = true;
      console.log('Filter initialized');
    } catch (error) {
      console.error('Error initializing filter:', error);
    }
  }

  disconnectedCallback() {
    this.frequencyInput.removeEventListener('input', this.updateFrequency);
    this.resonanceInput.removeEventListener('input', this.updateResonance);
    this.typeSelect.removeEventListener('input', this.updateType);
  }

  updateFrequency(event) {
    const frequency = event.target.value;
    this.freqValueSpan.textContent = frequency;
    this.filter.frequency.value = frequency;
  }

  updateResonance(event) {
    const resonance = event.target.value;
    this.resValueSpan.textContent = resonance;
    this.filter.Q.value = resonance;
  }

  updateType(event) {
    this.filter.type = event.target.value;
  }
}

class AudioOutput extends BaseAudioNode {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        input {
          width: 100%;
        }
      </style>
      
      <div>
        <label for="volume">Master Volume: <span id="volValue">100</span>%</label>
        <input type="range" id="volume" min="0" max="100" value="100">
      </div>
    `;

    this.volumeInput = this.shadowRoot.getElementById('volume');
    this.volValueSpan = this.shadowRoot.getElementById('volValue');

    this.updateVolume = this.updateVolume.bind(this);
  }

  async connectedCallback() {
    try {
      const context = await this.getContext();

      this.gainNode = context.createGain();
      this.gainNode.connect(context.destination);

      this.inputs.set('default', this.gainNode);

      this.volumeInput.addEventListener('input', this.updateVolume);

      this.initialized = true;
      console.log('Output initialized');
    } catch (error) {
      console.error('Error initializing output:', error);
    }
  }

  disconnectedCallback() {
    this.volumeInput.removeEventListener('input', this.updateVolume);
  }

  updateVolume(event) {
    const volume = event.target.value;
    this.volValueSpan.textContent = volume;
    this.gainNode.gain.value = volume / 100;
  }
}

customElements.define('audio-oscillator', OscillatorNode);
customElements.define('audio-filter', FilterNode);
customElements.define('audio-output', AudioOutput);

export { OscillatorNode, FilterNode, AudioOutput };
