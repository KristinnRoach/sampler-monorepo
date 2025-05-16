// MidiController.ts - Simple minimal implementation
export class MidiController {
  #midiAccess: MIDIAccess | null = null;
  #initialized: boolean = false;

  // Todo: Allow multiple instruments on same channel, or all
  #instruments: Map<
    number,
    {
      onNoteOn: (note: number, velocity: number) => void;
      onNoteOff: (note: number) => void;
    }
  > = new Map();

  async initialize(): Promise<boolean> {
    if (this.#initialized) return true;

    try {
      this.#midiAccess = await navigator.requestMIDIAccess();

      const inputs = this.#midiAccess.inputs.values();
      for (const input of inputs) {
        input.onmidimessage = this.handleMidiMessage.bind(this);
        console.log(`MIDI input connected: ${input.name}`);
      }

      this.#initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
      return false;
    }
  }

  private handleMidiMessage(message: MIDIMessageEvent): void {
    // @ts-ignore
    const [status, note, velocity] = message.data;
    const channel = status & 0x0f; // Extract channel (0-15)
    const command = status & 0xf0; // Extract command

    // Note On (0x90)
    if (command === 0x90 && velocity > 0) {
      for (const instrument of this.#instruments.values()) {
        instrument.onNoteOn(note, velocity);
      }
    }
    // Note Off (0x80) or Note On with velocity 0
    else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      for (const instrument of this.#instruments.values()) {
        instrument.onNoteOff(note);
      }
    }
  }

  connectInstrument(
    instrument: {
      play: (note: number, velocity: number, modifiers?: any) => any;
      release: (note: number, modifiers?: any) => any;
    },
    channel: number = 0
  ): void {
    if (this.#initialized) {
      this.#instruments.set(channel, {
        onNoteOn: (note, velocity) => instrument.play(note, velocity),
        onNoteOff: (note) => instrument.release(note),
      });
    } else {
      console.log('connectInstrument failed: midi not initialized');
    }
  }

  disconnectInstrument(channel: number): void {
    this.#instruments.delete(channel);
  }

  get isInitialized() {
    return this.#initialized;
  }
}

// // MidiController.ts
// export class MidiController {
//   private static instance: MidiController | null = null;
//   private midiAccess: MIDIAccess | null = null;
//   private noteCallbacks: Map<
//     number,
//     ((note: number, velocity: number) => void)[]
//   > = new Map();
//   private noteOffCallbacks: Map<number, ((note: number) => void)[]> = new Map();

//   private constructor() {}

//   static async getInstance(): Promise<MidiController> {
//     if (!MidiController.instance) {
//       MidiController.instance = new MidiController();
//       await MidiController.instance.initialize();
//     }
//     return MidiController.instance;
//   }

//   private async initialize(): Promise<void> {
//     try {
//       this.midiAccess = await navigator.requestMIDIAccess();

//       const inputs = this.midiAccess.inputs.values();
//       for (const input of inputs) {
//         input.onmidimessage = this.handleMidiMessage.bind(this);
//       }

//       console.log('MIDI initialized successfully');
//     } catch (error) {
//       console.error('Failed to initialize MIDI:', error);
//     }
//   }

//   private handleMidiMessage(message: MIDIMessageEvent): void {
//     // @ts-ignore
//     const [status, note, velocity] = message.data;

//     // Note on (144-159 = 0x90-0x9F)
//     if (status >= 144 && status <= 159 && velocity > 0) {
//       const channel = status - 144;
//       const callbacks = this.noteCallbacks.get(channel) || [];
//       callbacks.forEach((callback) => callback(note, velocity));
//     }
//     // Note off (128-143 = 0x80-0x8F) or Note on with velocity 0
//     else if (
//       (status >= 128 && status <= 143) ||
//       (status >= 144 && status <= 159 && velocity === 0)
//     ) {
//       const channel = status >= 144 ? status - 144 : status - 128;
//       const callbacks = this.noteOffCallbacks.get(channel) || [];
//       callbacks.forEach((callback) => callback(note));
//     }
//   }

//   onNoteOn(
//     channel: number,
//     callback: (note: number, velocity: number) => void
//   ): void {
//     if (!this.noteCallbacks.has(channel)) {
//       this.noteCallbacks.set(channel, []);
//     }
//     this.noteCallbacks.get(channel)?.push(callback);
//   }

//   onNoteOff(channel: number, callback: (note: number) => void): void {
//     if (!this.noteOffCallbacks.has(channel)) {
//       this.noteOffCallbacks.set(channel, []);
//     }
//     this.noteOffCallbacks.get(channel)?.push(callback);
//   }

//   removeNoteOnListener(
//     channel: number,
//     callback: (note: number, velocity: number) => void
//   ): void {
//     const callbacks = this.noteCallbacks.get(channel) || [];
//     const index = callbacks.indexOf(callback);
//     if (index !== -1) {
//       callbacks.splice(index, 1);
//     }
//   }

//   removeNoteOffListener(
//     channel: number,
//     callback: (note: number) => void
//   ): void {
//     const callbacks = this.noteOffCallbacks.get(channel) || [];
//     const index = callbacks.indexOf(callback);
//     if (index !== -1) {
//       callbacks.splice(index, 1);
//     }
//   }
// }
