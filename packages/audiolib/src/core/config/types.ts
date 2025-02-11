export type WebAudioConfig = {
  sampleRate: number;
  options: {
    latencyHint?: AudioContextLatencyCategory | number;
  };
};

export type AudioLibConfig = {
  audio: WebAudioConfig; // could be expanded for non-web
};
