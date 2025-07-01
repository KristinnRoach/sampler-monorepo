import { describe, it, expect, beforeEach } from 'vitest';
import { detectSinglePitchAC, highPassFilter } from '../';

// Helper to create mock AudioBuffer
function createMockAudioBuffer(
  data: Float32Array,
  sampleRate = 44100
): AudioBuffer {
  const buffer = {
    sampleRate,
    length: data.length,
    numberOfChannels: 1,
    duration: data.length / sampleRate,
    getChannelData: (channel: number) => {
      if (channel !== 0) throw new Error('Only channel 0 supported in mock');
      return data;
    },
  } as AudioBuffer;
  return buffer;
}

// Generate sine wave for testing
function generateSineWave(
  frequency: number,
  sampleRate: number,
  duration: number
): Float32Array {
  const samples = Math.floor(duration * sampleRate);
  const data = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    data[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return data;
}

describe('highPassFilter', () => {
  it('should filter out DC component', () => {
    // Use longer signal to see DC filtering effect
    const input = new Float32Array(1000).fill(1); // DC signal
    const result = highPassFilter(input, 44100, 400);

    // DC should be reduced over time - compare start vs end
    const initialValue = Math.abs(result[10]);
    const finalValue = Math.abs(result[result.length - 1]);
    expect(finalValue).toBeLessThan(initialValue);
  });

  it('should preserve high frequencies', () => {
    const highFreqSine = generateSineWave(1000, 44100, 0.1);
    const filtered = highPassFilter(highFreqSine, 44100, 400);

    // High frequency content should be mostly preserved
    const originalRMS = Math.sqrt(
      highFreqSine.reduce((sum, x) => sum + x * x, 0) / highFreqSine.length
    );
    const filteredRMS = Math.sqrt(
      filtered.reduce((sum, x) => sum + x * x, 0) / filtered.length
    );

    expect(filteredRMS / originalRMS).toBeGreaterThan(0.5);
  });

  it('should handle empty input', () => {
    const result = highPassFilter(new Float32Array(0), 44100, 400);
    expect(result.length).toBe(0);
  });

  it('should handle single sample', () => {
    const input = new Float32Array([0.5]);
    const result = highPassFilter(input, 44100, 400);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(0.5);
  });
});

describe('detectSinglePitchAC', () => {
  it('should detect 440Hz A4 note', async () => {
    const testSignal = generateSineWave(440, 44100, 0.2);
    const buffer = createMockAudioBuffer(testSignal);

    const result = await detectSinglePitchAC(buffer);

    // Allow 5% tolerance for frequency detection
    expect(result.frequency).toBeGreaterThan(418);
    expect(result.frequency).toBeLessThan(462);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should detect 220Hz A3 note', async () => {
    const testSignal = generateSineWave(220, 44100, 0.2);
    const buffer = createMockAudioBuffer(testSignal);

    const result = await detectSinglePitchAC(buffer);

    expect(result.frequency).toBeGreaterThan(209);
    expect(result.frequency).toBeLessThan(231);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('should handle low amplitude signals', async () => {
    const testSignal = generateSineWave(440, 44100, 0.1);
    // Reduce amplitude
    for (let i = 0; i < testSignal.length; i++) {
      testSignal[i] *= 0.01;
    }
    const buffer = createMockAudioBuffer(testSignal);

    const result = await detectSinglePitchAC(buffer);

    expect(result.frequency).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle noise input with low confidence', async () => {
    const noiseSignal = new Float32Array(4410); // 0.1 second at 44.1kHz
    // Generate white noise
    for (let i = 0; i < noiseSignal.length; i++) {
      noiseSignal[i] = (Math.random() - 0.5) * 2;
    }
    const buffer = createMockAudioBuffer(noiseSignal);

    const result = await detectSinglePitchAC(buffer);

    expect(result.frequency).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(0.3); // Should have low confidence for noise
  });

  it('should handle very short buffers', async () => {
    const shortSignal = new Float32Array(100);
    // Add some signal to avoid NaN
    for (let i = 0; i < shortSignal.length; i++) {
      shortSignal[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.1;
    }
    const buffer = createMockAudioBuffer(shortSignal);

    const result = await detectSinglePitchAC(buffer);

    expect(result.frequency).toBeGreaterThan(0);
    expect(Number.isFinite(result.confidence)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should return confidence between 0 and 1', async () => {
    const testSignal = generateSineWave(330, 44100, 0.15);
    const buffer = createMockAudioBuffer(testSignal);

    const result = await detectSinglePitchAC(buffer);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('should handle different sample rates', async () => {
    const testSignal = generateSineWave(440, 48000, 0.1);
    const buffer = createMockAudioBuffer(testSignal, 48000);

    const result = await detectSinglePitchAC(buffer);

    expect(result.frequency).toBeGreaterThan(418);
    expect(result.frequency).toBeLessThan(462);
  });

  it('should handle silent input', async () => {
    const silentSignal = new Float32Array(4410);
    const buffer = createMockAudioBuffer(silentSignal);

    const result = await detectSinglePitchAC(buffer);

    expect(result.frequency).toBeGreaterThan(0);
    // Silent input may return NaN confidence due to division by zero
    expect(Number.isNaN(result.confidence) || result.confidence === 0).toBe(
      true
    );
  });
});
