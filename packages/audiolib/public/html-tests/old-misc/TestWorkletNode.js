// TestWorkletNode.js
// Extends AudioWorkletNode with enhanced functionality

import { TestWorkletManager } from './TestWorkletManager.js';
import { getStandardizedAWPNames } from './worklet-utils.js';

export class TestWorkletNode extends AudioWorkletNode {
  /**
   * Create a new TestWorkletNode
   */
  constructor(context, standardizedWAPNames, options = {}) {
    super(context, standardizedWAPNames.registryName, options);

    this.connections = new Map();
  }

  /**
   * Connect this node to another node, tracking the connection
   */
  connect(destination, outputIndex = 0, inputIndex = 0) {
    super.connect(destination, outputIndex, inputIndex);
    this.connections.set(destination, [outputIndex, inputIndex]);
    return destination;
  }

  /**
   * Disconnect this node from another node, removing from tracking
   */
  disconnect(destination) {
    super.disconnect(destination);
    this.connections.delete(destination);
  }

  /**
   * Set a parameter value with optional timing
   */
  setParam(name, value, time = 0) {
    const param = this.parameters.get(name);
    if (!param) {
      console.warn(`Parameter "${name}" not found`);
      return false;
    }

    if (time > 0) {
      // TODO: set TARGET at time
      param.setValueAtTime(value, this.context.currentTime + time);
    } else {
      param.value = value;
    }

    return true;
  }

  /**
   * Enable or disable the processor
   */
  setActive(active) {
    this.port.postMessage({ active });
  }

  /**
   * Factory method to create a node with a specific processor
   */
  static async create(context, manager, options = {}) {
    const {
      processorName,
      processFunction,
      params = [],
      nodeOptions = {},
      processorOptions = {},
    } = options;

    const { className, registryName } = getStandardizedAWPNames(processorName);

    // Generate and register the processor code
    const processorCode = manager.generateProcessorCode(
      { className, registryName },
      processFunction,
      params,
      processorOptions
    );

    await manager.registerProcessor(context, processorCode, registryName);

    // Create the node instance
    return new TestWorkletNode(
      context,
      { className, registryName },
      nodeOptions
    );
  }
}

// usage-example.js
// Example of how to use the TestWorkletNode and TestWorkletManager

async function createOscillatorNode(audioContext) {
  const manager = new TestWorkletManager();

  // Define processor parameters
  const params = [
    { name: 'frequency', defaultValue: 440, minValue: 20, maxValue: 20000 },
    { name: 'gain', defaultValue: 0.5, minValue: 0, maxValue: 1 },
  ];

  // Define the processing function
  const processFunction = function (inputs, outputs, parameters) {
    const output = outputs[0];
    const frequency = parameters.frequency;
    const gain = parameters.gain;

    // Simple sine wave oscillator
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];

      for (let i = 0; i < outputChannel.length; ++i) {
        // Get parameter value (handle both constant and automation)
        const f = frequency.length > 1 ? frequency[i] : frequency[0];
        const g = gain.length > 1 ? gain[i] : gain[0];

        // Time is based on sample rate (usually 44100 or 48000)
        const sampleTime = currentTime + i / sampleRate;
        // Simple sine oscillator
        outputChannel[i] = g * Math.sin(2 * Math.PI * f * sampleTime);
      }
    }
  };

  // Create the oscillator node
  const oscillator = await TestWorkletNode.create(audioContext, manager, {
    processorName: 'sineosc',
    processFunction,
    params,
    nodeOptions: {
      outputChannelCount: [2], // Stereo output
    },
  });

  return oscillator;
}

// Test usage
async function test() {
  const audioContext = new AudioContext();
  try {
    // Create an oscillator
    const oscillator = await createOscillatorNode(audioContext);

    // Connect to audio output
    oscillator.connect(audioContext.destination);

    // Set parameters
    oscillator.setParam('frequency', 880); // A5
    oscillator.setParam('gain', 0.3);

    console.log('Oscillator created and connected!');

    // After 2 seconds, change frequency
    setTimeout(() => {
      oscillator.setParam('frequency', 659.25); // E5
      console.log('Changed frequency!');
    }, 2000);

    // After 4 seconds, stop
    setTimeout(() => {
      oscillator.setActive(false);
      console.log('Stopped oscillator!');
    }, 4000);
  } catch (error) {
    console.error('Error creating oscillator:', error);
  }
}

// Run the test
// test();
