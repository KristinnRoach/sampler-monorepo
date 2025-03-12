import { sourceProcessorCode } from './worklet-code.js';

export interface WorkletVoiceManagerOptions {
  polyphony?: number;
  preloadVoices?: number;
  interpolationSpeed?: number;
  playbackRate?: number;
  loopStart?: number;
  loopEnd?: number;
  loop?: boolean;
  volume?: number;
}

export interface WorkletVoice {
  node: AudioWorkletNode;
  gain: GainNode;
  isPlaying: boolean;
  noteId: string | null;
  sampleId: string | null;
}

export interface Sample {
  buffer: AudioBuffer;
  duration: number;
}

export class WorkletVoiceManager {
  private audioContext: AudioContext;
  private options: WorkletVoiceManagerOptions;

  moduleLoaded: boolean;
  voices: WorkletVoice[];
  availableVoices: WorkletVoice[];
  activeVoices: Map<string, WorkletVoice>;
  samples: Map<string, Sample>;

  constructor(
    audioContext: AudioContext,
    options: WorkletVoiceManagerOptions = {}
  ) {
    this.audioContext = audioContext;
    this.options = {
      polyphony: options.polyphony || 8,
      preloadVoices: options.preloadVoices || 3,
      interpolationSpeed: options.interpolationSpeed || 0.05,
      ...options,
    };

    this.moduleLoaded = false;
    this.voices = [];
    this.availableVoices = [];
    this.activeVoices = new Map(); // Maps note ID to voice
    this.samples = new Map(); // Maps sample name to buffer

    // Initialize
    this._loadWorkletModule();
  }

  async _loadWorkletModule() {
    if (!this.moduleLoaded) {
      try {
        // Create a blob from the processor code string
        const blob = new Blob([sourceProcessorCode], {
          type: 'application/javascript',
        });
        const url = URL.createObjectURL(blob);

        // Load the worklet module
        await this.audioContext.audioWorklet.addModule(url);

        // Clean up the URL
        URL.revokeObjectURL(url);

        this.moduleLoaded = true;

        // Pre-create some voices
        this._preloadVoices();
      } catch (err) {
        console.error('Error loading audio worklet module:', err);
      }
    }
  }

  _preloadVoices() {
    const count = Math.min(this.options.preloadVoices, this.options.polyphony);
    for (let i = 0; i < count; i++) {
      this._createVoice();
    }
  }

  _createVoice(): WorkletVoice {
    // Create a worklet node
    const sourceNode = new AudioWorkletNode(
      this.audioContext,
      'source-processor',
      {
        outputChannelCount: [2],
      }
    );

    // Create output gain node for amplitude control
    const gainNode = this.audioContext.createGain();
    sourceNode.connect(gainNode);

    // Default destination is the audio context destination
    gainNode.connect(this.audioContext.destination);

    // Set up default parameters
    sourceNode.parameters.get('interpolationSpeed')!.value =
      this.options.interpolationSpeed!;

    // Handle messages from the processor
    sourceNode.port.onmessage = (event) => {
      if (event.data.type === 'ended') {
        // Find and release this voice when playback ends
        const voiceEntry = this.voices.find((v) => v.node === sourceNode);
        if (voiceEntry) {
          this._releaseVoice(voiceEntry);
        }
      }
    };

    // Create and add the voice to our pool
    const voice: WorkletVoice = {
      node: sourceNode,
      gain: gainNode,
      isPlaying: false,
      noteId: null,
      sampleId: null,
    };

    this.voices.push(voice);
    this.availableVoices.push(voice);

    return voice;
  }

  _getVoice(): WorkletVoice {
    // Get available voice or create a new one if we have capacity
    if (this.availableVoices.length > 0) {
      return this.availableVoices.pop()!;
    }

    // If we reached max polyphony, steal the oldest voice
    if (this.voices.length >= this.options.polyphony!) {
      // Find the oldest playing voice
      const oldestVoice = this.voices.find((v) => v.isPlaying);
      if (oldestVoice) {
        this._releaseVoice(oldestVoice);
        return oldestVoice;
      }
    }

    // Otherwise create a new voice
    return this._createVoice();
  }

  _releaseVoice(voice: WorkletVoice) {
    // Remove from active voices
    if (voice.noteId && this.activeVoices.has(voice.noteId)) {
      this.activeVoices.delete(voice.noteId);
    }

    // Reset voice state
    voice.isPlaying = false;
    voice.noteId = null;
    voice.sampleId = null;

    // Make available again
    if (!this.availableVoices.includes(voice)) {
      this.availableVoices.push(voice);
    }
  }

