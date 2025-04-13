import { getAudioContext } from '@/context/globalAudioContext';
import { VoiceNode } from '@/nodes/voice/VoiceNode';
import { DefaultEventBus, IEventBus, EventMap, EventData } from '@/events'; // DefaultEventBus
import { LibNode } from '@/abstract/nodes/baseClasses/LibNode';
import { globalKeyboardInput } from '@/input';
import { loadAudioSample, loadDefaultSample } from '@/utils/loadAudio';

export type SingleSamplePlayerProps = {
  name: string;
  enableUserInput?: 'computer-keyboard' | 'midi';
  polyphony?: number;
  rootNote?: number;
  sampleBuffer?: AudioBuffer;
  outputDestination?: AudioDestinationNode;
};

export class SingleSamplePlayer extends LibNode {
  #name: string;
  #context: BaseAudioContext;
  #buffer: AudioBuffer | null = null;
  #events: IEventBus;

  #availableVoices: VoiceNode[] = [];
  #activeVoices: Map<number, VoiceNode[]> = new Map(); // VoiceNode[] = []; // todo: skoða voice allocation

  #polyphony: number;
  #rootNote: number;

  #outputGain: GainNode;
  #destination: AudioDestinationNode;

  #userInputType: 'computer-keyboard' | 'midi' | 'inactive' = 'inactive';

  #initialized: boolean = false;

