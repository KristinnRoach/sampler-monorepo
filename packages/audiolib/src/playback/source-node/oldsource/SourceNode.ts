import { sourceProcessorCode } from './worklet-code.js';
import { AudiolibWorkletNode } from '../../../base/AudiolibNode.js';
import { WorkletMessage } from '../../../utils/worklet-utils.js';

/**
 * SourceNode - Audio source player using AudioWorklet
 * Extends the BaseWorkletNode class for common functionality
 */
export class SourceNode extends AudiolibWorkletNode {
  private isPlaying = false;
  private isLoaded = false;

  /**
   * Get the processor name
   */
  protected getProcessorName(): string {
    return 'source-processor';
  }

  /**
   * Get the embedded processor code
   */
  protected getEmbeddedCode(): string | undefined {
    return sourceProcessorCode;
  }

  /**
   * Handle messages from the worklet
   */
  protected handleMessage(event: MessageEvent<WorkletMessage>): void {
    if (event.data.type === 'update') {
      // Handle parameter updates
      if (event.data.data?.isPlaying !== undefined) {
        this.isPlaying = event.data.data.isPlaying;
      }
    } else if (event.data.type === 'positionUpdate') {
      // Handle position updates if needed
      // This could emit an event for UI updates, etc.
    }
  }

  /**
   * Load audio buffer into the processor
   */
  async loadBuffer(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.workletNode || !this.isInitialized) {
      throw new Error('SourceNode not initialized. Call init() first.');
    }

    // Extract the channel data from the audio buffer
    const bufferData: Float32Array[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      bufferData.push(audioBuffer.getChannelData(i));
    }

    // Send the buffer data to the processor
    this.sendMessage(
      'setBuffer',
      {
        buffer: bufferData,
        sampleRate: audioBuffer.sampleRate,
      },
      bufferData.map((array) => array.buffer)
    );

    this.isLoaded = true;
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.workletNode || !this.isLoaded) {
      throw new Error('Audio buffer not loaded. Call loadBuffer() first.');
    }

    if (!this.isPlaying) {
      this.sendMessage('play');
      this.isPlaying = true;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.workletNode && this.isPlaying) {
      this.sendMessage('stop');
      this.isPlaying = false;
    }
  }

  /**
   * Set playback parameters
   * @param params Playback parameters
   */
  setPlaybackParameters(params: {
    start?: number;
    end?: number;
    loopStart?: number;
    loopEnd?: number;
    playbackRate?: number;
    interpolationSpeed?: number;
  }): void {
    if (!this.workletNode || !this.isInitialized) return;

    // Map the provided parameters to the actual AudioParam names
    const paramMapping = {
      start: 'targetStart',
      end: 'targetEnd',
      loopStart: 'targetLoopStart',
      loopEnd: 'targetLoopEnd',
      playbackRate: 'targetPlaybackRate',
      interpolationSpeed: 'interpolationSpeed',
    };

    // Create the param object with the correct AudioParam names
    const workletParams: Record<string, number> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && key in paramMapping) {
        const paramName = paramMapping[key as keyof typeof paramMapping];
        workletParams[paramName] = value;
      }
    });

    // Use the base class method to set parameters
    this.setParameters(workletParams);
  }

  /**
   * Enable or disable looping
   */
  setLooping(enabled: boolean): void {
    if (!this.workletNode || !this.isInitialized) return;

    this.sendMessage(enabled ? 'enableLooping' : 'disableLooping');
  }

  /**
   * Enable position streaming
   */
  enablePositionStreaming(interval: number = 5): void {
    if (!this.workletNode || !this.isInitialized) return;

    this.sendMessage('streamPosition', {
      enabled: true,
      interval,
    });
  }

  /**
   * Disable position streaming
   */
  disablePositionStreaming(): void {
    if (!this.workletNode || !this.isInitialized) return;

    this.sendMessage('streamPosition', {
      enabled: false,
    });
  }

  /**
   * Check if currently playing
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if buffer is loaded
   */
  isBufferLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Override the dispose method to reset additional state
   */
  dispose(): void {
    this.stop(); // Stop playback before disposing
    super.dispose(); // Call base class dispose
    this.isLoaded = false;
    this.isPlaying = false;
  }
}

