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
