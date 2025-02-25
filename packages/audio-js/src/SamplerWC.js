/**
 * SamplerWC - Web Component for Audiolib Sampler
 * Encapsulates the setup and usage of a sampler instrument
 */
class SamplerWC extends HTMLElement {
  /**
   * Create a new SamplerWC instance
   */
  constructor() {
    super();

    // Create a shadow DOM
    this.attachShadow({ mode: 'open' });

    // State
    this._isInitialized = false;
    this._isPlaying = false;
    this._audioComponents = null;
    this._keyMap = null;

    // Initialize the shadow DOM
    this._initializeDOM();
  }

  /**
   * Web component lifecycle - connected callback
   */
  connectedCallback() {
    this._setupEventListeners();

    // Set attributes with defaults if not provided
    if (!this.hasAttribute('polyphony')) {
      this.setAttribute('polyphony', '8');
    }

    if (!this.hasAttribute('sample-url')) {
      this.setAttribute(
        'sample-url',
        'https://cdn.jsdelivr.net/gh/tonejs/tonejs.github.io@master/audio/salamander/A0.mp3'
      );
    }
  }

  /**
   * Web component lifecycle - disconnected callback
   */
  disconnectedCallback() {
    this._cleanupAudio();
    this._removeEventListeners();
  }

  /**
   * Web component lifecycle - attribute changed callback
   */
  static get observedAttributes() {
    return [
      'polyphony',
      'sample-url',
      'attack',
      'decay',
      'sustain',
      'release',
      'gain',
    ];
  }

