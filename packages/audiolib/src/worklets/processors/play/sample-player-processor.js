import { PlaybackTiming } from '../utils/PlaybackTiming';

const MIN_ABS_AMPLITUDE = 0.05; // for now

// Todo: create with input handler callbacks if importing issues are not resolved easily
// import { globalKeyboardInput } from '../../../../input';

class SamplePlayerProcessor extends AudioWorkletProcessor {
  // #keyboardHandler;

  constructor() {
    super();

    /* STATE */

    // Data
    this.buffer = null;
    this.playbackPosition = 0;
    this.loopCount = 0;
    this.timing = new PlaybackTiming();

    // FLAGS
    this.isPlaying = false;
    this.isReleasing = false;
    this.loopEnabled = false;
    this.usePlaybackPosition = false;

    /* Message handling */
    this.port.onmessage = (event) => {
      const { type, value, buffer, startOffset, duration, when } = event.data;

      switch (type) {
        case 'voice:init':
          this.timing = new PlaybackTiming();
          this.usePlaybackPosition = false;
          this.loopEnabled = false;

          // this.enableKeyboard();
          // globalKeyboardInput.addHandler(this.#onNoteOn);
          break;

        case 'voice:set_buffer':
          this.isPlaying = false;
          this.timing.clear();
          this.playbackPosition = 0;
          this.loopCount = 0;
          this.buffer = buffer;
          break;

        case 'voice:start':
          this.isReleasing = false;
          this.timing.start(when, startOffset || 0, duration);
          this.playbackPosition = (startOffset || 0) * sampleRate;
          this.isPlaying = true;

          this.port.postMessage({
            type: 'voice:started',
            time: currentTime,
          });
          break;

        case 'voice:release':
          this.isReleasing = true;
          break;

        case 'voice:stop':
          this.timing.stop(currentTime);
          this.isPlaying = false;
          this.isReleasing = false;
          break;

        case 'setLoopEnabled':
          this.loopEnabled = value;
          break;

        case 'voice:usePlaybackPosition':
          this.usePlaybackPosition = value;
          break;
      }
    };
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'playbackPosition',
        defaultValue: 0,
        minValue: 0,
        automationRate: 'k-rate',
      },
      {
        name: 'envGain',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate',
      },
      {
        name: 'velocity',
        defaultValue: 100,
        minValue: 0,
        maxValue: 127,
        automationRate: 'k-rate',
      },
      {
        name: 'playbackRate',
        defaultValue: 1,
        minValue: -4,
        maxValue: 4,
        automationRate: 'a-rate',
      },
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

  // enableKeyboard() {
  //   // if (!this.#keyboardHandler) {
  //   // this.#keyboardHandler = {
  //   //   onNoteOn: this.#onNoteOn.bind(this),
  //   //   onNoteOff: this.#onNoteOff.bind(this),
  //   //   // onBlur: this.#onBlur.bind(this),
  //   // };
  //   document.addEventListener('keydown', this.#onNoteOn);
  //   document.addEventListener('keyup', this.#onNoteOff);
  //   // } else {
  //   //   console.debug(`keyboard already enabled`);
  //   // }
  // }

  // disableKeyboard() {
  //   // if (this.#keyboardHandler) {
  //   //   globalKeyboardInput.removeHandler(this.#keyboardHandler);
  //   //   this.#keyboardHandler = null;
  //   // } else {
  //   //   console.debug(`keyboard already disabled`);
  //   // }

  //   document.removeEventListener('keydown', this.#onNoteOn);
  //   document.removeEventListener('keyup', this.#onNoteOff);
  // }

  // #onNoteOn(midiNote, velocity, modifiers) {
  //   console.warn(`ON: ${(midinote, velocity, modifiers)}`);

  //   this.isReleasing = false;
  //   this.timing.start(currentTime, 0, null);
  //   this.playbackPosition = 0;
  //   this.isPlaying = true;

  //   // this.port.postMessage({
  //   //   type: 'voice:started',
  //   //   time: currentTime,
  //   // });
  // }

  // #onNoteOff(midiNote, modifiers) {
  //   console.warn(`${(midinote, modifiers)}`);

  //   this.isReleasing = true;
  // }

  #fillWithSilence(output) {
    for (let channel = 0; channel < output.length; channel++) {
      output[channel].fill(0);
    }
  }

  #onended(output) {
    this.isPlaying = false;
    this.isReleasing = false;
    if (this.timing) this.timing.clear();
    this.playbackPosition = 0;
    this.port.postMessage({ type: 'voice:ended' });
  }

  #shouldEnd(parameters) {
    return (
      !this.buffer ||
      !this.buffer.length ||
      !this.isPlaying ||
      this.timing.shouldStop(currentTime) ||
      (this.isReleasing && parameters.envGain[0] <= MIN_ABS_AMPLITUDE)
    );
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    // Todo: re-design flags to be set by input events and listen for them here
    if (!output || this.#shouldEnd(parameters)) {
      this.#onended(output);
      return true; // AudioWorklet will zero-fill automatically
    }

    const pbRate = parameters.playbackRate[0];
    const loopStart = parameters.loopStart[0] * sampleRate;
    const loopEnd = parameters.loopEnd[0] * sampleRate;
    const envelopeGain = parameters.envGain[0];
    const velocityGain = parameters.velocity[0]; // seems to be already normalized from midi values

    const numChannels = Math.min(output.length, this.buffer.length);
    const bufferLength = this.buffer[0].length;

    if (!this.timing.isActive(currentTime)) {
      console.error('timing not active');
      this.#onended(output);
      return true;
    }

    // Process samples
    for (let i = 0; i < output[0].length; i++) {
      // Handle looping
      if (this.loopEnabled && this.playbackPosition >= loopEnd) {
        this.playbackPosition = loopStart;
        this.loopCount++;
        this.port.postMessage({
          type: 'voice:looped',
          loopCount: this.loopCount,
        });
      }

      // Check for end of buffer
      if (this.playbackPosition >= bufferLength) {
        if (!this.loopEnabled) {
          // || this.isReleasing) {
          // this.timing.shouldStop(currentTime)) {
          this.#onended(output);
          return true;
        }
        this.playbackPosition = 0; // ? loopend === bufferLength
      }

      // Read and interpolate samples
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, bufferLength - 1);

      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];

        output[c][i] =
          (current + fraction * (next - current)) * velocityGain * envelopeGain;
      }

      // Advance playback position
      this.playbackPosition += pbRate;
    }

    if (this.usePlaybackPosition) {
      this.port.postMessage({
        type: 'voice:position',
        position: this.playbackPosition / sampleRate,
        // seconds: playbackTime,
        // amplitude: output[0][output.length - 1],
      });
    }

    return true;
  }
}

registerProcessor('sample-player-processor', SamplePlayerProcessor);