  constructor(props: SingleSamplePlayerProps) {
    super();

    this.#events = new DefaultEventBus();

    this.#name = props.name;
    this.#polyphony = props.polyphony || 8;
    this.#rootNote = props.rootNote || 60;

    this.#context = getAudioContext();
    if (!this.#context) throw new Error('No AudioContext!');

    this.#destination = props.outputDestination || this.#context.destination;
    this.#outputGain = this.#context.createGain();
    this.#outputGain.gain.value = 1.0;
    this.#outputGain.connect(this.#destination);

    this.#userInputType = props.enableUserInput || 'inactive';

    if (props.sampleBuffer instanceof AudioBuffer) {
      this.#buffer = props.sampleBuffer;
      this.start();
    } else {
      console.log('No buffer provided, using default sample...');
      loadDefaultSample().then((buffer: AudioBuffer) => {
        this.#buffer = buffer;
        this.start();
      });
    }
  }

  start(): void {
    if (this.initVoices()) {
      this.setInputHandlers(this.#userInputType);

      this.#setInitialized(true);
    } else {
      console.warn('Failed to initialize voices');
    }
  }

  isInitialized(): boolean {
    return this.#initialized;
  }

  #setInitialized(ready: boolean): void {
    if (ready) {
      this.#initialized = true;

      this.#events.notify('ready', {
        publisherId: this.nodeId,
        message: 'SingleSamplePlayer initialized',
        currentTime: this.#context.currentTime,
        // could pass the needed info here (e.g. sample duration)
      });
    } else {
      this.#initialized = false;
      this.#events.notify('error', {
        publisherId: this.nodeId,
        message: 'SingleSamplePlayer failed to initialize',
        currentTime: this.#context.currentTime,
      });
    }
  }

  addListener(
    type: keyof EventMap,
    handler: (detail: EventData) => void,
    options?: AddEventListenerOptions
  ): () => void {
    return this.#events?.addListener(type, handler, options);
  }

  removeListener(
    type: keyof EventMap,
    handler: (detail: EventData) => void
  ): void {
    this.#events?.removeListener(type, handler);
  }
  removeAllListeners(): void {
    this.#events?.clearAllListeners(); // TODO: unique listener store for each Instrument..
  }

  setInputHandlers(
    type: 'computer-keyboard' | 'midi' | 'inactive' = this.#userInputType // | 'touch';
  ) {
    if (type !== this.#userInputType) {
      console.log(`Changing user input handlers to ${type}`);
      this.#userInputType = type;
    }
    switch (type) {
      case 'computer-keyboard':
        globalKeyboardInput.addHandler({
          onNoteOn: this.playNote.bind(this),
          onNoteOff: this.releaseNote.bind(this),
        });
        break;

      case 'midi':
        console.log('MIDI input not implemented yet');
        break;

      case 'inactive':
        this.removeInputHandlers();
        console.log('Input handlers removed');
        break;

      default:
        console.log('No input handlers added');
        break;
    }
  }

  removeInputHandlers() {
    globalKeyboardInput.removeHandler({
      onNoteOn: this.playNote.bind(this),
      onNoteOff: this.releaseNote.bind(this),
    });
  }

  async loadSampleFromeURL(
    path: string,
    idbOptions?: {
      storeSample?: boolean;
      forceReload?: boolean;
      sampleId?: string;
    }
  ): Promise<number | null> {
    const audioBuffer = await loadAudioSample(path, idbOptions);
    this.setSampleBuffer(audioBuffer);
    return audioBuffer.duration;
  }

  setSampleBuffer(buffer: AudioBuffer): void {
    if (!buffer || buffer.length <= 0) {
      console.warn('Failed to load audio sample');
      return;
    }
    if (this.#buffer) {
      console.warn('Clearing existing buffer...');
      this.#buffer = null;
      this.clearVoices();
    }
    this.#buffer = buffer;
    this.initVoices(); // todo: maybe reuse VoiceNode's instead (add setBuffer to VoiceNode)
  }

  getSampleBuffer(): AudioBuffer | null {
    return this.#buffer;
  }

  getSampleDuration(): number | null {
    // Seconds
    if (!this.#buffer) {
      console.warn('Audio buffer non-existent');
      return null;
    }
    return this.#buffer.duration;
  }

  initVoices(): boolean {
    if (!this.#buffer) {
      console.warn('No buffer to initVoices');
      return false;
    }
    if (this.#initialized) {
      console.warn('Voices already initialized');
      return false;
    }

    console.trace(`Initializing voices with buffer: ${this.#buffer.duration}`);

    if (this.#availableVoices.length > 0 || this.#activeVoices.size > 0) {
      console.warn('Clearing existing voices...');
      this.clearVoices();
    }

    const voiceDestination = this.#outputGain;
    for (let idx = 0; idx < this.#polyphony; idx++) {
      const voice = new VoiceNode(this.#context, this.#buffer, this.#rootNote);

      voice.addListener('note:started', (info) =>
        this.#events.notify('note:started', info)
      );
      voice.addListener('note:released', (info) =>
        this.#events.notify('note:released', info)
      );

      voice.addListener('note:ended', (info) => {
        this.#events.notify('note:ended', info);
        // Remove the voice from the active voices
        const midiNote = info.note ?? -1;
        const voicesForNote = this.#activeVoices.get(midiNote);
        if (voicesForNote) {
          const index = voicesForNote.indexOf(voice);
          if (index !== -1) {
            voicesForNote.splice(index, 1);
            if (voicesForNote.length === 0) {
              this.#activeVoices.delete(midiNote);
            }
          }
        }
        // voice:available listener handles pushing the voice back to available voices
      });

      voice.addListener('voice:available', (info) => {
        this.#events.notify('voice:available', info);
        this.#availableVoices.push(voice);
      });

      voice.addListener('error', (info) => this.#events.notify('error', info));

      voice.connect(voiceDestination);
      this.#availableVoices.push(voice);
    }
    // notify
    return true;
  }

  setLoopPoint(
    loopPoint: 'loopStart' | 'loopEnd',
    targetValue: number,
    rampDuration: number
  ): boolean {
    // if (!this.#loopController) return false;
    console.warn('Setting loop point to', loopPoint, targetValue);
    // this.#loopController?.setLoopPoint(loopPoint, targetValue, rampDuration);
    return true;
  }

  setLoopEnabled(enabled: boolean, rampDuration: number = 0.1): void {
    this.#availableVoices.forEach((voice) => {
      voice.setLoopEnabled(enabled, rampDuration);
    });
    // notify
  }

  /**
   * Play a note using the sample
   * @param midiNote MIDI note number to play
   * @param velocity Note velocity (0-1)
   * @param startTime Time to start playback (defaults to now)
   * @returns boolean indicating success
   */
  playNote(
    midiNote: number,
    velocity: number = 1.0,
    startTime?: number
  ): boolean {
    const voice = this.#availableVoices.pop() ?? null;

    if (!voice || this.#activeVoices.size >= this.#polyphony) {
      // maybe voice.forceMakeAvailable(); if volume is under some threshold
      this.playError(midiNote, 'No available voices to play the note');
      return false;
    }

    if (voice.play(midiNote, velocity, startTime)) {
      this.#activeVoices.get(midiNote) // todo: make clearer
        ? this.#activeVoices.get(midiNote)?.push(voice)
        : this.#activeVoices.set(midiNote, [voice]);
      return true;
    }
    return false;
  }

  /**
   * Release a note using the sample
   * @param midiNote MIDI note number to release
   * @param releaseTime Time to release playback (defaults to now)
   */
  releaseNote(midiNote?: number, releaseTime?: number): void {
    if (!midiNote) {
      console.warn('No MIDI note provided to release');
      return;
    }
    const voicesForNote = this.#activeVoices.get(midiNote);

    if (voicesForNote && voicesForNote.length > 0) {
      // Get first voice for this note
      const voice = voicesForNote[0];
      voice.triggerRelease(releaseTime);

      // Remove this voice from array
      voicesForNote.splice(0, 1);

      // If no more voices for this note, delete the entry
      if (voicesForNote.length === 0) {
        this.#activeVoices.delete(midiNote);
      }
    }
    // else { // todo: fix this
    //   this.playError(midiNote, 'No active voice to release the note');
    // }
  }

  /**
   * Release all notes using the sample
   * @param releaseTime Time to release playback (defaults to now)
   */
  releaseAll(releaseTime?: number): void {
    this.#activeVoices.forEach((note) => {
      note.forEach((voice) => {
        voice.triggerRelease(releaseTime);
      });
    });
  }

  playError(midiNote: number, message?: string): void {
    this.#events.notify('error', {
      publisherId: this.nodeId,
      message: message ?? 'No available voices to play the note',
      note: midiNote,
      currentTime: this.#context.currentTime,
    });
  }

  getActiveVoiceCount(): number {
    return this.#activeVoices.size;
  }

  get polyphony(): number {
    return this.#polyphony;
  }

  set polyphony(value: number) {
    if (value < 1) {
      throw new Error('Polyphony must be at least 1');
    }
    if (value > 32) {
      throw new Error('Polyphony cannot exceed 32');
    }

    this.#polyphony = value;
  }

  get name(): string {
    return this.#name;
  }

  set name(value: string) {
    if (value.length < 1) {
      throw new Error('Name must be at least 1 character long');
    }
    if (value.length > 32) {
      throw new Error('Name cannot exceed 32 characters');
    }
    this.#name = value;
  }

  setVolume(value: number): void {
    if (!this.#outputGain) throw new Error('Output gain non-existent');

    if (value < 0 || value > 1) {
      throw new Error('Volume value must be between 0 and 1');
    }
    this.#outputGain.gain.value = value;
  }

  getVolume(): number {
    if (!this.#outputGain) throw new Error('Output gain non-existent');

    return this.#outputGain.gain.value;
  }

  stopAll(releaseTime: number = 0.1): void {
    this.#activeVoices.forEach((note) => {
      note.forEach((voice) => {
        voice.triggerRelease(releaseTime);
      });
    });
  }

  connect(destination?: AudioNode): this {
    if (!destination) {
      destination = this.#context.destination;
    }
    if (!(destination instanceof AudioNode)) {
      throw new Error('Destination must be an AudioNode');
    }
    // Disconnect from the current destination if any
    this.#outputGain?.disconnect();

    // Connect to the new destination
    this.#outputGain?.connect(destination);
    return this;
  }

  disconnect(): void {
    this.#outputGain?.disconnect();
  }

  dispose(): void {
    this.stopAll(0);
    this.disconnect();

    this.#availableVoices.forEach((voice) => {
      voice.dispose();
    });

    this.#availableVoices = [];
    this.#outputGain?.disconnect();
    this.#outputGain = null as unknown as GainNode;
    // this.#loopController?.disconnect();
    // this.#loopController = null;
    this.#context = null as unknown as BaseAudioContext;
    this.#buffer = null as unknown as AudioBuffer;
    this.#initialized = false;
  }

  clearVoices(): void {
    if (this.#availableVoices.length > 0) {
      this.#availableVoices.forEach((voice) => {
        voice.dispose();
      });
      this.#availableVoices = [];
    }
    if (this.#activeVoices.size > 0) {
      this.#activeVoices.forEach((note) => {
        note.forEach((voice) => {
          voice.dispose();
        });
      });
      this.#activeVoices.clear();
    }
    // notify
  }
}

