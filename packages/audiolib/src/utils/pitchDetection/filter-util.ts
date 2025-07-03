export function highPassFilter(
  data: Float32Array,
  sampleRate: number,
  cutoffHz: number = 80
): Float32Array {
  // Simple first-order high-pass filter
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / sampleRate;
  const alpha = rc / (rc + dt);

  const filtered = new Float32Array(data.length);
  filtered[0] = 0;

  for (let i = 1; i < data.length; i++) {
    filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
  }

  return filtered;
}
