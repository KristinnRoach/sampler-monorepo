// voice.js
export class Voice {
  constructor(context, buffer, destination) {
    this.context = context;
    this.buffer = buffer;
    this.destination = destination;

    this.source = null;
    this.gain = context.createGain();
    this.gain.connect(destination);

    this.isPlaying = false;
    this.startTime = 0;
    this.playbackRate = 1;
    this.noteNumber = null;
  }

  start(time = 0, offset = 0, duration = null) {
    if (this.isPlaying) this.stop();

    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this.playbackRate;
    this.source.connect(this.gain);

    this.source.start(time, offset, duration);
    this.isPlaying = true;
    this.startTime = time;

    // Handle note end if duration is specified
    if (duration) {
      this.source.onended = () => {
        this.isPlaying = false;
        this.noteNumber = null;
      };
    }
  }

  stop(time = 0) {
    if (this.source && this.isPlaying) {
      this.source.stop(time);
      this.isPlaying = false;
      this.noteNumber = null;
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    if (this.source) {
      this.source.playbackRate.value = rate;
    }
  }

  setGain(value, time = 0) {
    this.gain.gain.setValueAtTime(value, time);
  }
}