// import { sourceProcessorCode } from './worklet-code.js';
// import {
//   initializeAudioWorklet,
//   sendWorkletMessage,
//   WorkletMessage,
// } from '../../utils/worklet-utils.js';

// /**
//  * SourceNode - TypeScript wrapper for source-processor AudioWorklet
//  */
// export class SourceNode {
//   private audioContext: AudioContext;
//   private sourceProcessor: AudioWorkletNode | null = null;
//   private gainNode: GainNode;
//   private isLoaded = false;
//   private isPlaying = false;

//   constructor(audioContext: AudioContext) {
//     this.audioContext = audioContext;
//     this.gainNode = audioContext.createGain();
//     this.gainNode.connect(this.audioContext.destination);
//   }

//   /**
//    * Initialize the AudioWorklet processor
//    */
//   async init(processorPath?: string): Promise<void> {
//     try {
//       // Handle processor messages
//       const handleMessage = (event: MessageEvent<WorkletMessage>) => {
//         if (event.data.type === 'update') {
//           // Handle parameter updates
//           this.isPlaying = event.data.data?.isPlaying;
//         } else if (event.data.type === 'positionUpdate') {
//           // Handle position updates if needed
//         }
//       };

//       // Initialize the worklet
//       this.sourceProcessor = await initializeAudioWorklet(
//         this.audioContext,
//         'source-processor',
//         {
//           embeddedCode: processorPath ? undefined : sourceProcessorCode,
//           processorPath,
//           messageHandler: handleMessage,
//           outputNode: this.gainNode,
//         }
//       );

//       return Promise.resolve();
//     } catch (error) {
//       console.error('Failed to initialize SourceNode:', error);
//       return Promise.reject(error);
//     }
//   }

//   /**
//    * Load audio buffer into the processor
//    */
//   async loadBuffer(audioBuffer: AudioBuffer): Promise<void> {
//     if (!this.sourceProcessor) {
//       throw new Error('SourceNode not initialized. Call init() first.');
//     }

//     // Extract the channel data from the audio buffer
//     const bufferData: Float32Array[] = [];
//     for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
//       bufferData.push(audioBuffer.getChannelData(i));
//     }

//     // Send the buffer data to the processor
//     sendWorkletMessage(
//       this.sourceProcessor,
//       'setBuffer',
//       {
//         buffer: bufferData,
//         sampleRate: audioBuffer.sampleRate,
//       },
//       bufferData.map((array) => array.buffer)
//     );

//     this.isLoaded = true;
//   }

//   /**
//    * Start playback
//    */
//   play(): void {
//     if (!this.sourceProcessor || !this.isLoaded) {
//       throw new Error('Audio buffer not loaded. Call loadBuffer() first.');
//     }

//     if (!this.isPlaying) {
//       sendWorkletMessage(this.sourceProcessor, 'play');
//       this.isPlaying = true;
//     }
//   }

//   /**
//    * Stop playback
//    */
//   stop(): void {
//     if (this.sourceProcessor && this.isPlaying) {
//       sendWorkletMessage(this.sourceProcessor, 'stop');
//       this.isPlaying = false;
//     }
//   }

//   /**
//    * Set playback parameters
//    */
//   setParameters(params: {
//     start?: number;
//     end?: number;
//     loopStart?: number;
//     loopEnd?: number;
//     playbackRate?: number;
//     interpolationSpeed?: number;
//   }): void {
//     if (!this.sourceProcessor) return;

//     const { start, end, loopStart, loopEnd, playbackRate, interpolationSpeed } =
//       params;

//     if (start !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetStart')
//         ?.setValueAtTime(start, this.audioContext.currentTime);
//     }

//     if (end !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetEnd')
//         ?.setValueAtTime(end, this.audioContext.currentTime);
//     }

//     if (loopStart !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetLoopStart')
//         ?.setValueAtTime(loopStart, this.audioContext.currentTime);
//     }

//     if (loopEnd !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetLoopEnd')
//         ?.setValueAtTime(loopEnd, this.audioContext.currentTime);
//     }

//     if (playbackRate !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetPlaybackRate')
//         ?.setValueAtTime(playbackRate, this.audioContext.currentTime);
//     }

