class LoopControlProcessor extends AudioWorkletProcessor {
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

  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);
    this.lastLoopStart = 0;
    this.lastLoopEnd = 1;

    // Only detect significant changes to avoid micro-updates
    this.threshold = 0.0009556; // currently C6 in ms for no reason..
  }

  handleMessage(event) {
    if (event.data && event.data.type === 'config') {
      if (event.data.updateThreshold !== undefined) {
        this.threshold = event.data.updateThreshold;
      }
    }
  }

  process(inputs, outputs, parameters) {
    const loopStart = parameters.loopStart[0]; // ?.[0] ?? 0;
    const loopEnd = parameters.loopEnd[0]; //?.[0] ?? 1;

    // Store loop duration (we will use this for a future feature, keeping as a reminder)
    const loopDuration = loopEnd - loopStart;

    // Compare with threshold to avoid flooding with tiny changes
    const startDiff = Math.abs(loopStart - this.lastLoopStart);
    const endDiff = Math.abs(loopEnd - this.lastLoopEnd);

    if (startDiff > this.threshold || endDiff > this.threshold) {
      this.port.postMessage({
        type: 'update',
        loopStart: loopStart,
        loopEnd: loopEnd,
      });

      // Update last values
      this.lastLoopStart = loopStart;
      this.lastLoopEnd = loopEnd;
    }

    return true;
  }
}

registerProcessor('loop-control-processor', LoopControlProcessor);