  /**
   * Web component lifecycle - attribute changed callback
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._audioComponents || !this._audioComponents.instrument) {
      return;
    }

    switch (name) {
      case 'attack':
      case 'decay':
      case 'sustain':
      case 'release':
      case 'gain':
        this._audioComponents.instrument.setParameter(
          name,
          parseFloat(newValue)
        );
        break;
      case 'sample-url':
        // Only reload sample if already initialized
        if (this._isInitialized) {
          this._loadSample(newValue);
        }
        break;
    }
  }

  /**
   * Initialize the shadow DOM structure
   * @private
   */
  _initializeDOM() {
    const style = document.createElement('style');
    style.textContent = `
        :host {
          display: block;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        }
        
        .container {
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 16px;
          box-sizing: border-box;
        }
        
        .status {
          margin-bottom: 12px;
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .status.error {
          background-color: #ffebee;
          color: #c62828;
        }
        
        button {
          padding: 8px 16px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 12px;
        }
        
        button:hover {
          background: #1976d2;
        }
        
        button:disabled {
          background: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
        }
        
        .piano {
          display: flex;
          height: 150px;
          margin: 16px 0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .key {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 8px;
          background: white;
          border-right: 1px solid #ddd;
          cursor: pointer;
          user-select: none;
          position: relative;
        }
        
        .key:last-child {
          border-right: none;
        }
        
        .key[data-accidental="true"] {
          background: #333;
          color: white;
          flex: 0.6;
          height: 60%;
          position: relative;
          margin: 0 -14px;
          z-index: 1;
          border-radius: 0 0 4px 4px;
        }
        
        .key.active {
          background: #bbdefb;
        }
        
        .key[data-accidental="true"].active {
          background: #1565c0;
        }
        
        .controls {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
        }
        
        .control-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 14px;
        }
        
        .control-value {
          font-weight: bold;
        }
        
        input[type="range"] {
          width: 100%;
        }
      `;

    const container = document.createElement('div');
    container.className = 'container';

    const status = document.createElement('div');
    status.className = 'status';
    status.textContent = 'Click "Start Audio" to initialize the sampler';
    status.id = 'status';

    const startButton = document.createElement('button');
    startButton.textContent = 'Start Audio';
    startButton.id = 'startButton';

    const piano = document.createElement('div');
    piano.className = 'piano';
    piano.id = 'piano';

    // Create piano keys (C3 to C4)
    const keys = [
      { note: 60, name: 'C', accidental: false },
      { note: 61, name: 'C#', accidental: true },
      { note: 62, name: 'D', accidental: false },
      { note: 63, name: 'D#', accidental: true },
      { note: 64, name: 'E', accidental: false },
      { note: 65, name: 'F', accidental: false },
      { note: 66, name: 'F#', accidental: true },
      { note: 67, name: 'G', accidental: false },
      { note: 68, name: 'G#', accidental: true },
      { note: 69, name: 'A', accidental: false },
      { note: 70, name: 'A#', accidental: true },
      { note: 71, name: 'B', accidental: false },
      { note: 72, name: 'C', accidental: false },
    ];

    keys.forEach((keyInfo) => {
      const key = document.createElement('div');
      key.className = 'key';
      key.dataset.note = keyInfo.note;
      key.textContent = keyInfo.name;

      if (keyInfo.accidental) {
        key.dataset.accidental = 'true';
      }

      piano.appendChild(key);
    });

    const controls = document.createElement('div');
    controls.className = 'controls';

    // Create controls for common parameters
    const controlGroups = [
      { id: 'gain', label: 'Volume', min: 0, max: 1, step: 0.01, value: 0.8 },
      {
        id: 'attack',
        label: 'Attack',
        min: 0.001,
        max: 2,
        step: 0.001,
        value: 0.01,
      },
      {
        id: 'decay',
        label: 'Decay',
        min: 0.001,
        max: 2,
        step: 0.001,
        value: 0.1,
      },
      {
        id: 'sustain',
        label: 'Sustain',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.7,
      },
      {
        id: 'release',
        label: 'Release',
        min: 0.001,
        max: 3,
        step: 0.001,
        value: 0.3,
      },
    ];

    controlGroups.forEach((ctrl) => {
      const group = document.createElement('div');
      group.className = 'control-group';

      const label = document.createElement('div');
      label.className = 'control-label';

      const labelText = document.createElement('span');
      labelText.textContent = ctrl.label;

      const value = document.createElement('span');
      value.className = 'control-value';
      value.id = `${ctrl.id}-value`;
      value.textContent = ctrl.value.toFixed(2);

      label.appendChild(labelText);
      label.appendChild(value);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = ctrl.min;
      input.max = ctrl.max;
      input.step = ctrl.step;
      input.value = ctrl.value;
      input.id = ctrl.id;
      input.disabled = true;

      group.appendChild(label);
      group.appendChild(input);
      controls.appendChild(group);
    });

    // Assemble the DOM
    container.appendChild(status);
    container.appendChild(startButton);
    container.appendChild(piano);
    container.appendChild(controls);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Button click handler
    const startButton = this.shadowRoot.getElementById('startButton');
    startButton.addEventListener('click', this._handleStartClick.bind(this));

    // Set up keyboard map for computer keyboard
    this._keyMap = {
      KeyZ: 48,
      KeyS: 49,
      KeyX: 50,
      KeyD: 51,
      KeyC: 52,
      KeyV: 53,
      KeyG: 54,
      KeyB: 55,
      KeyH: 56,
      KeyN: 57,
      KeyJ: 58,
      KeyM: 59,
      Comma: 60,
      KeyL: 61,
      Period: 62,
      Semicolon: 63,
      Slash: 64,
      KeyQ: 60,
      Digit2: 61,
      KeyW: 62,
      Digit3: 63,
      KeyE: 64,
      KeyR: 65,
      Digit5: 66,
      KeyT: 67,
      Digit6: 68,
      KeyY: 69,
      Digit7: 70,
      KeyU: 71,
      KeyI: 72,
      Digit9: 73,
      KeyO: 74,
      Digit0: 75,
      KeyP: 76,
      BracketLeft: 77,
      Equal: 78,
      BracketRight: 79,
    };

    // Keyboard event listeners
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
    document.addEventListener('keyup', this._handleKeyUp.bind(this));

    // Piano key event listeners
    const keys = this.shadowRoot.querySelectorAll('.key');
    keys.forEach((key) => {
      key.addEventListener('mousedown', this._handleKeyMouseDown.bind(this));
      key.addEventListener('mouseup', this._handleKeyMouseUp.bind(this));
      key.addEventListener('mouseleave', this._handleKeyMouseUp.bind(this));
      key.addEventListener('touchstart', this._handleKeyTouchStart.bind(this));
      key.addEventListener('touchend', this._handleKeyTouchEnd.bind(this));
    });

    // Control event listeners
    const controls = this.shadowRoot.querySelectorAll('input[type="range"]');
    controls.forEach((control) => {
      control.addEventListener('input', this._handleControlChange.bind(this));
    });
  }

  /**
   * Remove event listeners
   * @private
   */
  _removeEventListeners() {
    document.removeEventListener('keydown', this._handleKeyDown.bind(this));
    document.removeEventListener('keyup', this._handleKeyUp.bind(this));
  }

  /**
   * Handle start button click
   * @private
   */
  async _handleStartClick() {
    const startButton = this.shadowRoot.getElementById('startButton');
    const status = this.shadowRoot.getElementById('status');

    if (this._isInitialized) {
      return;
    }

    startButton.disabled = true;
    status.textContent = 'Initializing audio...';

    try {
      // Initialize audio
      await this._initializeAudio();

      // Enable controls
      const controls = this.shadowRoot.querySelectorAll('input[type="range"]');
      controls.forEach((control) => {
        control.disabled = false;
      });

      status.textContent = 'Sampler initialized. Ready to play!';
      startButton.textContent = 'Started';
    } catch (error) {
      console.error('Error initializing audio:', error);
      status.textContent = `Error: ${error.message}`;
      status.className = 'status error';
      startButton.disabled = false;
    }
  }