//     if (interpolationSpeed !== undefined) {
//       this.sourceProcessor.parameters
//         .get('interpolationSpeed')
//         ?.setValueAtTime(interpolationSpeed, this.audioContext.currentTime);
//     }
//   }

//   /**
//    * Enable or disable looping
//    */
//   setLooping(enabled: boolean): void {
//     if (!this.sourceProcessor) return;

//     sendWorkletMessage(
//       this.sourceProcessor,
//       enabled ? 'enableLooping' : 'disableLooping'
//     );
//   }

//   /**
//    * Enable position streaming
//    */
//   enablePositionStreaming(interval: number = 5): void {
//     if (!this.sourceProcessor) return;

//     sendWorkletMessage(this.sourceProcessor, 'streamPosition', {
//       enabled: true,
//       interval,
//     });
//   }

//   /**
//    * Disable position streaming
//    */
//   disablePositionStreaming(): void {
//     if (!this.sourceProcessor) return;

//     sendWorkletMessage(this.sourceProcessor, 'streamPosition', {
//       enabled: false,
//     });
//   }

//   /**
//    * Set volume (0-1)
//    */
//   setVolume(volume: number): void {
//     this.gainNode.gain.setValueAtTime(
//       Math.max(0, Math.min(1, volume)),
//       this.audioContext.currentTime
//     );
//   }

//   /**
//    * Connect to an AudioNode
//    */
//   connect(destination: AudioNode): void {
//     this.gainNode.disconnect();
//     this.gainNode.connect(destination);
//   }

//   /**
//    * Dispose and clean up resources
//    */
//   dispose(): void {
//     this.stop();
//     if (this.sourceProcessor) {
//       this.sourceProcessor.disconnect();
//       this.sourceProcessor = null;
//     }
//     this.gainNode.disconnect();
//     this.isLoaded = false;
//     this.isPlaying = false;
//   }
// }

// import { sourceProcessorCode } from './worklet-code.js';

// /**
//  * SourceNode - TypeScript wrapper for source-processor AudioWorklet
//  */
// export class SourceNode {
//   private audioContext: AudioContext;
//   private sourceProcessor: AudioWorkletNode | null = null;
//   private gainNode: GainNode;
//   private isLoaded = false;
//   private isPlaying = false;

//   constructor(audioContext: AudioContext) {
//     this.audioContext = audioContext;
//     this.gainNode = audioContext.createGain();
//     this.gainNode.connect(this.audioContext.destination);
//   }

//   /**
//    * Initialize the AudioWorklet processor
//    */
//   async init(processorPath?: string): Promise<void> {
//     try {
//       if (processorPath) {
//         // Use provided path if available
//         await this.audioContext.audioWorklet.addModule(processorPath);
//       } else {
//         // Use the embedded code with Blob URL
//         const blob = new Blob([sourceProcessorCode], {
//           type: 'application/javascript',
//         });
//         const workletUrl = URL.createObjectURL(blob);

//         try {
//           await this.audioContext.audioWorklet.addModule(workletUrl);
//         } finally {
//           // Always clean up the URL to avoid memory leaks
//           URL.revokeObjectURL(workletUrl);
//         }
//       }
//       // Create the processor node
//       this.sourceProcessor = new AudioWorkletNode(
//         this.audioContext,
//         'source-processor'
//       );

//       // Connect the processor to the gain node
//       this.sourceProcessor.connect(this.gainNode);

//       // Set up message handling from the processor
//       this.sourceProcessor.port.onmessage = (event) => {
//         if (event.data.type === 'update') {
//           // Handle parameter updates
//           this.isPlaying = event.data.isPlaying;
//         } else if (event.data.type === 'positionUpdate') {
//           // Handle position updates if needed
//         }
//       };

//       return Promise.resolve();
//     } catch (error) {
//       console.error('Failed to initialize SourceNode:', error);
//       return Promise.reject(error);
//     }
//   }

//   /**
//    * Load audio buffer into the processor
//    */
//   async loadBuffer(audioBuffer: AudioBuffer): Promise<void> {
//     if (!this.sourceProcessor) {
//       throw new Error('SourceNode not initialized. Call init() first.');
//     }

