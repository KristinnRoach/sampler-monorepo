// audioBufferSource.js
// import { AudioContextProvider } from '../context/audioContext.js';
import { BaseAudioNode } from './baseAudioNode.js';

class AudioBufferSourceNode extends BaseAudioNode {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Core properties
    this.buffer = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.startTime = 0;
    this.offset = 0;

    // State for looping
    this.loop = false;
    this.loopStart = 0;
    this.loopEnd = 0;

    // Create UI
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
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        input[type="file"] {
          width: 100%;
        }
        .controls {
          display: flex;
          gap: 0.5rem;
        }
        .loading {
          color: #666;
          font-style: italic;
        }
      </style>
      
      <div class="container">
        <input type="file" id="fileInput" accept="audio/*">
        <div class="controls">
          <button id="playButton" disabled>Play</button>
          <button id="stopButton" disabled>Stop</button>
        </div>
        <div id="status"></div>
      </div>
    `;

    // Get UI elements
    this.fileInput = this.shadowRoot.getElementById('fileInput');
    this.playButton = this.shadowRoot.getElementById('playButton');
    this.stopButton = this.shadowRoot.getElementById('stopButton');
    this.statusDiv = this.shadowRoot.getElementById('status');

    // Bind methods
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.play = this.play.bind(this);
    this.stop = this.stop.bind(this);
  }

  async connectedCallback() {
    try {
      const context = await this.getContext();

      // Initialize gain node for output control
      this.gainNode = context.createGain();
      this.outputs.set('default', this.gainNode);

      // Add event listeners
      this.fileInput.addEventListener('change', this.handleFileSelect);
      this.playButton.addEventListener('click', this.play);
      this.stopButton.addEventListener('click', this.stop);

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing AudioBufferSource:', error);
      this.setStatus('Error initializing audio component');
    }
  }

  disconnectedCallback() {
    this.stop();
    this.fileInput.removeEventListener('change', this.handleFileSelect);
    this.playButton.removeEventListener('click', this.play);
    this.stopButton.removeEventListener('click', this.stop);
  }

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.setStatus('Loading audio file...');
      this.disableControls(true);

      const arrayBuffer = await file.arrayBuffer();
      const context = await this.getContext();
      this.buffer = await context.decodeAudioData(arrayBuffer);

      this.setStatus(`Loaded: ${file.name}`);
      this.disableControls(false);

      // Set initial loop points
      this.loopEnd = this.buffer.duration;
    } catch (error) {
      console.error('Error loading audio file:', error);
      this.setStatus('Error loading audio file');
      this.disableControls(true);
    }
  }

  async play() {
    if (!this.buffer || this.isPlaying) return;

    try {
      const context = await this.getContext();

      // Create new source node
      this.sourceNode = context.createBufferSource();
      this.sourceNode.buffer = this.buffer;

      // Set up looping if enabled
      this.sourceNode.loop = this.loop;
      if (this.loop) {
        this.sourceNode.loopStart = this.loopStart;
        this.sourceNode.loopEnd = this.loopEnd;
      }

      // Connect and start
      this.sourceNode.connect(this.gainNode);
      this.sourceNode.start(0, this.offset);
      this.startTime = context.currentTime - this.offset;
      this.isPlaying = true;

      // Update UI
      this.playButton.textContent = 'Pause';
      this.stopButton.disabled = false;

      // Handle ending
      this.sourceNode.onended = () => {
        if (!this.loop) {
          this.stop();
          this.offset = 0;
        }
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      this.setStatus('Error playing audio');
    }
  }

  stop() {
    if (!this.sourceNode || !this.isPlaying) return;

    try {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
      this.isPlaying = false;

      // Update UI
      this.playButton.textContent = 'Play';
      this.stopButton.disabled = true;
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }

  // Helper methods
  setStatus(message) {
    this.statusDiv.textContent = message;
  }

  disableControls(disabled) {
    this.playButton.disabled = disabled;
    this.stopButton.disabled = disabled || !this.isPlaying;
  }

  // Public API
  setLoop(enabled, start = 0, end = null) {
    this.loop = enabled;
    this.loopStart = start;
    this.loopEnd = end ?? (this.buffer?.duration || 0);

    if (this.sourceNode) {
      this.sourceNode.loop = enabled;
      this.sourceNode.loopStart = start;
      this.sourceNode.loopEnd = this.loopEnd;
    }
  }

  setGain(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  getDuration() {
    return this.buffer?.duration || 0;
  }

  getCurrentTime() {
    if (!this.isPlaying || !this.contextProvider.audioContext)
      return this.offset;
    return (
      (this.contextProvider.audioContext.currentTime - this.startTime) %
      this.buffer.duration
    );
  }
}

// Register custom element
customElements.define('audio-buffer-source', AudioBufferSourceNode);

export { AudioBufferSourceNode };
