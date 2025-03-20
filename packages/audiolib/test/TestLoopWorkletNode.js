// TestLoopWorkletNode.js
// Extends TestWorkletNode with loop functionality

import { TestWorkletNode } from './TestWorkletNode.js';

export class TestLoopWorkletNode extends TestWorkletNode {
  sourceNode = null;
  stable = false;

  /**
   * Connect the loop processor to a source node and set up message handling
   * @param {AudioBufferSourceNode} sourceNode - The AudioBufferSourceNode to control loop points for
   * @returns {boolean} Success status
   */
  connectToSource(sourceNode) {
    this.sourceNode = sourceNode;
    sourceNode.connect(this);
    this.connect(this.context.destination);

    // Initialize the processor with current loop points
    this.port.postMessage({
      type: 'init',
      loopStart: sourceNode.loopStart,
      loopEnd: sourceNode.loopEnd,
    });

    return true;
  }

  /**
   * Set loop start point with optional scheduling
   * @param {number} value - Loop start position in seconds
   * @param {number} [time] - When to schedule the change (defaults to now)
   */
  setLoopStart(value, time) {
    this.setParam('loopStart', value, time);
  }

  /**
   * Set loop end point with optional scheduling
   * @param {number} value - Loop end position in seconds
   * @param {number} [time] - When to schedule the change (defaults to now)
   */
  setLoopEnd(value, time) {
    this.setParam('loopEnd', value, time);
  }

  /**
   * Set interpolation speed for smooth transitions
   * @param {number} value - Interpolation speed (0.001 to 1.0)
   * @param {number} [time] - When to schedule the change (defaults to now)
   */
  setInterpolationSpeed(value, time) {
    this.setParam('interpolationSpeed', value, time);
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
      },
      {
        name: 'loopEnd',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1000,
      },
      {
        name: 'interpolationSpeed',
        defaultValue: 0.05,
        minValue: 0.001,
        maxValue: 1.0,
      },
    ];

    // Custom message handler for the processor
    const messageHandler = function (event) {
      if (event.data.type === 'init') {
        // Initialize with source node's current settings if needed
        this.currentLoopStart = event.data.loopStart || 0;
        this.currentLoopEnd = event.data.loopEnd || 1;
      }
    };

    // Define process function - based on loop-processor.js
    const processFunction = function (inputs, outputs, parameters) {
      // Pass through audio unmodified
      const input = inputs[0];
      const output = outputs[0];

      // Get parameter values
      const targetLoopStart = parameters.loopStart[0];
      const targetLoopEnd = parameters.loopEnd[0];
      const interpolationSpeed = parameters.interpolationSpeed[0];

      // Track if anything has changed
      const minChange = 0.00005; // Small threshold
      const hasChanges =
        Math.abs(targetLoopStart - this.currentLoopStart) > minChange ||
        Math.abs(targetLoopEnd - this.currentLoopEnd) > minChange;

      // Only do interpolation and send messages if there are changes
      if (hasChanges) {
        // Smoothly interpolate loop points
        this.currentLoopStart +=
          (targetLoopStart - this.currentLoopStart) * interpolationSpeed;
        this.currentLoopEnd +=
          (targetLoopEnd - this.currentLoopEnd) * interpolationSpeed;

        // Send updated loop points while interpolating to main thread (check usage there)
        this.port.postMessage({
          type: 'update',
          loopStart: this.currentLoopStart,
          loopEnd: this.currentLoopEnd,
        });
      }

      // Pass audio through unchanged
      for (
        let channel = 0;
        channel < input.length && channel < output.length;
        channel++
      ) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        for (let i = 0; i < inputChannel.length; i++) {
          outputChannel[i] = inputChannel[i];
        }
      }

      return true;
    };

    // Create the node with initial state variables
    const node = await TestWorkletNode.create(context, manager, {
      processorName: 'loop',
      processFunction,
      params,
      nodeOptions: { numberOfInputs: 1, numberOfOutputs: 1 },
      processorOptions: {
        state: {
          currentLoopStart: 0,
          currentLoopEnd: 1,
        },
        messageHandler,
      },
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
