import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateTestBuffer } from './generateTestBuffer';
import {
  getOfflineAudioContext,
  releaseOfflineContext,
  clearAllOfflineContexts,
} from '@/context';

describe('generateTestBuffer', () => {
  const config = { length: 44100, sampleRate: 44100 };
  let ctx: OfflineAudioContext;

  beforeEach(() => {
    clearAllOfflineContexts();
    ctx = getOfflineAudioContext(config);
  });

  afterEach(() => {
    releaseOfflineContext(config);
    clearAllOfflineContexts();
  });

  it('generates valid audio buffer with default parameters', () => {
    const buffer = generateTestBuffer(ctx);

    expect(buffer).toBeInstanceOf(AudioBuffer);
    expect(buffer.length).toBe(ctx.sampleRate); // 1 second
    expect(buffer.numberOfChannels).toBe(1);
    expect(buffer.sampleRate).toBe(ctx.sampleRate);

    // Verify sine wave generation
    const data = buffer.getChannelData(0);
    expect(data[0]).toBeCloseTo(0, 5); // Sine wave starts at 0

    // Find the peak amplitude in the first period
    const samplesPerPeriod = ctx.sampleRate / 440; // 440Hz is default frequency
    const firstPeriod = data.slice(0, Math.ceil(samplesPerPeriod));
    const peakAmplitude = Math.max(...firstPeriod.map(Math.abs));
    expect(peakAmplitude).toBeCloseTo(1, 1); // Should reach close to ±1
  });

  it('respects custom parameters', () => {
    const buffer = generateTestBuffer(ctx, {
      duration: 2,
      frequency: 880,
      channels: 2,
      type: 'square',
    });

    expect(buffer.length).toBe(ctx.sampleRate * 2);
    expect(buffer.numberOfChannels).toBe(2);

    // Verify square wave characteristics
    const data = buffer.getChannelData(0);

    // Find maximum absolute value (should be close to 1)
    const maxAmplitude = Math.max(...Array.from(data).map(Math.abs));
    expect(maxAmplitude).toBeCloseTo(1, 1);

    // Verify that most values are either close to +1, -1, or transitioning
    const values = Array.from(data).map((v) => Math.abs(Math.abs(v) - 1));
    const closeToExtreme = values.filter((v) => v < 0.1).length;
    expect(closeToExtreme / data.length).toBeGreaterThan(0.8); // At least 80% should be near ±1
  });

  it('generates correct waveform types', () => {
    const types = ['sine', 'square', 'sawtooth', 'white-noise'] as const;

    types.forEach((type) => {
      const buffer = generateTestBuffer(ctx, { type });
      const data = buffer.getChannelData(0);

      switch (type) {
        case 'white-noise':
          // Check statistical properties of noise
          const sum = data.reduce((acc, val) => acc + val, 0);
          expect(Math.abs(sum / data.length)).toBeLessThan(0.1); // Mean should be close to 0

          // Check that values are between -1 and 1
          const allInRange = data.every((val) => val >= -1 && val <= 1);
          expect(allInRange).toBe(true);
          break;

        case 'sawtooth':
          // Verify sawtooth characteristics - should have full range
          const sawtoothRange = Math.max(...data) - Math.min(...data);
          expect(sawtoothRange).toBeCloseTo(2, 1); // Should span roughly -1 to 1
          break;

        case 'square':
          // Verify that most values are close to either +1 or -1
          const values = Array.from(data).map((v) => Math.abs(Math.abs(v) - 1));
          const closeToExtreme = values.filter((v) => v < 0.1).length;
          expect(closeToExtreme / data.length).toBeGreaterThan(0.8);
          break;

        case 'sine':
          // Verify sine wave characteristics
          const maxAmp = Math.max(...data.map(Math.abs));
          expect(maxAmp).toBeCloseTo(1, 1);

          // Check for smooth transitions
          const hasSmoothing = data.some(
            (v, i) => i > 0 && Math.abs(v - data[i - 1]) < 0.1
          );
          expect(hasSmoothing).toBe(true);
          break;
      }
    });
  });
});
