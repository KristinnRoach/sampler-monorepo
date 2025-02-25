/**
 * Instrument - Manages polyphonic playback using multiple voices
 * @module Instrument
 */
const Instrument = (function () {
  /**
   * Creates a new instrument instance
   * @param {AudioContext} audioContext - Web Audio API context
   * @param {Object} options - Configuration options
   * @returns {Object} Instrument interface
   */
  function createInstrument(audioContext, options = {}) {
    // Default options
    const defaults = {
      polyphony: 16,
      gain: 0.8,
      buffer: null,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
    };

    const settings = { ...defaults, ...options };

    // Audio nodes
    const output = audioContext.createGain();
    output.gain.value = settings.gain;

    // Voice management
    const voices = [];
    const activeNotes = new Map(); // Maps note numbers to voice indices

    // State management
    const state = {
      isPlaying: new Map(),
      velocity: new Map(),
      parameters: { ...settings },
    };

    // Remove buffer from parameters to avoid serialization issues
    delete state.parameters.buffer;

    // Subscribers for state changes
    const subscribers = [];

    /**
     * Initializes the instrument with voices
     */
    function init() {
      // Create voices
      for (let i = 0; i < settings.polyphony; i++) {
        const voice = Voice.createVoice(audioContext, {
          buffer: settings.buffer,
          loopEnabled: settings.loopEnabled,
          loopStart: settings.loopStart,
          loopEnd: settings.loopEnd,
          attack: settings.attack,
          decay: settings.decay,
          sustain: settings.sustain,
          release: settings.release,
          destination: output,
        });

        voices.push(voice);
      }
    }

    /**
     * Finds an available voice or steals one if needed
     * @returns {number} Index of available voice
     */
    function findAvailableVoice() {
      // First look for completely inactive voices
      for (let i = 0; i < voices.length; i++) {
        if (!voices[i].isActive()) {
          return i;
        }
      }

      // If none available, find the oldest voice (longest playing)
      let oldestStartTime = Infinity;
      let oldestVoiceIndex = 0;

      for (let i = 0; i < voices.length; i++) {
        const voiceState = voices[i].getState();
        if (voiceState.startTime < oldestStartTime) {
          oldestStartTime = voiceState.startTime;
          oldestVoiceIndex = i;
        }
      }

      return oldestVoiceIndex;
    }

    /**
     * Triggers a note
     * @param {number} noteNumber - MIDI note number
     * @param {number} velocity - Velocity (0-127)
     * @returns {boolean} Success indicator
     */
    function triggerNote(noteNumber, velocity = 100) {
      if (!settings.buffer) {
        console.warn('Cannot trigger note: no buffer loaded');
        return false;
      }

      // Check if note is already playing
      if (activeNotes.has(noteNumber)) {
        const existingVoiceIdx = activeNotes.get(noteNumber);
        voices[existingVoiceIdx].stop(true);
        activeNotes.delete(noteNumber);
      }

      // Find voice to use
      const voiceIdx = findAvailableVoice();

      // Start the voice
      const success = voices[voiceIdx].start(noteNumber, velocity);

      if (success) {
        // Map note to voice
        activeNotes.set(noteNumber, voiceIdx);

        // Update state
        state.isPlaying.set(noteNumber, true);
        state.velocity.set(noteNumber, velocity);

        // Notify subscribers
        notifySubscribers();

        return true;
      }

      return false;
    }

    /**
     * Releases a note
     * @param {number} noteNumber - MIDI note number
     * @returns {boolean} Success indicator
     */
    function releaseNote(noteNumber) {
      if (!activeNotes.has(noteNumber)) {
        return false;
      }

      console.log('releeeease');

      const voiceIdx = activeNotes.get(noteNumber);
      const success = voices[voiceIdx].stop();

      console.log(voiceIdx, success);

      if (success) {
        // Note: We don't delete from activeNotes map immediately
        // to prevent note retriggering during release phase

        // Update state
        state.isPlaying.set(noteNumber, false);

        // Notify subscribers
        notifySubscribers();

        // Schedule cleanup after release
        setTimeout(
          () => {
            if (activeNotes.get(noteNumber) === voiceIdx) {
              activeNotes.delete(noteNumber);
            }
          },
          settings.release * 1000 + 50
        );

        return true;
      }

      return false;
    }

    /**
     * Releases all currently playing notes
     */
    function releaseAll() {
      const noteNumbers = [...activeNotes.keys()];

      noteNumbers.forEach((noteNumber) => {
        releaseNote(noteNumber);
      });
    }

    /**
     * Loads an audio buffer to use for all voices
     * @param {AudioBuffer} buffer - Audio buffer to use
     */
    function loadBuffer(buffer) {
      settings.buffer = buffer;

      // Update all voices
      voices.forEach((voice) => {
        voice.setParameter('buffer', buffer);
      });

      // Update state
      state.parameters.buffer = buffer;

      // Notify subscribers
      notifySubscribers();
    }

    /**
     * Updates a parameter value
     * @param {string} key - Parameter name
     * @param {*} value - Parameter value
     */
    function setParameter(key, value) {
      if (key in settings) {
        settings[key] = value;

        // Update the state
        state.parameters[key] = value;

        // Apply to all voices
        voices.forEach((voice) => {
          voice.setParameter(key, value);
        });

        // Special handling for master gain
        if (key === 'gain') {
          output.gain.value = value;
        }

        // Notify subscribers
        notifySubscribers();

        return true;
      }
      return false;
    }

    /**
     * Updates multiple parameters at once
     * @param {Object} params - Object with parameter key-value pairs
     */
    function setParameters(params) {
      let updated = false;

      Object.entries(params).forEach(([key, value]) => {
        if (setParameter(key, value)) {
          updated = true;
        }
      });

      return updated;
    }

    /**
     * Gets the current instrument state
     * @returns {Object} The instrument state
     */
    function getState() {
      return JSON.parse(JSON.stringify(state)); // Return a deep copy
    }

    /**
     * Notifies all subscribers of state changes
     */
    function notifySubscribers() {
      const currentState = getState();
      subscribers.forEach((callback) => {
        try {
          callback(currentState);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }

    /**
     * Subscribes to state changes
     * @param {Function} callback - Function to call on state change
     * @returns {Function} Unsubscribe function
     */
    function subscribe(callback) {
      if (typeof callback !== 'function') {
        throw new Error('Subscriber callback must be a function');
      }

      subscribers.push(callback);

      // Immediately call with current state
      try {
        callback(getState());
      } catch (error) {
        console.error('Error in initial subscriber callback:', error);
      }

      // Return unsubscribe function
      return function unsubscribe() {
        const index = subscribers.indexOf(callback);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      };
    }

    /**
     * Connects the instrument output to a destination node
     * @param {AudioNode} destination - Destination node
     */
    function connect(destination) {
      output.connect(destination);
    }

    /**
     * Disconnects the instrument output
     */
    function disconnect() {
      output.disconnect();
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      // Stop all voices
      voices.forEach((voice) => {
        voice.stop(true);
        voice.disconnect();
      });

      // Clear voice array
      voices.length = 0;

      // Clear maps
      activeNotes.clear();
      state.isPlaying.clear();
      state.velocity.clear();

      // Disconnect output
      output.disconnect();

      // Clear subscribers
      subscribers.length = 0;
    }

    // Initialize
    init();

    // Connect to provided destination if given
    if (options.destination) {
      connect(options.destination);
    }

    // Public interface
    return {
      triggerNote,
      releaseNote,
      releaseAll,
      loadBuffer,
      setParameter,
      setParameters,
      getState,
      subscribe,
      connect,
      disconnect,
      cleanup,
    };
  }

  return {
    createInstrument,
  };
})();

// Export for browser or CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Instrument;
} else {
  window.Instrument = Instrument;
}
