import { highPassFilter } from './pitchdetect-utils';

export async function detectSinglePitchAC(audioBuffer: AudioBuffer) {
  const data = audioBuffer.getChannelData(0);

  // Apply high-pass filter to remove boomy low frequencies
  const filteredData = highPassFilter(data, audioBuffer.sampleRate, 400);

  let correlations = new Float32Array(1000); // Max lag = ~200Hz at 44.1kHz

  const clipThreshold = 0.2;

  let maxAbs = 0;
  for (let i = 0; i < filteredData.length; i++) {
    const abs = Math.abs(filteredData[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  const clipLevel = clipThreshold * maxAbs;
  const clipped = filteredData.map((x) => (Math.abs(x) > clipLevel ? x : 0));

  // Autocorrelation
  for (let lag = 20; lag < correlations.length; lag++) {
    let sum = 0;
    for (let i = 0; i < clipped.length - lag; i++) {
      sum += clipped[i] * clipped[i + lag];
    }
    correlations[lag] = sum;
  }

  // Find peak correlation excluding short lags
  const minLag = Math.floor(audioBuffer.sampleRate / 1000); // ~1kHz upper bound
  const maxLag = Math.floor(audioBuffer.sampleRate / 80); // ~80Hz lower bound
  let bestLag = minLag;
  for (let i = minLag; i < maxLag; i++) {
    if (correlations[i] > correlations[bestLag]) bestLag = i;
  }

  // Quadratic interpolation for sub-sample precision
  const x = bestLag;
  const y1 = correlations[x - 1],
    y2 = correlations[x],
    y3 = correlations[x + 1];

  const denominator = 2 * (2 * y2 - y1 - y3);
  const offset = Math.abs(denominator) < 1e-6 ? 0 : (y3 - y1) / denominator;

  // Add confidence calculation
  const maxCorrelation = correlations[bestLag];
  const rms = Math.sqrt(
    filteredData.reduce((sum, x) => sum + x * x, 0) / filteredData.length
  );
  const normalizedMax = maxCorrelation / (rms * rms * filteredData.length);

  const confidence = Math.max(0, Math.min(1, normalizedMax));

  return {
    frequency: audioBuffer.sampleRate / (x + offset),
    confidence: confidence,
  };
}
