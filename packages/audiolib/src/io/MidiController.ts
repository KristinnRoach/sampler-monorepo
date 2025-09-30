// MidiController.ts
import type { ILibInstrumentNode } from '@/nodes/LibAudioNode.js';

// TODO: Merge into shared package ?

export class MidiController {
  #midiAccess: MIDIAccess | null = null;
  #initialized: boolean = false;
  #sustainPedalState = false;

  #instruments: Map<number | 'all', ILibInstrumentNode[]> = new Map();

  async initialize(): Promise<boolean> {
    if (this.#initialized) return true;

    try {
      this.#midiAccess = await navigator.requestMIDIAccess();

      const inputs = this.#midiAccess.inputs.values();
      for (const input of inputs) {
        input.onmidimessage = this.#handleMidiMessage.bind(this);
        console.log(`MIDI input connected: ${input.name}`);
      }

      this.#initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
      return false;
    }
  }

  // ==== Public API ==== //

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

  // Convenience method to switch channel for an instrument (auto diconnect from old channel)
  switchInstrumentChannel(
    instrument: ILibInstrumentNode,
    newChannel: number | 'all'
  ): void {
    this.disconnectInstrument(instrument);
    this.connectInstrument(instrument, newChannel);
  }

  get isInitialized() {
    return this.#initialized;
  }

  #handleMidiMessage(message: MIDIMessageEvent): void {
    if (!this.#initialized) return;
    if (!message || !message.data) return;

    const data = message.data;
    const status = data[0];

    // Ignore all system messages (0xF0 and above)
    if (status >= 0xf0) return;

    const command = status & 0xf0;
    const channel = status & 0x0f;
    const [_, note, velocity] = data;

    // console.debug(
    //   `MIDI: status=${status.toString(16)}, note=${note}, velocity=${velocity}, command=${command.toString(16)}`
    // );

    // Note On (0x90)
    if (command === 0x90 && velocity > 0) {
      const instruments = this.#getInstrumentsForChannel(channel);
      for (const instrument of instruments) {
        instrument.play(note, velocity);
      }
      return;
    }

    // Note Off (0x80) or Note On with velocity 0
    if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      const instruments = this.#getInstrumentsForChannel(channel);
      for (const instrument of instruments) {
        instrument.release(note);
      }
      return;
    }

    // Sustain pedal (CC64) - UI handles other CCs
    if (command === 0xb0 && note === 64) {
      const sustainPressed = velocity >= 64;

      if (this.#sustainPedalState !== sustainPressed) {
        this.#sustainPedalState = sustainPressed;

        const instruments = this.#getInstrumentsForChannel(channel);
        for (const instrument of instruments) {
          if (sustainPressed && instrument.sustainPedalOn) {
            instrument.sustainPedalOn();
          } else if (!sustainPressed && instrument.sustainPedalOff) {
            instrument.sustainPedalOff();
          }
        }
      }
    }
  }

  // Helper function to get instruments connected to one channel or broadcasting on 'all' channels
  #getInstrumentsForChannel = (targetChannel: number) => {
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
}
