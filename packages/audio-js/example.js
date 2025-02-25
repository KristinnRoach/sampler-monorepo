/**
 * Audiolib Usage Example
 * Shows how to use the core components together
 */

// Initialize audio context manager
const audioManager = AudioContextManager.create();
const audioContext = audioManager.getContext();

// Make sure audio is running (needs to be called in response to user interaction)
document.addEventListener(
  'click',
  async () => {
    try {
      await audioManager.ensureContextRunning();
      document.getElementById('status').textContent = 'Audio engine started';

      // Load a sample sound
      const sampleBuffer = await audioManager.loadAudioFile(
        './assets/piano-c4.mp3'
      );
      document.getElementById('status').textContent =
        'Sample loaded successfully';

      // Create an instrument
      const piano = Instrument.createInstrument(audioContext, {
        buffer: sampleBuffer,
        polyphony: 8,
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 0.8,
      });

      // Connect to master output
      audioManager.connectToMaster(piano);

      // Subscribe to state changes
      const unsubscribe = piano.subscribe((state) => {
        console.log('Piano state updated:', state);
        updateUI(state);
      });

      // Set up keyboard controls
      setupKeyboardControls(piano);

      // Store for cleanup
      window.audioComponents = {
        manager: audioManager,
        instrument: piano,
        unsubscribe,
      };

      // Enable UI controls
      document.querySelectorAll('.control').forEach((el) => {
        el.removeAttribute('disabled');
      });
    } catch (error) {
      console.error('Failed to start audio engine:', error);
      document.getElementById('status').textContent = 'Error: ' + error.message;
    }
  },
  { once: true }
);

/**
 * Updates the UI with instrument state
 * @param {Object} state - Current instrument state
 */
function updateUI(state) {
  // Check if state has the expected structure
  if (!state || !state.isPlaying || !state.velocity || !state.parameters) {
    console.warn('Invalid state structure:', state);
    return;
  }

  // Ensure we're working with Maps (handle both Map instances and plain objects)
  const isPlaying =
    state.isPlaying instanceof Map
      ? state.isPlaying
      : new Map(Object.entries(state.isPlaying));
  const velocity =
    state.velocity instanceof Map
      ? state.velocity
      : new Map(Object.entries(state.velocity));

  // Update active note indicators
  document.querySelectorAll('.key').forEach((el) => {
    const noteNumber = parseInt(el.dataset.note, 10);
    if (isPlaying.get(noteNumber.toString()) || isPlaying.get(noteNumber)) {
      el.classList.add('active');
      // Update velocity display if needed
      const velocityValue =
        velocity.get(noteNumber.toString()) || velocity.get(noteNumber) || 0;
      el.style.opacity = (velocityValue / 127) * 0.5 + 0.5;
    } else {
      el.classList.remove('active');
      el.style.opacity = 1;
    }
  });

  // Update parameter displays
  for (const [key, value] of Object.entries(state.parameters)) {
    const el = document.getElementById(`param-${key}`);
    if (el) {
      if (typeof value === 'number') {
        el.textContent = value.toFixed(2);
      } else if (typeof value === 'boolean') {
        el.textContent = value ? 'On' : 'Off';
      } else if (value === null || value === undefined) {
        el.textContent = 'N/A';
      } else {
        el.textContent = String(value);
      }
    }
  }
}

/**
 * Sets up keyboard event listeners
 * @param {Object} instrument - Instrument instance
 */
function setupKeyboardControls(instrument) {
  // Map from keyboard keys to MIDI note numbers
  const keyMap = {
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

  // Handle key down events
  document.addEventListener('keydown', (event) => {
    // Ignore if interacting with form elements
    if (event.target.matches('textarea')) {
      return;
    }

    const key = event.code;
    if (key in keyMap && !event.repeat) {
      const note = keyMap[key];
      // Use a velocity that scales with key location (just for fun)
      const velocity = Math.round(70 + Math.random() * 40);
      instrument.triggerNote(note, velocity);
      event.preventDefault();
    }
  });

  // Handle key up events
  document.addEventListener('keyup', (event) => {
    const key = event.code;
    if (key in keyMap) {
      const note = keyMap[key];
      instrument.releaseNote(note);
      event.preventDefault();
    }
  });

  // Handle UI key clicks (for touch devices)
  document.querySelectorAll('.key').forEach((el) => {
    el.addEventListener('mousedown', () => {
      const note = parseInt(el.dataset.note, 10);
      const velocity = 100;
      instrument.triggerNote(note, velocity);
    });

    el.addEventListener('mouseup', () => {
      const note = parseInt(el.dataset.note, 10);
      instrument.releaseNote(note);
    });

    // Touch support
    el.addEventListener('touchstart', (event) => {
      const note = parseInt(el.dataset.note, 10);
      const velocity = 100;
      instrument.triggerNote(note, velocity);
      event.preventDefault();
    });

    el.addEventListener('touchend', (event) => {
      const note = parseInt(el.dataset.note, 10);
      instrument.releaseNote(note);
      event.preventDefault();
    });
  });
}

// Parameter controls
document.querySelectorAll('input[type="range"][data-param]').forEach((el) => {
  el.addEventListener('input', () => {
    const param = el.dataset.param;
    const value = parseFloat(el.value);

    if (window.audioComponents && window.audioComponents.instrument) {
      window.audioComponents.instrument.setParameter(param, value);
    }
  });
});

// Toggle controls
document
  .querySelectorAll('input[type="checkbox"][data-param]')
  .forEach((el) => {
    el.addEventListener('change', () => {
      const param = el.dataset.param;
      const value = el.checked;

      if (window.audioComponents && window.audioComponents.instrument) {
        window.audioComponents.instrument.setParameter(param, value);
      }
    });
  });

// Cleanup function when page unloads
window.addEventListener('beforeunload', () => {
  if (window.audioComponents) {
    // Clean up subscription
    if (window.audioComponents.unsubscribe) {
      window.audioComponents.unsubscribe();
    }

    // Clean up instrument
    if (window.audioComponents.instrument) {
      window.audioComponents.instrument.cleanup();
    }

    // Clean up audio context manager
    if (window.audioComponents.manager) {
      window.audioComponents.manager.cleanup();
    }
  }
});
