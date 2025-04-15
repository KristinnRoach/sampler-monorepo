// Helper function to handle timing and scheduling
function scheduleTiming(currentTime, startTime, stopTime) {
  return {
    isPlaying:
      currentTime >= startTime && (stopTime === null || currentTime < stopTime),
    progress: currentTime - startTime,
  };
}

// dictionary AudioWorkletNodeOptions : AudioNodeOptions {
//   unsigned long numberOfInputs = 1;
//   unsigned long numberOfOutputs = 1;
//   sequence<unsigned long> outputChannelCount;
//   record<DOMString, double> parameterData;
//   object processorOptions;
// };

// 1.32.4.3.1. Dictionary AudioWorkletNodeOptions Members
// numberOfInputs, of type unsigned long, defaulting to 1
// This is used to initialize the value of the AudioNode numberOfInputs attribute.

// numberOfOutputs, of type unsigned long, defaulting to 1
// This is used to initialize the value of the AudioNode numberOfOutputs attribute.

// outputChannelCount, of type sequence<unsigned long>
// This array is used to configure the number of channels in each output.

// parameterData, of type record<DOMString, double>
// This is a list of user-defined key-value pairs that are used to set the initial value of an AudioParam with the matched name in the AudioWorkletNode.

// processorOptions, of type object
// This holds any user-defined data that may be used to initialize custom properties in an AudioWorkletProcessor instance that is associated with the AudioWorkletNode.

class SourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'playbackRate',
        defaultValue: 1.0,
        minValue: 0.1,
        maxValue: 10.0,
        automationRate: 'a-rate',
      },
      {
        name: 'loopStart',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1000.0,
        automationRate: 'a-rate',
      },
      {
        name: 'loopEnd',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1000.0,
        automationRate: 'a-rate',
      },
      {
        name: 'loop',
        defaultValue: 0.0,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'a-rate',
      },
    ];
  }

  constructor(options) {
    super(); // ? Never args to super ?

    // Initialize default state
    this.buffer = []; // or null
    this.sampleRate = 48000;
    this.playbackPosition = 0;
    this.isLooping = false;
    this.startTime = null;
    this.stopTime = null;
    this.startOffset = 0;
    this.duration = undefined;
    this.endTime = null;

    // Initialize the options with defaults in case values are missing
    const processorOptions = options?.processorOptions || {};
    const audioData = processorOptions.audioData;

    if (
      processorOptions.audioData &&
      Array.isArray(processorOptions.audioData)
    ) {
      console.log('Processor received audioData:', {
        channels: processorOptions.audioData.length,
        firstChannelLength: processorOptions.audioData[0]?.length,
        firstFewSamples: processorOptions.audioData[0]?.slice(0, 10),
        hasNonZero: processorOptions.audioData[0]?.some((v) => v !== 0),
      });

      this.buffer = processorOptions.audioData;
    }

    const sampleRate = processorOptions.sampleRate;
    if (!!sampleRate) this.sampleRate = sampleRate;

    console.debug(
      `processor constructor audiodata: ${audioData}, SR: ${sampleRate}`
    );

    if (audioData && Array.isArray(audioData)) {
      console.debug(
        `Processor constructor received audioData, 
         setting buffer: ${typeof audioData},
        ${audioData}`
      );
      this.buffer = audioData;
    }

    if (sampleRate) {
      console.debug(
        `Processor constructor: 
         setting received sampleRate: ${sampleRate}`
      );
      this.sampleRate = sampleRate;
    }

    // Handle messages from main thread
    this.port.onmessage = (event) => {
      const data = event.data;

      if (data.type === 'setBuffer') {
        // ? how/where is this.buffer and this.sampleRate defined..? todo: make all this crap opbvious
        this.buffer = data.buffer;
        this.sampleRate = data.sampleRate;

        console.warn(
          `PROCESSOR setBuffer message - this.buffer: ${this.buffer}. samplerate: ${this.sampleRate}, - incoming event data: ${data}`
        );
      } else if (data.type === 'start') {
        this.startTime = data.time;
        this.startOffset = data.offset;
        this.duration = data.duration;
        if (this.duration !== undefined) {
          this.endTime = this.startTime + this.duration;
        } else if (data.type === 'noteOn') {
          this.currentNote = data.midiNote;
          this.velocity = data.velocity;
          // Reset to beginning of buffer for new note if multi play (or non-legato monophonic)
          // this.playbackPosition = 0;
        }

        // Initialize playback position based on offset
        this.playbackPosition = Math.floor(this.startOffset * this.sampleRate);
      } else if (data.type === 'stop') {
        this.stopTime = data.time;
      }
    };
  }

  process(inputs, outputs, parameters) {
    // Get output channel data
    const output = outputs[0];
    const numChannels = output.length;

    // Skip processing if no buffer or channels
    if (
      !this.buffer ||
      !this.buffer.length ||
      numChannels === 0 ||
      !this.startTime
    ) {
      // More informative debug logging
      console.log('Skipping processing:', {
        hasBuffer: !!this.buffer,
        bufferLength: this.buffer?.length,
        numChannels,
        startTime: this.startTime,
      });
      return true;
    }

    // ? maybe not needed: fixes for currentFrame reference
    // const currentTime = currentFrame / sampleRate;
    // try replacing with:
    // const currentTime = currentFrame / this.sampleRate;
    // oor this:
    // const currentTime =
    //   this.currentTime !== undefined
    //     ? this.currentTime
    //     : currentFrame / sampleRate;

    //!_____not sure bout this built in time but worth a shot_______//
    // CLAUDE says: "Use the built-in currentTime property"
    const currentTime = this.currentTime;

    // Get parameter values
    const playbackRate = parameters.playbackRate; // || [1.0];
    const loopStart = parameters.loopStart; // || [0.0];
    const loopEnd = parameters.loopEnd; // || [0.0];
    const loop = parameters.loop; // || [0.0];

    // Single-value vs. audio-rate parameters
    const isPlaybackRateConstant = playbackRate.length === 1;
    const isLoopStartConstant = loopStart.length === 1;
    const isLoopEndConstant = loopEnd.length === 1;
    const isLoopConstant = loop.length === 1;

    // Get buffer info
    const bufferLength = this.buffer[0].length;

    // Check playback timing relative to current time
    const timing = scheduleTiming(currentTime, this.startTime, this.stopTime);

    if (!timing.isPlaying) {
      // Fill output with silence if not playing
      for (let c = 0; c < numChannels; c++) {
        const outputChannel = output[c];
        for (let i = 0; i < outputChannel.length; i++) {
          outputChannel[i] = 0;
        }
      }

      // Check if we need to notify that playback ended
      if (
        this.startTime !== null &&
        (currentTime >= this.stopTime ||
          (this.endTime !== null && currentTime >= this.endTime))
      ) {
        this.port.postMessage({ type: 'ended' });
        this.startTime = null; // Prevent multiple ended events
      }

      return true;
    }

    // Process each sample in the current block
    for (let i = 0; i < output[0].length; i++) {
      // Get parameter values for this sample
      const pbRate = isPlaybackRateConstant ? playbackRate[0] : playbackRate[i];
      const loopS = isLoopStartConstant ? loopStart[0] : loopStart[i];
      const loopE = isLoopEndConstant ? loopEnd[0] : loopEnd[i];
      const shouldLoop = isLoopConstant ? loop[0] > 0.5 : loop[i] > 0.5;

      // Calculate loop points in samples
      const loopStartSample = Math.floor(loopS * this.sampleRate);
      const loopEndSample = Math.min(
        Math.floor(loopE * this.sampleRate),
        bufferLength - 1
      );

      // Check duration-based ending
      if (
        this.endTime !== null &&
        currentTime + i / sampleRate >= this.endTime
      ) {
        // Fill remaining samples with silence
        for (let c = 0; c < numChannels; c++) {
          output[c][i] = 0;
        }

        // Only send ended message once
        if (i === 0) {
          this.port.postMessage({ type: 'ended' });
          this.startTime = null;
        }

        continue;
      }

      // Handle looping logic
      if (shouldLoop && this.playbackPosition >= loopEndSample) {
        this.playbackPosition = loopStartSample;
      }

      // Check if we've reached the end of the buffer
      if (this.playbackPosition >= bufferLength) {
        if (shouldLoop) {
          this.playbackPosition = loopStartSample;
        } else {
          // End of buffer reached without looping
          for (let c = 0; c < numChannels; c++) {
            output[c][i] = 0;
          }

          // Only send ended message once
          if (i === 0) {
            this.port.postMessage({ type: 'ended' });
            this.startTime = null;
          }

          continue;
        }
      }

      // Read sample with basic interpolation for fractional positions
      const position = Math.floor(this.playbackPosition);
      const fraction = this.playbackPosition - position;
      const nextPosition = Math.min(position + 1, bufferLength - 1);

      for (let c = 0; c < numChannels; c++) {
        const bufferChannel = this.buffer[Math.min(c, this.buffer.length - 1)];
        const current = bufferChannel[position];
        const next = bufferChannel[nextPosition];
        const velocityGain = this.velocity || 1.0;

        // Linear interpolation between samples
        output[c][i] = (current + fraction * (next - current)) * velocityGain;
      }

      // Advance playback position
      this.playbackPosition += pbRate;
    }

    return true;
  }
}

registerProcessor('source-processor', SourceProcessor);