// // Handle AudioBuffer synchronously
// // Allocation strategy type - can be expanded in the future
// export type VoiceAllocationStrategy = 'oldest-first' | 'quietest-first';
// #allocationStrategy: VoiceAllocationStrategy = 'oldest-first';

// setAllocationStrategy(strategy: VoiceAllocationStrategy): void {
//   this.#allocationStrategy = strategy;
// }

// #allocateVoice(): VoiceNode | null {
//   // First try to find an available voice
//   const availableVoice = this.#availableVoices.find((v) => v.isAvailable());
//   if (availableVoice) {
//     // Move to the end of the array (mark as recently used)
//     this.#moveVoiceToEnd(availableVoice);
//     return availableVoice;
//   }

//   // If no voices are available, use the allocation strategy to steal one
//   if (
//     this.#allocationStrategy === 'oldest-first' &&
//     this.#availableVoices.length > 0
//   ) {
//     // Get the oldest voice (first in the array)
//     const oldestVoice = this.#availableVoices[0];

//     // Reset the voice before reusing it
//     oldestVoice.forceMakeAvailable();

//     // Move to the end of the array (mark as recently used)
//     this.#moveVoiceToEnd(oldestVoice);
//     return oldestVoice;
//   }

//   // Future implementation: quietest-first strategy
//   // if (this.#allocationStrategy === 'quietest-first') {
//   //   // Find the voice with the lowest current gain
//   //   const quietestVoice = this.#findQuietestVoice();
//   //   if (quietestVoice) {
//   //     this.#moveVoiceToEnd(quietestVoice);
//   //     return quietestVoice;
//   //   }
//   // }

//   return null;
// }

// /**
//  * Move a voice to the end of the voices array (marking it as most recently used)
//  */
// #moveVoiceToEnd(voice: VoiceNode): void {
//   const index = this.#availableVoices.indexOf(voice);
//   if (index > -1) {
//     this.#availableVoices.splice(index, 1);
//     this.#availableVoices.push(voice);
//   }
// }
