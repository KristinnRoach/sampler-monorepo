/**
 * AudioContextManager - Singleton factory for managing the Web Audio API context
 * @module AudioContextManager
 */
const AudioContextManager = (function () {
  let instance = null;

  /**
   * Creates or retrieves the AudioContext singleton
   * @returns {Object} AudioContextManager interface
   */
  function create() {
    if (instance) {
      return instance;
    }

    // Use AudioContext with appropriate fallbacks
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    const context = new AudioCtx();
    let masterGain = context.createGain();
    masterGain.connect(context.destination);

    /**
     * Ensures audio context is running (handles autoplay policy)
     * @returns {Promise} Resolves when context is running
     */
    function ensureContextRunning() {
      if (context.state === 'running') {
        return Promise.resolve();
      }

      if (context.state === 'suspended') {
        return context.resume();
      }

      return new Promise((resolve, reject) => {
        if (context.state === 'closed') {
          reject(new Error('AudioContext is closed and cannot be resumed'));
        } else {
          // For any other state, try to resume
          context.resume().then(resolve).catch(reject);
        }
      });
    }

    /**
     * Loads an audio file from URL
     * @param {string} url - URL of audio file to load
     * @returns {Promise<AudioBuffer>} Promise resolving to decoded audio data
     */
    function loadAudioFile(url) {
      return fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to load audio file: ${response.status} ${response.statusText}`
            );
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => context.decodeAudioData(arrayBuffer));
    }

    /**
     * Sets the master volume
     * @param {number} value - Volume level (0.0 to 1.0)
     */
    function setMasterVolume(value) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        console.warn('Master volume must be between 0.0 and 1.0');
        return;
      }
      masterGain.gain.value = value;
    }

    /**
     * Creates a connection to the master output
     * @param {AudioNode} node - Audio node to connect
     */
    function connectToMaster(node) {
      node.connect(masterGain);
    }

    /**
     * Cleans up resources
     */
    function cleanup() {
      if (context.state !== 'closed') {
        // Disconnect master gain
        masterGain.disconnect();
        // Close context when done
        context.close();
      }
      instance = null;
    }

    instance = {
      getContext: () => context,
      ensureContextRunning,
      loadAudioFile,
      setMasterVolume,
      connectToMaster,
      cleanup,
    };

    return instance;
  }

  return {
    create,
  };
})();

// Export for browser or CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioContextManager;
} else {
  window.AudioContextManager = AudioContextManager;
}
