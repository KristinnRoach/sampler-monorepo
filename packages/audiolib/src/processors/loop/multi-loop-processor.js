// multi-loop-processor.js
class MultiLoopProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor(options) {
    super(options);
    this.port.onmessage = this.handleMessage.bind(this);
    this.lastLoopStart = 0;
    this.lastLoopEnd = 1;

    // Detect significant changes to avoid micro-updates
    this.updateThreshold = 0.0009556; // Threshold for reporting changes // C6 in ms
  }

  handleMessage(event) {
    if (event.data && event.data.type === 'config') {
      if (event.data.updateThreshold !== undefined) {
        this.updateThreshold = event.data.updateThreshold;
      }
    }
  }

  process(inputs, outputs, parameters) {
    const loopStart = parameters.loopStart[0];
    const loopEnd = parameters.loopEnd[0];

    // Store loop duration (we will use this for a future feature, keeping as a reminder)
    const loopDuration = loopEnd - loopStart;

    // Compare with threshold to avoid flooding with tiny changes
    const startDiff = Math.abs(loopStart - this.lastLoopStart);
    const endDiff = Math.abs(loopEnd - this.lastLoopEnd);

    if (startDiff > this.updateThreshold) {
      this.port.postMessage({
        type: 'update-loop-start',
        loopStart: loopStart,
      });

      this.lastLoopStart = loopStart;
    }

    if (endDiff > this.updateThreshold) {
      this.port.postMessage({
        type: 'update-loop-end',
        loopEnd: loopEnd,
      });

      this.lastLoopEnd = loopEnd;
    }

    return true; // Keep the processor alive
  }
}

// Register the processor
registerProcessor('multi-loop-processor', MultiLoopProcessor);
