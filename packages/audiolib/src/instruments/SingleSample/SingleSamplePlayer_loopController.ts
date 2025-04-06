import { getAudioContext } from '@/context/globalAudioContext';
import { VoiceNode } from '@/nodes/voice/VoiceNode';
import { EventBusOption } from '@/events'; // DefaultEventBus
import { FlexEventDriven } from '@/abstract/nodes/baseClasses/FlexEventDriven';
import { globalKeyboardInput } from '@/input';
import { loadAudioSample } from '@/utils/loadAudio';

export type SingleSamplePlayerProps = {
  name: string;
  sampleBuffer?: AudioBuffer;
  addInputHandlers?: boolean; // "none" | "keyboard" | "midi";
  polyphony?: number;
  rootNote?: number;
  outputDestination?: AudioDestinationNode;
};

export async function createSingleSamplePlayer(
  props: SingleSamplePlayerProps
): Promise<SingleSamplePlayer> {
  try {
    // Initialize the player
    const player = new SingleSamplePlayer(props);

    return player;
  } catch (error) {
    console.error('Failed to initialize player:', error);
    throw error;
  }
}

export class SingleSamplePlayer extends FlexEventDriven {
  #name: string;
  #context: BaseAudioContext;
  #buffer: AudioBuffer | null;

  #availableVoices: VoiceNode[] = [];
  #activeVoices: Map<number, VoiceNode[]> = new Map(); // VoiceNode[] = []; // todo: skoða voice allocation

  #polyphony: number;
  #rootNote: number;

  #outputGain: GainNode;
  #destination: AudioDestinationNode;
  #loopController: AudioWorkletNode | null = null;

  isInitialized: boolean = false;

  constructor(
    props: SingleSamplePlayerProps,
    eventBusOption: EventBusOption = 'ui' // 'ui' | 'audio' | 'unique' | 'none'
  ) {
    super(eventBusOption);

    this.#name = props.name;
    this.#buffer = props.sampleBuffer || null;
    this.#polyphony = props.polyphony || 8;
    this.#rootNote = props.rootNote || 60;

    this.#context = getAudioContext();
    if (!this.#context) throw new Error('No AudioContext!');

    this.#destination = props.outputDestination || this.#context.destination;

    // Create the main output gain node
    this.#outputGain = this.#context.createGain();
    this.#outputGain.gain.value = 1.0;

    this.#outputGain.connect(this.#destination);

    if (props.addInputHandlers) {
      this.addInputHandlers();
    }

    if (props.sampleBuffer) {
      this.#buffer = props.sampleBuffer;
      if (this.initVoices()) {
        this.isInitialized = true;
      }
    }
  }

  addInputHandlers(type: 'computer-keyboard' | 'midi' = 'computer-keyboard') {
    if (!this.isInitialized) {
      console.log('SingleSamplePlayer not initialized');
      return;
    }
    // todo: check if handlers already added
    globalKeyboardInput.removeHandler({
      onNoteOn: this.playNote.bind(this),
      onNoteOff: this.releaseNote.bind(this),
    });

    switch (type) {
      case 'computer-keyboard':
        globalKeyboardInput.addHandler({
          onNoteOn: this.playNote.bind(this),
          onNoteOff: this.releaseNote.bind(this),
        });
      case 'midi':
        console.log('MIDI input not implemented yet');
        break;
      default:
        console.log('No input handlers added');
        break;
    }
  }
  removeInputHandlers() {
    if (!this.isInitialized) {
      console.log('SingleSamplePlayer not initialized');
      return;
    }
    globalKeyboardInput.removeHandler({
      onNoteOn: this.playNote.bind(this),
      onNoteOff: this.releaseNote.bind(this),
    });
  }

  async loadSample(url: string) {
    // todo: flexible source, add cache options
    const audioBuffer = await loadAudioSample(url);
    if (!audioBuffer) {
      console.warn('Failed to load audio sample');
      return null;
    }
    this.setSampleBuffer(audioBuffer);
    //  assert
    return audioBuffer.duration;
  }

  setSampleBuffer(buffer: AudioBuffer): void {
    this.#buffer = buffer;
    this.initVoices(buffer); // todo: maybe reuse VoiceNode's instead (add setBuffer to VoiceNode)
  }

  getSampleBuffer(): AudioBuffer | null {
    return this.#buffer;
  }

  getSampleDuration(): number | null {
    if (!this.#buffer) {
      console.warn('Audio buffer non-existent');
      return null;
    }
    return this.#buffer.duration;
  }

  initVoices(audioBuffer?: AudioBuffer): boolean {
    let buffer = audioBuffer || this.#buffer;
    if (!buffer) throw new Error('Buffer non-existent');
    if (!this.#outputGain) throw new Error('Output gain non-existent');
    if (!this.#buffer) throw new Error('Buffer non-existent');
    // todo: consistent assert system

    if (this.#availableVoices.length > 0 || this.#activeVoices.size > 0) {
      console.warn('Clearing existing voices...');
      this.clearVoices();
    }

    const voiceDestination = this.#outputGain; // processor ||
    for (let idx = 0; idx < this.#polyphony; idx++) {
      const voice = new VoiceNode(this.#context, this.#buffer, this.#rootNote);

      voice.addListener('note:on', (info) => this.notify('note:on', info));

      // Draft voice allocation
      voice.addListener('note:off', (info) => {
        this.notify('note:off', info);
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
        // Add the voice back to the available voices
        if (info.isAvailable) {
          this.#availableVoices.push(voice);
          console.log('Voice is available, nodeID: ' + voice.nodeId);
        }
      });

      voice.addListener('error', (info) => this.notify('error', info));

      voice.connect(voiceDestination);
      this.#availableVoices.push(voice);
    }

    console.log('SingleSamplePlayer initialized');
    return true;
  }

  // TEMP HACK VERSION
  setLoopPoint(
    loopPoint: 'loopStart' | 'loopEnd',
    targetValue: number,
    rampDuration: number
  ): void {
    this.#activeVoices.forEach((note) => {
      note.forEach((voice) =>
        voice.setLoopPoint(loopPoint, targetValue, rampDuration)
      );
    });
    this.#availableVoices.forEach((voice) => {
      voice.setLoopPoint(loopPoint, targetValue, rampDuration);
    });
    // notify
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
  releaseNote(midiNote: number, releaseTime?: number): void {
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
    } else {
      this.playError(midiNote, 'No active voice to release the note');
    }
  }

  //   const voice = this.#activeVoices.find((v) => v.isPlaying());
  //   if (voice) {
  //     voice.triggerRelease(releaseTime);
  //     this.#activeVoices = this.#activeVoices.filter((v) => v !== voice);
  //     this.#availableVoices.push(voice);
  //   } else {
  //     this.playError(midiNote, 'No active voice to release the note');
  //   }
  // }

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
    this.notify('error', {
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
    this.#loopController?.disconnect();
    this.#loopController = null;
    this.#context = null as unknown as BaseAudioContext;
    this.#buffer = null as unknown as AudioBuffer;
    this.isInitialized = false;
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
