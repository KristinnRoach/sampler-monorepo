export class SamplePlayer extends AudioWorkletNode {
  constructor(context, options = {}) {
    super(context, 'sample-player-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      channelCount: 2,
      ...options,
    });

    this.isPlaying = false;
    this.startTime = 0;
    this.noteId = null;

    this.port.onmessage = (event) => {
      if (event.data.type === 'voice:ended') {
        this.isPlaying = false;
        this.noteId = null;
        this.dispatchEvent(new CustomEvent('ended'));
      }
    };
  }

  setBuffer(buffer) {
    this.port.postMessage({
      type: 'voice:set_buffer',
      buffer: buffer
        ? Array.from({ length: buffer.numberOfChannels }, (_, i) =>
            buffer.getChannelData(i)
          )
        : null,
    });
    return this;
  }

  play(noteId, pitch, velocity, when = this.context.currentTime) {
    this.isPlaying = true;
    this.startTime = when;
    this.noteId = noteId;

    // Set parameters
    this.parameters.get('playbackRate').value = Math.pow(2, (pitch - 60) / 12);
    this.parameters.get('velocity').value = velocity / 127;

    // for testing BEFORE adding envelope:
    this.parameters.get('envGain').value = 1.0;

    this.port.postMessage({
      type: 'voice:start',
      when,
    });

    return this;
  }

  release(when = this.context.currentTime) {
    this.port.postMessage({ type: 'voice:release', when });
    return this;
  }

  stop() {
    this.port.postMessage({ type: 'voice:stop' });
    this.isPlaying = false;
    this.noteId = null;
    return this;
  }

  connect(destination) {
    super.connect(destination);
    return this;
  }
}
