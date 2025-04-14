// TestLoopWorkletNode.js
// Simplified version using native AudioParam automation

import { TestWorkletNode } from './TestWorkletNode.js';

export class TestLoopWorkletNode extends TestWorkletNode {
  sourceNode = null;

  /**
   * Connect the loop processor to a source node without audio routing
   * @param {AudioBufferSourceNode} sourceNode - The AudioBufferSourceNode to control loop points for
   * @returns {boolean} Success status
   */
  connectToSource(sourceNode) {
    this.sourceNode = sourceNode;
    // No audio routing through the worklet - we only need parameter control
    return true;
  }

  /**
   * Set loop start point with optional scheduling and ramp duration
   * @param {number} value - Loop start position in seconds
   * @param {number} [time] - When to schedule the change (defaults to now)
   * @param {number} [rampDuration] - Duration of the ramp in seconds (defaults to 0.1)
   */
  setLoopStart(value, time, rampDuration = 0.1) {
    const currentTime = this.context.currentTime;
    const targetTime = time || currentTime;

    // Use Web Audio's built-in parameter automation
    this.parameters
      .get('loopStart')
      .linearRampToValueAtTime(value, targetTime + rampDuration);
  }

  /**
   * Set loop end point with optional scheduling and ramp duration
   * @param {number} value - Loop end position in seconds
   * @param {number} [time] - When to schedule the change (defaults to now)
   * @param {number} [rampDuration] - Duration of the ramp in seconds (defaults to 0.1)
   */
  setLoopEnd(value, time, rampDuration = 0.1) {
    const currentTime = this.context.currentTime;
    const targetTime = time || currentTime;

    // Use Web Audio's built-in parameter automation
    this.parameters
      .get('loopEnd')
      .linearRampToValueAtTime(value, targetTime + rampDuration);
  }

  /**
   * Factory method to create a LoopWorkletNode
   * @param {BaseAudioContext} context - Audio context
   * @param {WorkletManager} manager - Worklet manager instance
   * @returns {Promise<TestLoopWorkletNode>} The created node
   */
  static async create(context, manager) {
    // Define parameters
    const params = [
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1000,
        automationRate: 'k-rate', // Block-rate automation is sufficient for loop points
      },
      {
        name: 'loopEnd',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1000,
        automationRate: 'k-rate',
      },
    ];

    // Define minimal process function - no audio processing, just parameter monitoring
    const processFunction = function (inputs, outputs, parameters) {
      // Get current parameter values
      const loopStart = parameters.loopStart[0];
      const loopEnd = parameters.loopEnd[0];

      // Send updated loop points to main thread
      this.port.postMessage({
        type: 'update',
        loopStart: loopStart,
        loopEnd: loopEnd,
      });

      // No audio processing needed
      return true;
    };

    // Create the node
    const node = await TestWorkletNode.create(context, manager, {
      processorName: 'loop',
      processFunction,
      params,
      nodeOptions: { numberOfInputs: 1, numberOfOutputs: 1 },
    });

    // Convert to our specialized class
    Object.setPrototypeOf(node, TestLoopWorkletNode.prototype);

    // Set up port message handling on the node
    node.port.onmessage = (event) => {
      if (event.data.type === 'update' && node.sourceNode) {
        node.sourceNode.loopStart = event.data.loopStart;
        node.sourceNode.loopEnd = event.data.loopEnd;
      }
    };

    return node;
  }
}
