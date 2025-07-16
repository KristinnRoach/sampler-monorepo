export function detectThresholdCrossing(
  audioBuffer: AudioBuffer,
  silenceThreshold: number
): { start: number; end: number } {
  const numChannels = audioBuffer.numberOfChannels;
  //   const sampleRate = audioBuffer.sampleRate;
  const samples = Array.from({ length: numChannels }, (_, i) =>
    audioBuffer.getChannelData(i)
  );

  const totalSamples = samples[0].length;

  function findFromStart(): number {
    for (let i = 0; i < totalSamples; i++) {
      const maxAmplitude = Math.max(
        ...samples.map((channel) => Math.abs(channel[i]))
      );
      if (maxAmplitude > silenceThreshold) {
        return i; // / sampleRate;
      }
    }
    return 0;
  }

  function findFromEnd(): number {
    for (let i = totalSamples - 1; i >= 0; i--) {
      const maxAmplitude = Math.max(
        ...samples.map((channel) => Math.abs(channel[i]))
      );
      if (maxAmplitude > silenceThreshold) {
        return i; // / sampleRate;
      }
    }
    return 0;
  }

  return {
    start: findFromStart(),
    end: findFromEnd(),
  };
}
