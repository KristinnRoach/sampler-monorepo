// MidiController.ts
import type { ILibInstrumentNode } from '@/nodes/LibAudioNode.js';
export class MidiController {
  #midiAccess: MIDIAccess | null = null;
  #initialized: boolean = false;
  #sustainPedalState = false;

  // Support multiple instruments per channel, plus 'all' channel
  #instruments: Map<number | 'all', ILibInstrumentNode[]> = new Map();

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
    if (!this.#initialized) return;
    if (!message || !message.data) return;

    const data = message.data;
    const status = data[0];

    // Active Sensing (FE), Timing Clock, Start, Stop, Continue, etc. (F8-FF)
    if (status >= 0xf8) {
      // Ignore housekeeping messages for now.
      return;
    }

    // System Exclusive (sysex)
    if (status === 0xf0) {
      console.log('MIDI: SysEx message received, ignoring.');
      return;
    }

    // Other System Common messages (like Song Position Pointer, etc.)
    if (status >= 0xf0) {
      // These are rarely useful for instrument play logic
      return;
    }

    // Channel Voice messages: Only these use note/velocity meaningfully
    const [_, note, velocity] = data;
    const channel = status & 0x0f;
    const command = status & 0xf0;

    // console.debug(
    //   `MIDI: status=${status.toString(16)}, note=${note}, velocity=${velocity}, command=${command.toString(16)}`
    // );

    // Helper function to get instruments for a channel (includes 'all' channel instruments)
    const getInstrumentsForChannel = (targetChannel: number) => {
      const instruments = [];

      // Add instruments listening to this specific channel
      const channelInstruments = this.#instruments.get(targetChannel);
      if (channelInstruments) {
        instruments.push(...channelInstruments);
      }

      // Add instruments listening to all channels
      const allChannelInstruments = this.#instruments.get('all');
      if (allChannelInstruments) {
        instruments.push(...allChannelInstruments);
      }

      return instruments;
    };

    // Control Change (0xB0) - CC64 for sustain pedal
    if (command === 0xb0 && note === 64) {
      const sustainPressed = velocity >= 64;
      // console.debug(`Sustain pedal ${sustainPressed ? 'PRESSED' : 'RELEASED'}`);

      if (this.#sustainPedalState !== sustainPressed) {
        this.#sustainPedalState = sustainPressed;

        const instruments = getInstrumentsForChannel(channel);
        for (const instrument of instruments) {
          if (sustainPressed && instrument.sustainPedalOn) {
            instrument.sustainPedalOn();
          } else if (!sustainPressed && instrument.sustainPedalOff) {
            instrument.sustainPedalOff();
          }
        }
      }
    }

    // Note On (0x90)
    if (command === 0x90 && velocity > 0) {
      const instruments = getInstrumentsForChannel(channel);
      for (const instrument of instruments) {
        instrument.play(note, velocity);
      }
    }
    // Note Off (0x80) or Note On with velocity 0
    else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      const instruments = getInstrumentsForChannel(channel);
      for (const instrument of instruments) {
        instrument.release(note);
      }
    }
  }

  connectInstrument(
    instrument: ILibInstrumentNode,
    channel: number | 'all' = 'all'
  ): void {
    if (this.#initialized) {
      if (!this.#instruments.has(channel)) {
        this.#instruments.set(channel, []);
      }
      this.#instruments.get(channel)!.push(instrument);
    } else {
      console.log('connectInstrument failed: midi not initialized');
    }
  }

  // Disconnect an instrument from a specific midi channel, or from all midi channels
  disconnectInstrument(
    instrument: ILibInstrumentNode,
    channel: number | 'all' = 'all'
  ): void {
    if (channel === 'all') {
      // Remove instrument from ALL channels (the 'all' array of the channel -> instruments map)
      for (const [channelKey, instruments] of this.#instruments.entries()) {
        const index = instruments.findIndex((inst) => inst === instrument);
        if (index !== -1) {
          instruments.splice(index, 1);
          // Remove the channel entry if no instruments remain
          if (instruments.length === 0) {
            this.#instruments.delete(channelKey);
          }
        }
      }
    } else {
      // Remove instrument from specific channel
      const instruments = this.#instruments.get(channel);
      if (instruments) {
        const index = instruments.findIndex((inst) => inst === instrument);
        if (index !== -1) {
          instruments.splice(index, 1);
          // Remove the channel entry if no instruments remain
          if (instruments.length === 0) {
            this.#instruments.delete(channel);
          }
        }
      }
    }
  }

  get isInitialized() {
    return this.#initialized;
  }
}
