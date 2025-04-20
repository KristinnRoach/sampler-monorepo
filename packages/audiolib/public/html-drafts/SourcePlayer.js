class SourcePlayer extends AudioWorkletNode {
  constructor(context, options = {}) {
    // Pass the processor name and options to the parent constructor
    super(context, 'source-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      processorOptions: options.processorOptions || {},
    });

    // Don't set context property, it's already set by the parent class
    this._isPlaying = false;
    this._duration = options.duration || 0;

    // Set up parameter properties
    this.playbackRate = this.parameters.get('playbackRate');
    this.loop = this.parameters.get('loop');
    this.loopStart = this.parameters.get('loopStart');
    this.loopEnd = this.parameters.get('loopEnd');

    // Set up message handling
    this.port.onmessage = this._handleMessage.bind(this);

    // Set up event target
    this._eventListeners = {
      ended: [],
      started: [],
      looped: [],
    };
  }

  // Event handling
  addEventListener(type, callback) {
    if (this._eventListeners[type]) {
      this._eventListeners[type].push(callback);
    }
  }

  removeEventListener(type, callback) {
    if (this._eventListeners[type]) {
      this._eventListeners[type] = this._eventListeners[type].filter(
        (cb) => cb !== callback
      );
    }
  }

  _dispatchEvent(type, detail = {}) {
    if (this._eventListeners[type]) {
      const event = { type, detail, target: this };
      this._eventListeners[type].forEach((cb) => cb(event));
    }
  }

  // Handle messages from processor
  _handleMessage(event) {
    const data = event.data;

    if (data.type === 'ended') {
      this._isPlaying = false;
      this._dispatchEvent('ended');
    } else if (data.type === 'looped') {
      this._dispatchEvent('looped', { loopCount: data.loopCount });
    }
  }

  // API methods
  async loadBuffer(buffer, sampleRate) {
    // Convert buffer if needed
    const bufferData = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      bufferData.push(buffer.getChannelData(i).slice());
    }

    this.port.postMessage({
      type: 'setBuffer',
      buffer: bufferData,
      sampleRate: sampleRate || this.context.sampleRate,
      duration: buffer.duration,
    });

    this._duration = buffer.duration;

    // Return this for method chaining
    return this;
  }

  play(options = {}) {
    const { offset = 0, duration } = options;

    this.port.postMessage({
      type: 'start',
      time: this.context.currentTime,
      offset,
      duration,
    });

    this._isPlaying = true;
    this._dispatchEvent('started', { offset });

    return this;
  }

  stop() {
    if (!this._isPlaying) return this;

    this.port.postMessage({
      type: 'stop',
      time: this.context.currentTime,
    });

    return this;
  }

  setLoop(enabled, start = 0, end = null) {
    this.loop.setValueAtTime(enabled ? 1 : 0, this.context.currentTime);

    if (start !== undefined) {
      this.loopStart.setValueAtTime(start, this.context.currentTime);
    }

    if (end !== null) {
      this.loopEnd.setValueAtTime(end, this.context.currentTime);
    } else if (this._duration) {
      this.loopEnd.setValueAtTime(this._duration, this.context.currentTime);
    }

    return this;
  }

  setRate(rate) {
    this.playbackRate.setValueAtTime(rate, this.context.currentTime);
    return this;
  }

  // Properties
  get isPlaying() {
    return this._isPlaying;
  }

  get duration() {
    return this._duration;
  }
}