  /**
   * Initialize audio components
   * @private
   */
  async _initializeAudio() {
    if (!window.AudioContextManager || !window.Voice || !window.Instrument) {
      throw new Error(
        'Audiolib components not found. Make sure to include AudioContextManager.js, Voice.js, and Instrument.js'
      );
    }

    // Create audio context manager
    const audioManager = window.AudioContextManager.create();
    const audioContext = audioManager.getContext();

    // Ensure audio context is running
    await audioManager.ensureContextRunning();

    // Load sample
    const sampleUrl = this.getAttribute('sample-url');
    const sampleBuffer = await audioManager.loadAudioFile(sampleUrl);

    // Create instrument
    const polyphony = parseInt(this.getAttribute('polyphony'), 10) || 8;
    const instrument = window.Instrument.createInstrument(audioContext, {
      buffer: sampleBuffer,
      polyphony: polyphony,
      attack: parseFloat(this.getAttribute('attack')) || 0.01,
      decay: parseFloat(this.getAttribute('decay')) || 0.1,
      sustain: parseFloat(this.getAttribute('sustain')) || 0.7,
      release: parseFloat(this.getAttribute('release')) || 0.3,
      gain: parseFloat(this.getAttribute('gain')) || 0.8,
    });

    // Connect to master output
    audioManager.connectToMaster(instrument);

    // Subscribe to state changes
    const unsubscribe = instrument.subscribe(this._updateUI.bind(this));

    // Store components for later
    this._audioComponents = {
      manager: audioManager,
      instrument: instrument,
      unsubscribe: unsubscribe,
    };

    // Mark as initialized
    this._isInitialized = true;

    // Dispatch event
    this.dispatchEvent(
      new CustomEvent('sampler-ready', {
        bubbles: true,
        composed: true,
        detail: { instrument },
      })
    );

    return true;
  }

  /**
   * Load a sample file
   * @param {string} url - URL of the sample to load
   * @private
   */
  async _loadSample(url) {
    if (!this._isInitialized || !this._audioComponents) {
      return false;
    }

    const status = this.shadowRoot.getElementById('status');
    status.textContent = 'Loading sample...';

    try {
      const buffer = await this._audioComponents.manager.loadAudioFile(url);
      this._audioComponents.instrument.loadBuffer(buffer);
      status.textContent = 'Sample loaded successfully!';
      return true;
    } catch (error) {
      console.error('Error loading sample:', error);
      status.textContent = `Error loading sample: ${error.message}`;
      status.className = 'status error';
      return false;
    }
  }

  /**
   * Clean up audio resources
   * @private
   */
  _cleanupAudio() {
    if (this._audioComponents) {
      // Unsubscribe from state changes
      if (this._audioComponents.unsubscribe) {
        this._audioComponents.unsubscribe();
      }

      // Clean up instrument
      if (this._audioComponents.instrument) {
        this._audioComponents.instrument.cleanup();
      }

      // Close audio context
      if (this._audioComponents.manager) {
        this._audioComponents.manager.cleanup();
      }

      this._audioComponents = null;
    }

    this._isInitialized = false;
  }

  /**
   * Handle keyboard key down event
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  _handleKeyDown(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    // Skip if focus is in a form element
    if (event.target.matches('textarea, select')) {
      return;
    }

    const key = event.code;
    if (key in this._keyMap && !event.repeat) {
      const note = this._keyMap[key];
      const velocity = 100;

      // Trigger the note
      this._audioComponents.instrument.triggerNote(note, velocity);

      // Update UI
      this._updateKeyUI(note, true);

      // Prevent default (e.g., scrolling)
      event.preventDefault();
    }
  }

  /**
   * Handle keyboard key up event
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  _handleKeyUp(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    const key = event.code;
    if (key in this._keyMap) {
      const note = this._keyMap[key];

      // Release the note
      this._audioComponents.instrument.releaseNote(note);

      // Update UI
      this._updateKeyUI(note, false);

      // Prevent default
      event.preventDefault();
    }
  }

  /**
   * Handle piano key mouse down
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleKeyMouseDown(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    const key = event.currentTarget;
    const note = parseInt(key.dataset.note, 10);
    const velocity = 100;

    // Trigger the note
    this._audioComponents.instrument.triggerNote(note, velocity);

    // Don't need to update UI here, as the state subscription will handle it
  }

  /**
   * Handle piano key mouse up
   * @param {MouseEvent} event - Mouse event
   * @private
   */
  _handleKeyMouseUp(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    const key = event.currentTarget;
    const note = parseInt(key.dataset.note, 10);

    // Release the note
    this._audioComponents.instrument.releaseNote(note);

    // Don't need to update UI here, as the state subscription will handle it
  }

