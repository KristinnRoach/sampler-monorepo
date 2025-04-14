// LoopController.js
// A simple controller for AudioBufferSourceNode loop points

export class LoopController {
  constructor(context) {
    this.context = context;
    this.sourceNode = null;
    this.loopWorklet = null;
    this.isReady = false;
  }

  /**
   * Initialize the controller by loading the worklet processor
   * @returns {Promise} Resolves when initialization is complete
   */
  async init() {
    try {
      // Load the worklet processor
      await this.context.audioWorklet.addModule('./loop-processor.js');

      // Create worklet node
      this.loopWorklet = new AudioWorkletNode(this.context, 'loop-processor', {
        numberOfInputs: 0, // No audio inputs needed
        numberOfOutputs: 1, // No audio outputs needed
      });

      // Set up message handling
      this.loopWorklet.port.onmessage = (event) => {
        if (event.data.type === 'update' && this.sourceNode) {
          this.sourceNode.loopStart = event.data.loopStart;
          this.sourceNode.loopEnd = event.data.loopEnd;

          // Dispatch event for UI updates if needed
          const customEvent = new CustomEvent('loopupdate', {
            detail: {
              loopStart: event.data.loopStart,
              loopEnd: event.data.loopEnd,
            },
          });
          window.dispatchEvent(customEvent);
        }
      };

      this.isReady = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize LoopController:', err);
      return false;
    }
  }

  /**
   * Connect to a source node to control its loop points
   * @param {AudioBufferSourceNode} source - The source node to control
   */
  connectToSource(source) {
    if (!this.isReady) {
      console.error('LoopController not initialized');
      return false;
    }

    this.sourceNode = source;

    // Initialize worklet with source's current loop points
    this.loopWorklet.parameters.get('loopStart').value = source.loopStart || 0;
    this.loopWorklet.parameters.get('loopEnd').value = source.loopEnd || 1;

    return true;
  }

  /**
   * Set the loop start position with a smooth transition
   * @param {number} value - The target loop start value in seconds
   * @param {number} [rampDuration=0.1] - Duration of the transition in seconds
   */
  setLoopStart(value, rampDuration = 0.1) {
    if (!this.isReady) return;

    const param = this.loopWorklet.parameters.get('loopStart');
    const now = this.context.currentTime;

    // Cancel any scheduled automation
    param.cancelScheduledValues(now);

    // Schedule the ramp
    param.linearRampToValueAtTime(value, now + rampDuration);
  }

  /**
   * Set the loop end position with a smooth transition
   * @param {number} value - The target loop end value in seconds
   * @param {number} [rampDuration=0.1] - Duration of the transition in seconds
   */
  setLoopEnd(value, rampDuration = 0.1) {
    if (!this.isReady) return;

    const param = this.loopWorklet.parameters.get('loopEnd');
    const now = this.context.currentTime;

    // Cancel any scheduled automation
    param.cancelScheduledValues(now);

    // Schedule the ramp
    param.linearRampToValueAtTime(value, now + rampDuration);
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.sourceNode = null;
    this.loopWorklet = null;
  }
}