  // Load a sample
  async loadSample(
    sampleId: string,
    audioBuffer: AudioBuffer
  ): Promise<string> {
    // Store the sample buffer
    this.samples.set(sampleId, {
      buffer: audioBuffer,
      duration: audioBuffer.duration,
    });

    return sampleId;
  }

  // Play a note with the specified sample
  triggerAttack(
    noteId: string,
    sampleId: string,
    options: {
      playbackRate?: number;
      loopStart?: number;
      loopEnd?: number;
      loop?: boolean;
      volume?: number;
    } = {}
  ): WorkletVoice | null {
    if (!this.samples.has(sampleId)) {
      console.error(`Sample ${sampleId} not loaded`);
      return null;
    }

    // Get sample info
    const sample = this.samples.get(sampleId)!;

    // Get or create a voice
    const voice = this._getVoice();

    // Setup voice
    voice.isPlaying = true;
    voice.noteId = noteId;
    voice.sampleId = sampleId;

    // Set up parameters
    const playbackRate = options.playbackRate || 1.0;
    const loopStart = options.loopStart || 0;
    const loopEnd = options.loopEnd || sample.duration;
    const loopEnabled = options.loop || false;
    const volume = options.volume || 1.0;

    // Set gain
    voice.gain.gain.value = volume;

    // Prepare the channels for the processor
    const channels: Float32Array[] = [];
    for (let i = 0; i < sample.buffer.numberOfChannels; i++) {
      channels.push(sample.buffer.getChannelData(i));
    }

    // Send buffer to processor
    voice.node.port.postMessage({
      type: 'setBuffer',
      buffer: channels,
      sampleRate: sample.buffer.sampleRate,
    });

    // Configure processor
    voice.node.parameters.get('targetStart')!.value = 0;
    voice.node.parameters.get('targetEnd')!.value = sample.duration;
    voice.node.parameters.get('targetLoopStart')!.value = loopStart;
    voice.node.parameters.get('targetLoopEnd')!.value = loopEnd;
    voice.node.parameters.get('targetPlaybackRate')!.value = playbackRate;

    // Set looping mode
    if (loopEnabled) {
      voice.node.port.postMessage({ type: 'enableLooping' });
    } else {
      voice.node.port.postMessage({ type: 'disableLooping' });
    }

    // Start playback
    voice.node.port.postMessage({ type: 'play' });

    // Store in active voices
    this.activeVoices.set(noteId, voice);

    return voice;
  }

  // Stop a note
  triggerRelease(noteId: string): boolean {
    if (this.activeVoices.has(noteId)) {
      const voice = this.activeVoices.get(noteId)!;

      // Stop playback
      voice.node.port.postMessage({ type: 'stop' });

      // Release the voice
      this._releaseVoice(voice);

      return true;
    }

    return false;
  }

  seek(noteId: string, position: number): boolean {
    if (this.activeVoices.has(noteId)) {
      const voice = this.activeVoices.get(noteId)!;

      // Send seek message to processor
      voice.node.port.postMessage({
        type: 'seek',
        position: position,
      });

      return true;
    }

    return false;
  }

  // Update loop points for an active note
  updateLoopPoints(
    noteId: string,
    loopStart: number,
    loopEnd: number
  ): boolean {
    if (this.activeVoices.has(noteId)) {
      const voice = this.activeVoices.get(noteId)!;

      // Update loop points - will be smoothly interpolated
      voice.node.parameters.get('targetLoopStart')!.value = loopStart;
      voice.node.parameters.get('targetLoopEnd')!.value = loopEnd;

      return true;
    }

    return false;
  }

  // Connect output to a destination node
  connect(destination: AudioNode) {
    // Connect all voices to the new destination
    for (const voice of this.voices) {
      // Disconnect from current destination
      voice.gain.disconnect();

      // Connect to new destination
      voice.gain.connect(destination);
    }
  }

  // Release all resources
  dispose() {
    // Stop all voices
    for (const voice of this.voices) {
      voice.node.port.postMessage({ type: 'stop' });
      voice.node.disconnect();
      voice.gain.disconnect();
    }

    this.voices = [];
    this.availableVoices = [];
    this.activeVoices.clear();
    this.samples.clear();
  }
}