  /**
   * Handle piano key touch start
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleKeyTouchStart(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    const key = event.currentTarget;
    const note = parseInt(key.dataset.note, 10);
    const velocity = 100;

    // Trigger the note
    this._audioComponents.instrument.triggerNote(note, velocity);

    // Prevent scrolling
    event.preventDefault();
  }

  /**
   * Handle piano key touch end
   * @param {TouchEvent} event - Touch event
   * @private
   */
  _handleKeyTouchEnd(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    const key = event.currentTarget;
    const note = parseInt(key.dataset.note, 10);

    // Release the note
    this._audioComponents.instrument.releaseNote(note);

    // Prevent scrolling
    event.preventDefault();
  }

  /**
   * Handle control change
   * @param {Event} event - Input event
   * @private
   */
  _handleControlChange(event) {
    // Skip if not initialized
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return;
    }

    const control = event.currentTarget;
    const value = parseFloat(control.value);
    const param = control.id;

    // Update parameter
    this._audioComponents.instrument.setParameter(param, value);

    // Update value display
    const valueDisplay = this.shadowRoot.getElementById(`${param}-value`);
    if (valueDisplay) {
      valueDisplay.textContent = value.toFixed(2);
    }

    // Update attribute (to keep it in sync)
    this.setAttribute(param, value);
  }

  /**
   * Update UI with instrument state
   * @param {Object} state - Current instrument state
   * @private
   */
  _updateUI(state) {
    // Check if state has the expected structure
    if (!state || !state.isPlaying || !state.parameters) {
      return;
    }

    // Ensure we're working with Maps (handle both Map instances and plain objects)
    const isPlaying =
      state.isPlaying instanceof Map
        ? state.isPlaying
        : new Map(Object.entries(state.isPlaying));

    // Update piano keys
    const pianoKeys = this.shadowRoot.querySelectorAll('.key');
    pianoKeys.forEach((key) => {
      const noteNumber = parseInt(key.dataset.note, 10);
      const isActive =
        isPlaying.get(noteNumber.toString()) || isPlaying.get(noteNumber);

      if (isActive) {
        key.classList.add('active');
      } else {
        key.classList.remove('active');
      }
    });

    // Update parameter displays
    for (const [key, value] of Object.entries(state.parameters)) {
      const display = this.shadowRoot.getElementById(`${key}-value`);
      if (display && typeof value === 'number') {
        display.textContent = value.toFixed(2);
      }
    }
  }

  /**
   * Update a specific piano key UI state
   * @param {number} note - MIDI note number
   * @param {boolean} isActive - Whether the note is active
   * @private
   */
  _updateKeyUI(note, isActive) {
    const key = this.shadowRoot.querySelector(`.key[data-note="${note}"]`);
    if (key) {
      if (isActive) {
        key.classList.add('active');
      } else {
        key.classList.remove('active');
      }
    }
  }

  /**
   * Public API: Trigger a note
   * @param {number} note - MIDI note number
   * @param {number} velocity - Velocity (0-127)
   * @returns {boolean} Success status
   */
  triggerNote(note, velocity = 100) {
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      console.warn('Cannot trigger note: sampler not initialized');
      return false;
    }

    return this._audioComponents.instrument.triggerNote(note, velocity);
  }

  /**
   * Public API: Release a note
   * @param {number} note - MIDI note number
   * @returns {boolean} Success status
   */
  releaseNote(note) {
    if (
      !this._isInitialized ||
      !this._audioComponents ||
      !this._audioComponents.instrument
    ) {
      return false;
    }

    return this._audioComponents.instrument.releaseNote(note);
  }

  /**
   * Public API: Release all notes
   */
  releaseAll() {
    if (
      this._isInitialized &&
      this._audioComponents &&
      this._audioComponents.instrument
    ) {
      this._audioComponents.instrument.releaseAll();
    }
  }

  /**
   * Public API: Load a new sample
   * @param {string} url - URL of the sample to load
   * @returns {Promise<boolean>} Success status
   */
  async loadSample(url) {
    return this._loadSample(url);
  }

  /**
   * Public API: Get the underlying instrument
   * @returns {Object|null} The instrument instance or null if not initialized
   */
  getInstrument() {
    if (!this._isInitialized || !this._audioComponents) {
      return null;
    }

    return this._audioComponents.instrument;
  }
}

// Register the custom element
customElements.define('sampler-wc', SamplerWC);
