// packages/audiolib/src/lib/types.ts
export interface AudioConfig {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory | number;
}

export interface AudioPlayerOptions {
  volume?: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
}

export interface InstrumentParameters {
  gain: number;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
}

export interface InstrumentState {
  isPlaying: Map<number, boolean>;
  velocity: Map<number, number>;
  parameters: InstrumentParameters;
}
