export interface SampleVoiceSettings {
  [key: string]: number;
}

export const DEFAULT_SAMPLE_VOICE_SETTINGS: SampleVoiceSettings = {
  startOffset_sec: 0,
  endOffset_sec: 0,
  attack_sec: 0.01,
  release_sec: 0.3,
  loopEnabled: 0,
  loopStart_sec: 0,
  loopEnd_sec: 0,
};
