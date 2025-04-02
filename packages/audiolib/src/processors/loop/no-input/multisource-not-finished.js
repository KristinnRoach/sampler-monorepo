class NoInLoopNode extends AudioWorkletNode {
  constructor(context, options = {}) {
    // Create the worklet node with proper options
    super(context, 'no-in-loop-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1, // dummy output (can't be zero)
      processorOptions: options.processorOptions || {},
    });

    // Store reference to source node
    this.sourceNodes = [];

    // Keep track of current loop values
    this.currentLoopStart = 0;
    this.currentLoopEnd = 0.5;

    // Configure the significant change threshold (optional)
    const significantChange = options.significantChange || 0.001;
    this.port.postMessage({
      type: 'config',
      significantChange,
    });

    // Set up message handling from the processor
    this.port.onmessage = this.handleProcessorMessage.bind(this);
  }

  addSourceNode(sourceNode) {
    if (!(sourceNode instanceof AudioBufferSourceNode)) {
      throw new Error('The provided node must be an AudioBufferSourceNode');
    }

    sourceNode.loopStart = this.currentLoopStart;
    sourceNode.loopEnd = this.currentLoopEnd;

    this.sourceNodes.push(sourceNode);
    return this; // For method chaining
  }

  removeSourceNode(sourceNode) {
    const index = this.sourceNodes.indexOf(sourceNode);
    if (index !== -1) {
      this.sourceNodes.splice(index, 1);
    }
    return this;
  }

  clearSourceNodes() {
    this.sourceNodes = [];
    return this;
  }

  // Set the loop start time (in seconds)
  setLoopPoint(param, value, timeConstant = 0) {
    if (!this.sourceNodes.length) {
      throw new Error('No source node connected');
    }

    if (timeConstant <= 0) {
      // Immediate change
      this.sourceNodes.loopStart = value;
      this.parameters.get(param).value = value;
      return this;
    }

    // For small values, use linearRampToValueAtTime which can handle zero
    if (value < 0.01) {
      this.parameters
        .get(param)
        .linearRampToValueAtTime(
          value,
          this.context.currentTime + timeConstant
        );
    } else {
      this.parameters
        .get(param)
        .exponentialRampToValueAtTime(
          value,
          this.context.currentTime + timeConstant
        );
    }

    return this; // For method chaining
  }

  // Handle messages from the processor
  handleProcessorMessage(event) {
    if (event.data && event.data.type === 'update' && this.sourceNodes) {
      // Update the source node's loop properties
      this.sourceNodes.loopStart = event.data.loopStart;
      this.sourceNodes.loopEnd = event.data.loopEnd;
    }
  }
}

// Helper function to load the worklet processor
async function createLoopController(audioContext) {
  // Check if the worklet is already loaded
  if (!audioContext.audioWorklet) {
    throw new Error('AudioWorklet not supported in this browser');
  }

  try {
    // Load the processor if not already loaded
    await audioContext.audioWorklet.addModule('./no-in-loop-processor.js');
    return new NoInLoopNode(audioContext);
  } catch (error) {
    console.error('Failed to load loop processor worklet:', error);
    throw error;
  }
}

export { NoInLoopNode, createLoopController };

// // example-usage.js
// import { createLoopController } from './loop-worklet-node.js';

// // Set up the audio context
// const audioContext = new AudioContext();

// async function setupLoopingExample() {
//   try {
//     // Load audio sample
//     const response = await fetch('sample.wav');
//     const arrayBuffer = await response.arrayBuffer();
//     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

//     // Create and configure source node
//     const sourceNode = audioContext.createBufferSource();
//     sourceNode.buffer = audioBuffer;
//     sourceNode.loop = true; // Enable looping

//     // Create the loop controller and connect it to the source
//     const loopController = await createLoopController(audioContext);
//     loopController.connectToSource(sourceNode);

//     // Connect the source to the output and start playback
//     sourceNode.connect(audioContext.destination);
//     sourceNode.start();

//     // Set initial loop points
//     loopController.setLoopStart(1.0);
//     loopController.setLoopEnd(3.0);

//     // Example: Gradually change loop points after 2 seconds
//     setTimeout(() => {
//       console.log('Changing loop points gradually...');

//       // Smoothly change loop start over 1 second
//       loopController.setLoopStart(1.5, 1);

//       // Smoothly change loop end over 2 seconds
//       loopController.setLoopEnd(2.5, 2);
//     }, 2000);

//     // Example: Instantly change loop points after 6 seconds
//     setTimeout(() => {
//       console.log('Changing loop points instantly...');
//       loopController.setLoopStart(0.5);
//       loopController.setLoopEnd(4.0);
//     }, 6000);

//     return {
//       sourceNode,
//       loopController,
//       // Return a function that allows for external control
//       changeLoopPoints: (start, end, interpolationTime = 0) => {
//         loopController.setLoopStart(start, interpolationTime);
//         loopController.setLoopEnd(end, interpolationTime);
//       }
//     };

//   } catch (error) {
//     console.error('Error setting up loop example:', error);
//   }
// }

// // Run the example when document is ready
// document.addEventListener('DOMContentLoaded', () => {
//   // Create UI controls or start the example directly
//   setupLoopingExample().then(controller => {
//     window.loopController = controller; // Make available for console testing
//   });
// });
