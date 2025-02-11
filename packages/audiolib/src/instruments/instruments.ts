export interface Instrument {
  state: InstrumentState;
  actions: InstrumentActions;
}

export interface InstrumentActions {
  setParameter(key: string, value: any): void;

  connectToOutput(destination: AudioNode): void;
  disconnectOutput(): void;
  setParameter(key: string, value: number): void;
}

export interface PlaybackActions {
  startNote(note: number, velocity: number): void;
  stopNote(note: number): void;
  stopAllNotes(): void;
  scheduleNote(note: number, velocity: number, time_millisec: number): void;
  scheduleNotes(
    notes: number[],
    velocities: number[],
    time_millisec: number[]
  ): void;
}

export type InstrumentState = {
  isPlaying: Map<number, boolean>;
  velocity: Map<number, number>;
  parameters: Map<string, number>;
};
