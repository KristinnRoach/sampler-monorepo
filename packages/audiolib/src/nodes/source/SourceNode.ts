import { NodeID } from '@/types/global';
import { createNodeId } from '@/store/IdStore';

function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class SourceNode extends AudioWorkletNode {
  readonly nodeId: NodeID;

  static isProcessorRegistered: boolean = false;

  #startCalled: boolean;
  #stopTime: number | null;
  #context: BaseAudioContext;

  playbackRate: AudioParam;
  loopStart: AudioParam;
  loopEnd: AudioParam;
  loop: AudioParam;

  constructor(context: BaseAudioContext, options: any = {}) {
    super(context, 'source-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [options.channelCount || 2],
      processorOptions: {
        buffer: options.buffer ? bufferToFloat32Arrays(options.buffer) : null,
        sampleRate: context.sampleRate,
      },
    });

    this.nodeId = createNodeId();
    this.#context = context;
    this.#startCalled = false;
    this.#stopTime = null;

    // Store references to AudioParams for convenient access
    this.playbackRate = (this.parameters as any).get('playbackRate')!;
    this.loopStart = (this.parameters as any).get('loopStart')!;
    this.loopEnd = (this.parameters as any).get('loopEnd')!;
    this.loop = (this.parameters as any).get('loop')!;

    if (options.buffer) {
      this.buffer = options.buffer;
    }

    // Add event handling for processor notifications
    this.port.onmessage = (event: MessageEvent) => {
      if (event.data.type === 'ended') {
        this.#onEnded();
      }
    };
  }

  setLoopEnabled(enabled: boolean): SourceNode {
    const value = enabled ? 1.0 : 0.0;
    this.loop.setValueAtTime(value, this.#context.currentTime);
    return this;
  }

  // Buffer accessor
  set buffer(newBuffer: AudioBuffer) {
    if (newBuffer) {
      const bufferData = bufferToFloat32Arrays(newBuffer);
      this.port.postMessage({
        type: 'setBuffer',
        buffer: bufferData,
        sampleRate: this.#context.sampleRate,
      });
    }
  }

  playNote(
    midiNote: number,
    velocity: number = 1.0,
    startTime?: number
  ): SourceNode {
    const time = startTime ?? this.#context.currentTime;
    const frequency = midiNoteToFrequency(midiNote);

    const baseFrequency = 440; // A4
    const playbackRatio = frequency / baseFrequency;

    this.playbackRate.setValueAtTime(playbackRatio, time);

    this.port.postMessage({
      type: 'noteOn',
      midiNote: midiNote,
      velocity: velocity,
      time: time,
    });

    if (!this.#startCalled) {
      this.start(time);
    }

    return this;
  }

  start(when = 0, offset = 0, duration?: number): SourceNode {
    if (this.#startCalled) {
      throw new Error('Start method already called');
    }

    this.#startCalled = true;
    const startTime = Math.max(this.#context.currentTime, when);

    this.port.postMessage({
      type: 'start',
      time: startTime,
      offset: offset,
      duration: duration,
    });

    return this;
  }

  stop(when = 0): SourceNode {
    if (!this.#startCalled) {
      throw new Error('Cannot call stop without calling start first');
    }

    // Only proceed if stop hasn't been called already
    if (this.#stopTime === null) {
      this.#stopTime = Math.max(this.#context.currentTime, when);

      this.port.postMessage({
        type: 'stop',
        time: this.#stopTime,
      });
    }

    return this;
  }

  #onEnded(): void {
    const event = new Event('ended');
    this.dispatchEvent(event);
  }

  setOnEnded(callback: () => void): any {
    this.addEventListener('ended', callback);
    return this;
  }

  dispose(): void {
    console.log(`Disposing node with ID: ${this.nodeId}`);
    // todo: optimize for performance
    this.stop();
    this.port.close();
    this.disconnect();
    this.#context = null as any; // Clear context reference
    this.#startCalled = false;
    this.#stopTime = null;
    this.buffer = null as any; // Clear buffer reference
    this.playbackRate = null as any; // Clear playbackRate reference
    this.loopStart = null as any; // Clear loopStart reference
    this.loopEnd = null as any; // Clear loopEnd reference
    this.loop = null as any; // Clear loop reference
  }

  static async registerProcessor(context: BaseAudioContext): Promise<boolean> {
    if (this.isProcessorRegistered) {
      return true;
    }
    const processorCode = `
        // Helper function to handle timing and scheduling
        function scheduleTiming(currentTime, startTime, stopTime) {
          return {
            isPlaying: currentTime >= startTime && (stopTime === null || currentTime < stopTime),
            progress: currentTime - startTime
          };
        }
        
        class SourceProcessor extends AudioWorkletProcessor {
          constructor(options) {
            super(options);
            
            // Initialize state
            this.buffer = options.processorOptions.buffer || null;
            this.sampleRate = options.processorOptions.sampleRate || sampleRate;
            this.playbackPosition = 0;
            this.isLooping = false;
            this.startTime = null;
            this.stopTime = null;
            this.startOffset = 0;
            this.duration = undefined;
            this.endTime = null;
            
            // Handle messages from main thread
            this.port.onmessage = (event) => {
              const data = event.data;
              
              if (data.type === 'setBuffer') {
                this.buffer = data.buffer;
                this.sampleRate = data.sampleRate;
              }
              else if (data.type === 'start') {
                this.startTime = data.time;
                this.startOffset = data.offset;
                this.duration = data.duration;
                
                if (this.duration !== undefined) {
                  this.endTime = this.startTime + this.duration;
                }

                else if (data.type === 'noteOn') {
                  this.currentNote = data.midiNote;
                  this.velocity = data.velocity;

                  if (this.startTime === null) {
                    this.startTime = data.time;
                  }

                  // Reset to beginning of buffer for new note (optional)
                  this.playbackPosition = 0;
}
                
                // Initialize playback position based on offset
                this.playbackPosition = Math.floor(this.startOffset * this.sampleRate);
              }
              else if (data.type === 'stop') {
                this.stopTime = data.time;
              }
            };
          }
          
          process(inputs, outputs, parameters) {
            // Get output channel data
            const output = outputs[0];
            const numChannels = output.length;
            
            // Skip processing if no buffer or channels
            if (!this.buffer || numChannels === 0 || !this.startTime) {
              return true;
            }

            const currentTime = currentFrame / sampleRate;

            
            // Get parameter values
            const playbackRate = parameters.playbackRate;
            const loopStart = parameters.loopStart;
            const loopEnd = parameters.loopEnd;
            const loop = parameters.loop;
            
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
              if (this.startTime !== null && 
                  (currentTime >= this.stopTime || 
                   (this.endTime !== null && currentTime >= this.endTime))) {
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
              if (this.endTime !== null && currentTime + i/sampleRate >= this.endTime) {
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
          
          static get parameterDescriptors() {
            return [
              {
                name: 'playbackRate',
                defaultValue: 1.0,
                minValue: 0.1,
                maxValue: 10.0,
                automationRate: 'a-rate'
              },
              {
                name: 'loopStart',
                defaultValue: 0.0,
                minValue: 0.0,
                maxValue: 1000.0,
                automationRate: 'a-rate'
              },
              {
                name: 'loopEnd',
                defaultValue: 0.0,
                minValue: 0.0, 
                maxValue: 1000.0,
                automationRate: 'a-rate'
              },
              {
                name: 'loop',
                defaultValue: 0.0,
                minValue: 0.0,
                maxValue: 1.0,
                automationRate: 'a-rate'
              }
            ];
          }
        }
        
        registerProcessor('source-processor', SourceProcessor);
      `;

    const blob = new Blob([processorCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      await context.audioWorklet.addModule(url);

      this.isProcessorRegistered = true;
      return true;
    } catch (error) {
      console.error('Failed to register worklet processor:', error);
      throw error;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  static async create(
    context: BaseAudioContext,
    options: any = {}
  ): Promise<SourceNode> {
    await this.registerProcessor(context);
    return new SourceNode(context, options);
  }
}

// Helper function to convert AudioBuffer to transferable arrays
function bufferToFloat32Arrays(audioBuffer: AudioBuffer): Float32Array[] {
  const arrays: Float32Array[] = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    arrays.push(audioBuffer.getChannelData(i));
  }
  return arrays;
}

export { SourceNode };
