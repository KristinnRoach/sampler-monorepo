// sampleNode.js
export class SampleNode {
  constructor(context = null) {
    this.contextManager = AudioContextManager.getInstance();
    this.context = context || this.contextManager.getContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);

    this.voices = new Map(); // Map of active voices by note number
    this.buffer = null;
    this.polyphony = 16; // Maximum number of simultaneous voices

    // Voice pool for polyphony management
    this.voicePool = [];
  }

  async initialize() {
    if (!this.context) {
      this.context = await this.contextManager.initialize();
    }
    return this;
  }

  async loadBuffer(audioBuffer) {
    this.buffer = audioBuffer;
    // Initialize voice pool
    this.voicePool = Array(this.polyphony)
      .fill(null)
      .map(() => new Voice(this.context, this.buffer, this.masterGain));
    return this;
  }

  // Get next available voice from pool
  getVoice() {
    // First, try to find a voice that's not playing
    let voice = this.voicePool.find((v) => !v.isPlaying);

    // If all voices are playing, steal the oldest one
    if (!voice) {
      voice = this.voicePool.reduce((oldest, current) => {
        if (!oldest || current.startTime < oldest.startTime) {
          return current;
        }
        return oldest;
      });
    }

    return voice;
  }

  // MIDI note handling
  noteOn(noteNumber, velocity = 1, time = 0) {
    if (!this.buffer) return;

    // Calculate playback rate for the note
    // Assuming the sample is recorded at middle C (MIDI note 60)
    const baseFrequency = 440 * Math.pow(2, (60 - 69) / 12); // Frequency of middle C
    const targetFrequency = 440 * Math.pow(2, (noteNumber - 69) / 12);
    const playbackRate = targetFrequency / baseFrequency;

    // Get a voice from the pool
    const voice = this.getVoice();
    if (!voice) return;

    // Configure and start the voice
    voice.noteNumber = noteNumber;
    voice.setPlaybackRate(playbackRate);
    voice.setGain(velocity);
    voice.start(time);

    // Store the voice reference
    this.voices.set(noteNumber, voice);
  }

  noteOff(noteNumber, time = 0) {
    const voice = this.voices.get(noteNumber);
    if (voice) {
      // Apply a brief release envelope
      const releaseTime = time + 0.1;
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, time);
      voice.gain.gain.linearRampToValueAtTime(0, releaseTime);

      // Schedule the voice to stop
      setTimeout(
        () => {
          voice.stop();
          this.voices.delete(noteNumber);
        },
        (releaseTime - time) * 1000
      );
    }
  }

  // Utility methods
  setMasterGain(value) {
    this.masterGain.gain.value = value;
  }

  stopAll() {
    this.voicePool.forEach((voice) => voice.stop());
    this.voices.clear();
  }

  dispose() {
    this.stopAll();
    this.masterGain.disconnect();
    this.voicePool = [];
    this.voices.clear();
    this.buffer = null;
  }
}
