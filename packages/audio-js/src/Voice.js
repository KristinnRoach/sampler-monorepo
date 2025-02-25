/**
 * Voice - Handles single-note playback with envelope control
 * @module Voice
 */
const Voice = (function () {
  /**
   * Creates a new voice instance
   * @param {AudioContext} audioContext - Web Audio API context
   * @param {Object} options - Configuration options
   * @returns {Object} Voice interface
   */
  function createVoice(audioContext, options = {}) {
    // Default options
    const defaults = {
      buffer: null,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      detune: 0,
    };

    const settings = { ...defaults, ...options };

    // Audio nodes
    let source = null;
    const gain = audioContext.createGain();
    gain.gain.value = 0; // Start silent

    // State tracking
    let isPlaying = false;
    let noteNumber = -1;
    let velocity = 0;
    let startTime = 0;
    let releaseTime = 0;

    /**
     * Starts playback of a note
     * @param {number} note - MIDI note number
     * @param {number} vel - Velocity (0-127)
     */
    function start(note, vel) {
      if (!settings.buffer) {
        console.warn('Cannot start voice: no buffer loaded');
        return;
      }

      // If already playing, clean up first
      if (isPlaying) {
        stop(true);
      }

      try {
        // Create and configure source
        source = audioContext.createBufferSource();
        source.buffer = settings.buffer;

        if (settings.loopEnabled && settings.loopEnd > settings.loopStart) {
          source.loop = true;
          source.loopStart = settings.loopStart;
          source.loopEnd = settings.loopEnd;
        }

        // Apply detune based on note (if not using sample pitch)
        // if (settings.detune !== 0) {
        // Convert note to detune value (100 cents per semitone)
        const baseMidiNote = options.baseMidiNote || 60; // Middle C by default
        source.detune.value = (note - baseMidiNote) * 100 + settings.detune;
        // }

        // Connect source to gain node
        source.connect(gain);

        // Apply attack envelope
        const now = audioContext.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(0, now);

        // Scale velocity (0-127) to gain (0.0-1.0) with curve
        const velocityGain = Math.min(1.0, (vel / 127) ** 1.5);
        const peakGain = velocityGain * settings.sustain;

        // ADSR envelope
        gain.gain.linearRampToValueAtTime(velocityGain, now + settings.attack);
        gain.gain.linearRampToValueAtTime(
          peakGain,
          now + settings.attack + settings.decay
        );

        // Start playback
        source.start(now);
        startTime = now;

        // Update state
        isPlaying = true;
        noteNumber = note;
        velocity = vel;
        releaseTime = 0;

        return true;
      } catch (error) {
        console.error('Error starting voice:', error);
        return false;
      }
    }

    /**
     * Stops playback with release stage
     * @param {boolean} immediate - If true, stops immediately without release
     */
    function stop(immediate = false) {
      if (!isPlaying || !source) {
        return false;
      }

      const now = audioContext.currentTime;

      console.log('dvjwuio');

      try {
        if (immediate) {
          // Immediate stop
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0, now);
          source.stop(now);
        } else {
          // Apply release
          releaseTime = now;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + settings.release);

          // Stop source after release
          source.stop(now + settings.release + 0.01);
        }

        // Clean up after stopping
        setTimeout(
          () => {
            if (source) {
              source.disconnect();
              source = null;
            }
            isPlaying = false;
          },
          (immediate ? 0 : settings.release * 1000) + 50
        );

        return true;
      } catch (error) {
        console.error('Error stopping voice:', error);
        return false;
      }
    }

    /**
     * Checks if the voice is currently in use
     * @returns {boolean} True if voice is playing
     */
    function isActive() {
      if (!isPlaying) return false;

      // Check if we're in release phase and it's complete
      if (releaseTime > 0) {
        const releaseEnd = releaseTime + settings.release;
        if (audioContext.currentTime >= releaseEnd) {
          isPlaying = false;
          return false;
        }
      }

      return true;
    }

    /**
     * Updates a voice parameter
     * @param {string} key - Parameter name
     * @param {*} value - Parameter value
     */
    function setParameter(key, value) {
      if (key in settings) {
        settings[key] = value;

        // Apply certain parameter changes immediately
        if (source && isPlaying) {
          switch (key) {
            case 'loopEnabled':
              source.loop = value;
              break;
            case 'loopStart':
              if (source.loop) source.loopStart = value;
              break;
            case 'loopEnd':
              if (source.loop) source.loopEnd = value;
              break;
            case 'detune':
              if (settings.detune !== 0 && noteNumber >= 0) {
                const baseMidiNote = settings.baseMidiNote || 60;
                source.detune.value = (noteNumber - baseMidiNote) * 100 + value;
              }
              break;
          }
        }

        return true;
      }
      return false;
    }

    /**
     * Connects the voice output to another node
     * @param {AudioNode} destination - Destination node
     */
    function connect(destination) {
      gain.connect(destination);
    }

    /**
     * Disconnects the voice output
     */
    function disconnect() {
      gain.disconnect();
    }

    /**
     * Gets the current voice state
     * @returns {Object} Voice state object
     */
    function getState() {
      return {
        isPlaying,
        noteNumber,
        velocity,
        startTime,
        releaseTime,
      };
    }

    // Connect to provided destination if given
    if (options.destination) {
      connect(options.destination);
    }

    // Public interface
    return {
      start,
      stop,
      isActive,
      setParameter,
      connect,
      disconnect,
      getState,
    };
  }

  return {
    createVoice,
  };
})();

// Export for browser or CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Voice;
} else {
  window.Voice = Voice;
}