//     // Extract the channel data from the audio buffer
//     const bufferData: Float32Array[] = [];
//     for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
//       bufferData.push(audioBuffer.getChannelData(i));
//     }

//     // Send the buffer data to the processor
//     this.sourceProcessor.port.postMessage(
//       {
//         type: 'setBuffer',
//         buffer: bufferData,
//         sampleRate: audioBuffer.sampleRate,
//       },
//       bufferData.map((array) => array.buffer)
//     );

//     this.isLoaded = true;
//   }

//   /**
//    * Start playback
//    */
//   play(): void {
//     if (!this.sourceProcessor || !this.isLoaded) {
//       throw new Error('Audio buffer not loaded. Call loadBuffer() first.');
//     }

//     if (!this.isPlaying) {
//       this.sourceProcessor.port.postMessage({ type: 'play' });
//       this.isPlaying = true;
//     }
//   }

//   /**
//    * Stop playback
//    */
//   stop(): void {
//     if (this.sourceProcessor && this.isPlaying) {
//       this.sourceProcessor.port.postMessage({ type: 'stop' });
//       this.isPlaying = false;
//     }
//   }

//   /**
//    * Set playback parameters
//    */
//   setParameters(params: {
//     start?: number;
//     end?: number;
//     loopStart?: number;
//     loopEnd?: number;
//     playbackRate?: number;
//     interpolationSpeed?: number;
//   }): void {
//     if (!this.sourceProcessor) return;

//     const { start, end, loopStart, loopEnd, playbackRate, interpolationSpeed } =
//       params;

//     if (start !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetStart')
//         ?.setValueAtTime(start, this.audioContext.currentTime);
//     }

//     if (end !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetEnd')
//         ?.setValueAtTime(end, this.audioContext.currentTime);
//     }

//     if (loopStart !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetLoopStart')
//         ?.setValueAtTime(loopStart, this.audioContext.currentTime);
//     }

//     if (loopEnd !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetLoopEnd')
//         ?.setValueAtTime(loopEnd, this.audioContext.currentTime);
//     }

//     if (playbackRate !== undefined) {
//       this.sourceProcessor.parameters
//         .get('targetPlaybackRate')
//         ?.setValueAtTime(playbackRate, this.audioContext.currentTime);
//     }

//     if (interpolationSpeed !== undefined) {
//       this.sourceProcessor.parameters
//         .get('interpolationSpeed')
//         ?.setValueAtTime(interpolationSpeed, this.audioContext.currentTime);
//     }
//   }

//   /**
//    * Enable or disable looping
//    */
//   setLooping(enabled: boolean): void {
//     if (!this.sourceProcessor) return;

//     this.sourceProcessor.port.postMessage({
//       type: enabled ? 'enableLooping' : 'disableLooping',
//     });
//   }

//   /**
//    * Enable position streaming
//    */
//   enablePositionStreaming(interval: number = 5): void {
//     if (!this.sourceProcessor) return;

//     this.sourceProcessor.port.postMessage({
//       type: 'streamPosition',
//       enabled: true,
//       interval,
//     });
//   }

//   /**
//    * Disable position streaming
//    */
//   disablePositionStreaming(): void {
//     if (!this.sourceProcessor) return;

//     this.sourceProcessor.port.postMessage({
//       type: 'streamPosition',
//       enabled: false,
//     });
//   }

//   /**
//    * Set volume (0-1)
//    */
//   setVolume(volume: number): void {
//     this.gainNode.gain.setValueAtTime(
//       Math.max(0, Math.min(1, volume)),
//       this.audioContext.currentTime
//     );
//   }

//   /**
//    * Connect to an AudioNode
//    */
//   connect(destination: AudioNode): void {
//     this.gainNode.disconnect();
//     this.gainNode.connect(destination);
//   }

//   /**
//    * Dispose and clean up resources
//    */
//   dispose(): void {
//     this.stop();
//     if (this.sourceProcessor) {
//       this.sourceProcessor.disconnect();
//       this.sourceProcessor = null;
//     }
//     this.gainNode.disconnect();
//     this.isLoaded = false;
//     this.isPlaying = false;
//   }
// }
