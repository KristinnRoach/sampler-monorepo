// OptimizedLoopWorkletNode.js
// Extends AudioWorkletNode directly for optimized loop control

class OptimizedLoopWorkletNode extends AudioWorkletNode {
  constructor(context, options = {}) {
    super(context, 'loop-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    this.sourceNode = null;

    // Set up message handling from processor
    this.port.onmessage = (event) => {
      if (event.data.type === 'update' && this.sourceNode) {
        // Direct update from audio thread to source node properties
        this.sourceNode.loopStart = event.data.loopStart;
        this.sourceNode.loopEnd = event.data.loopEnd;
      }
    };
  }

  /**
   * Register the processor code with the audio context
   * @param {AudioContext} context - The audio context
   * @returns {Promise} Resolves when registration is complete
   */
  static async registerProcessor(context) {
    // This would typically be in a separate file, but including here for completeness
    const processorCode = `
        class OptimizedLoopProcessor extends AudioWorkletProcessor {
          constructor(options) {
            super(options);
            
            // High resolution timing for processor
            this.sampleRate = sampleRate;
            this.lastTimeUpdate = currentTime;
            
            // Keep track of parameter values for high precision interpolation
            this.currentLoopStart = 0;
            this.currentLoopEnd = 1;
            this.targetLoopStart = 0;
            this.targetLoopEnd = 1;
            this.previousLoopStart = 0;
            this.previousLoopEnd = 1;
            
            // Transition timing
            this.loopStartTransitionEnd = 0;
            this.loopEndTransitionEnd = 0;
            
            // Monitoring update rate (less frequent than processing rate)
            this.updateCounter = 0;
            this.updateInterval = 128; // Update every N samples
          }
          
          process(inputs, outputs, parameters) {
            // Get current parameter values 
            const targetLoopStart = parameters.loopStart[0];
            const targetLoopEnd = parameters.loopEnd[0];
            const rampDuration = parameters.rampDuration[0];
            
            // Get precise timing
            const now = currentTime;
            
            // Check if target values have changed
            if (targetLoopStart !== this.targetLoopStart) {
              // Store previous value before starting new transition
              this.previousLoopStart = this.currentLoopStart;
              this.targetLoopStart = targetLoopStart;
              this.loopStartTransitionEnd = now + rampDuration;
              
              // Log transitions for debugging (only occasionally)
              if (Math.random() < 0.1) {
                console.log("LoopStart transition: " + this.previousLoopStart.toFixed(3) + " → " + targetLoopStart.toFixed(3) + " over " + rampDuration.toFixed(3) + "s");
              }
            }
            
            if (targetLoopEnd !== this.targetLoopEnd) {
              // Store previous value before starting new transition
              this.previousLoopEnd = this.currentLoopEnd;
              this.targetLoopEnd = targetLoopEnd;
              this.loopEndTransitionEnd = now + rampDuration;
              
              // Log transitions for debugging (only occasionally)
              if (Math.random() < 0.1) {
                console.log("LoopEnd transition: " + this.previousLoopEnd.toFixed(3) + " → " + targetLoopEnd.toFixed(3) + " over " + rampDuration.toFixed(3) + "s");
              }
            }
            
            // Perform high-precision interpolation
            if (now < this.loopStartTransitionEnd) {
              // Calculate proper interpolation factor (0 to 1)
              // Correctly calculate progress from start to end of transition
              const progress = (now - (this.loopStartTransitionEnd - rampDuration)) / rampDuration;
              const factor = Math.max(0, Math.min(1, progress));
              
              // Linear interpolation from previous position to target
              // Factor increases from 0 to 1 as time passes
              this.currentLoopStart = this.previousLoopStart + 
                (this.targetLoopStart - this.previousLoopStart) * factor;
            } else {
              this.currentLoopStart = this.targetLoopStart;
            }
            
            if (now < this.loopEndTransitionEnd) {
              // Calculate proper interpolation factor (0 to 1)
              const progress = (now - (this.loopEndTransitionEnd - rampDuration)) / rampDuration;
              const factor = Math.max(0, Math.min(1, progress));
              
              // Linear interpolation from previous position to target
              this.currentLoopEnd = this.previousLoopEnd + 
                (this.targetLoopEnd - this.previousLoopEnd) * factor;
            } else {
              this.currentLoopEnd = this.targetLoopEnd;
            }
            
            // Throttle updates to main thread to avoid overwhelming it
            this.updateCounter++;
            if (this.updateCounter >= this.updateInterval) {
              this.updateCounter = 0;
              
              this.port.postMessage({
                type: 'update',
                loopStart: this.currentLoopStart,
                loopEnd: this.currentLoopEnd
              });
            }
            
            // Keep processor alive
            return true;
          }
          
          static get parameterDescriptors() {
            return [
              {
                name: 'loopStart',
                defaultValue: 0,
                minValue: 0,
                maxValue: 1000,
                automationRate: 'k-rate'
              },
              {
                name: 'loopEnd',
                defaultValue: 1,
                minValue: 0,
                maxValue: 1000,
                automationRate: 'k-rate' 
              },
              {
                name: 'rampDuration',
                defaultValue: 0.1,
                minValue: 0,
                maxValue: 10,
                automationRate: 'k-rate'
              }
            ];
          }
        }
        
        registerProcessor('loop-processor', OptimizedLoopProcessor);
      `;

    // Create a blob URL for the processor code
    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      await context.audioWorklet.addModule(url);
      return true;
    } catch (error) {
      console.error('Failed to register worklet processor:', error);
      throw error;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Connect to a source node to control its loop points
   * @param {AudioBufferSourceNode} sourceNode - The source node to control
   */
  connectToSource(sourceNode) {
    this.sourceNode = sourceNode;

    // Initialize with current loop points
    if (sourceNode.loopStart !== undefined) {
      this.parameters.get('loopStart').value = sourceNode.loopStart;
    }

    if (sourceNode.loopEnd !== undefined) {
      this.parameters.get('loopEnd').value = sourceNode.loopEnd;
    }

    return this;
  }

  /**
   * Set loop start with ramping
   * @param {number} value - Target value
   * @param {number} rampDuration - Duration of the ramp in seconds
   */
  setLoopStart(value, rampDuration = 0.1) {
    const param = this.parameters.get('loopStart');
    const now = this.context.currentTime;

    // Update ramp duration parameter
    this.parameters.get('rampDuration').value = rampDuration;

    // Schedule the parameter change
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + rampDuration);
  }

  /**
   * Set loop end with ramping
   * @param {number} value - Target value
   * @param {number} rampDuration - Duration of the ramp in seconds
   */
  setLoopEnd(value, rampDuration = 0.1) {
    const param = this.parameters.get('loopEnd');
    const now = this.context.currentTime;

    // Update ramp duration parameter
    this.parameters.get('rampDuration').value = rampDuration;

    // Schedule the parameter change
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + rampDuration);
  }

  /**
   * Create and initialize an OptimizedLoopWorkletNode
   * @param {AudioContext} context - Audio context
   * @param {Object} options - Optional configuration
   * @returns {Promise<OptimizedLoopWorkletNode>} The created node
   */
  static async create(context, options = {}) {
    // Register the processor if needed
    await this.registerProcessor(context);

    // Create the node
    return new OptimizedLoopWorkletNode(context, options);
  }
}

export { OptimizedLoopWorkletNode };
