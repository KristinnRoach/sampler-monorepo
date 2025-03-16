class LoopProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'loopStart', defaultValue: 0 },
      { name: 'loopEnd', defaultValue: 1 },
      { name: 'interpolationSpeed', defaultValue: 0.05 },
    ];
  }

  constructor() {
    super();
    this.currentLoopStart = 0;
    this.currentLoopEnd = 1;
    this.port.onmessage = (event) => {
      if (event.data.type === 'init') {
        // Initialize with source node's current settings if needed
        this.currentLoopStart = event.data.loopStart || 0;
        this.currentLoopEnd = event.data.loopEnd || 1;
      }
    };
  }

  process(inputs, outputs, parameters) {
    // Pass through audio unmodified
    const input = inputs[0];
    const output = outputs[0];

    // Get parameter values
    const targetLoopStart = parameters.loopStart[0];
    const targetLoopEnd = parameters.loopEnd[0];
    const interpolationSpeed = parameters.interpolationSpeed[0];

    // Smoothly interpolate loop points
    this.currentLoopStart +=
      (targetLoopStart - this.currentLoopStart) * interpolationSpeed;
    this.currentLoopEnd +=
      (targetLoopEnd - this.currentLoopEnd) * interpolationSpeed;

    // Send updated loop points to main thread to update the AudioBufferSourceNode
    this.port.postMessage({
      type: 'update',
      loopStart: this.currentLoopStart,
      loopEnd: this.currentLoopEnd,
    });

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
  }
}

registerProcessor('loop-processor', LoopProcessor);
//registerProcessor('LoopProcessorWorkletProcessor', LoopProcessor); // Todo: fix name, should be 'loop-processor'
