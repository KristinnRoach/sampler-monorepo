import { SourceNode } from './SourceNode';

interface VoiceInfo {
  node: SourceNode;
  isPlaying: boolean;
  midiNote: number | null;
  startTime: number | null;
}

export class SourcePool {
  private voices: VoiceInfo[] = [];
  private context: BaseAudioContext;
  private buffer: AudioBuffer | null = null;
  gainNode: GainNode;

  constructor(
    context: BaseAudioContext,
    options: {
      polyphony: number;
      buffer?: AudioBuffer;
    }
  ) {
    this.context = context;
    this.buffer = options.buffer || null;
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 1.0;
    this.gainNode.connect(context.destination);
  }

  async initialize(polyphony: number): Promise<void> {
    await SourceNode.registerProcessor(this.context);

    for (let i = 0; i < polyphony; i++) {
      const node = new SourceNode(this.context, { buffer: this.buffer });
      node.connect(this.gainNode);
      // Setup ended callback to mark voice as available
      node.setOnEnded(() => {
        const voice = this.voices.find((v) => v.node === node);
        if (voice) {
          voice.isPlaying = false;
          voice.midiNote = null;
          voice.startTime = null;
        }
      });

      this.voices.push({
        node,
        isPlaying: false,
        midiNote: null,
        startTime: null,
      });
    }
  }

  playNote(
    midiNote: number,
    velocity: number = 1.0,
    startTime?: number
  ): SourceNode {
    // Find free voice
    let voice = this.voices.find((v) => !v.isPlaying);

    // If no free voice, steal the oldest one
    if (!voice) {
      voice = this.voices.reduce(
        (oldest, current) =>
          !oldest.startTime ||
          (current.startTime && current.startTime < oldest.startTime)
            ? current
            : oldest,
        this.voices[0]
      );
    }

    // Update voice info
    voice.isPlaying = true;
    voice.midiNote = midiNote;
    voice.startTime = startTime ?? this.context.currentTime;

    // Play the note
    return voice.node.playNote(midiNote, velocity, startTime);
  }

  async stopNote(midiNote: number, when?: number): Promise<void> {
    // Find all voices playing this note
    const matchingVoices = this.voices.filter(
      (v) => v.midiNote === midiNote && v.isPlaying
    );

    // Stop them and recreate
    for (const voice of matchingVoices) {
      try {
        // Stop the current node
        voice.node.stop(when);

        // Create a new node to replace it
        const newNode = await SourceNode.create(this.context, {
          buffer: this.buffer,
        });

        // Connect it to the same destination
        newNode.connect(this.gainNode);

        // Setup ended callback
        newNode.setOnEnded(() => {
          const voiceIndex = this.voices.findIndex((v) => v.node === newNode);
          if (voiceIndex >= 0) {
            this.voices[voiceIndex].isPlaying = false;
            this.voices[voiceIndex].midiNote = null;
            this.voices[voiceIndex].startTime = null;
          }
        });

        // Replace the node in the voice
        voice.node.dispose(); // Clean up old node
        voice.node = newNode;

        // Reset voice state
        voice.isPlaying = false;
        voice.midiNote = null;
        voice.startTime = null;
      } catch (error) {
        console.warn(`Failed to stop note ${midiNote}:`, error);
        // Still update the voice state in case of error
        voice.isPlaying = false;
        voice.midiNote = null;
        voice.startTime = null;
      }
    }
  }

  static async create(
    context: BaseAudioContext,
    options: { polyphony: number; buffer?: AudioBuffer }
  ): Promise<SourcePool> {
    await SourceNode.registerProcessor(context);
    const pool = new SourcePool(context, options);
    // Initialize voices here instead of in constructor
    await pool.initialize(options.polyphony);
    return pool;
  }

  connect(destination: AudioNode = this.gainNode): SourcePool {
    this.voices.forEach((voice) => voice.node.connect(destination));
    return this;
  }

  setBuffer(buffer: AudioBuffer): void {
    this.buffer = buffer;
    this.voices.forEach((voice) => {
      voice.node.buffer = buffer;
    });
  }

  setLoopStart(value: number): void {
    this.voices.forEach((voice) => {
      voice.node.loopStart.value = value;
    });
  }

  setLoopEnd(value: number): void {
    this.voices.forEach((voice) => {
      voice.node.loopEnd.value = value;
    });
  }

  // Add to the SourceNodePool class
  setLoopParameters(
    loopStart: number,
    loopEnd: number,
    playbackRate: number,
    currentTime: number,
    rampDuration: number
  ): void {
    this.voices.forEach((voice) => {
      const node = voice.node;

      // Cancel any scheduled values
      node.loopStart.cancelScheduledValues(currentTime);
      node.loopEnd.cancelScheduledValues(currentTime);
      node.playbackRate.cancelScheduledValues(currentTime);

      // Schedule parameter changes with ramping
      node.loopStart.setValueAtTime(node.loopStart.value, currentTime);
      node.loopStart.linearRampToValueAtTime(
        loopStart,
        currentTime + rampDuration
      );

      node.loopEnd.setValueAtTime(node.loopEnd.value, currentTime);
      node.loopEnd.linearRampToValueAtTime(loopEnd, currentTime + rampDuration);

      node.playbackRate.setValueAtTime(node.playbackRate.value, currentTime);
      node.playbackRate.linearRampToValueAtTime(
        playbackRate,
        currentTime + rampDuration
      );
    });
  }

  setLoopEnabled(enabled: boolean): void {
    this.voices.forEach((voice) => {
      voice.node.setLoopEnabled(enabled);
    });
  }

  dispose(): void {
    this.voices.forEach((voice) => voice.node.dispose());
    this.voices = [];
  }
}
