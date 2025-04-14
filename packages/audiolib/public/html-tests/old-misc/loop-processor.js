// loop-processor.js
class LoopProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'loopStart',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1000,
        automationRate: 'k-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1000,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor(options) {
    super(options);

    // Set up port for messaging with main thread
    this.port.onmessage = this.handleMessage.bind(this);

    // Last parameter values sent
    this.lastLoopStart = null;
    this.lastLoopEnd = null;

    // Throttle update frequency (avoid sending too many messages)
    this.updateCounter = 0;
    this.updateRate = 10; // Send every N process calls
  }

  handleMessage(event) {
    // Handle any messages from the main thread
  }
  process(inputs, outputs, parameters) {
    const loopStart = parameters.loopStart[0]; // ?.[0] ?? 0;
    const loopEnd = parameters.loopEnd[0]; //?.[0] ?? 1;

    // Throttle updates to avoid flooding the main thread
    this.updateCounter++;
    if (this.updateCounter >= this.updateRate) {
      this.updateCounter = 0;

      // Only send update if values changed
      if (loopStart !== this.lastLoopStart || loopEnd !== this.lastLoopEnd) {
        this.lastLoopStart = loopStart;
        this.lastLoopEnd = loopEnd;

        this.port.postMessage({
          type: 'update',
          loopStart: loopStart,
          loopEnd: loopEnd,
        });
      }
    }

    return true; // Keep the processor alive
  }
}

// Register the processor
registerProcessor('loop-processor', LoopProcessor);
