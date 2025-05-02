export interface InstrumentState {
  // TODO: remove or relocate
  [key: string]: number;
}

export const DEFAULT_SAMPLER_SETTINGS: InstrumentState = {
  midiNote: 60,
  velocity: 1,
  startOffset_sec: 0,
  endOffset_sec: 0,
  attack_sec: 0.01,
  release_sec: 0.3,
  loopEnabled: 0,
  loopStart_sec: 0,
  loopEnd_sec: 0,
};
