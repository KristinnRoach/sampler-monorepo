// zero-crossing.ts

const THRESHOLD = 0.0001;

export function findZeroCrossings(
  audioBuffer: AudioBuffer,
  threshold: number = THRESHOLD
): number[] {
  const channel = audioBuffer.getChannelData(0); // Always use the first channel (left if stereo)
  const sampleRate = audioBuffer.sampleRate;
  const zeroCrossings: number[] = [];

  for (let i = 1; i < channel.length; i++) {
    if (Math.abs(channel[i]) < threshold) {
      // Sample is already very close to zero
      zeroCrossings.push(i / sampleRate);
    } else if (Math.sign(channel[i]) !== Math.sign(channel[i - 1])) {
      // Sign change detected, perform linear interpolation
      const t = -channel[i - 1] / (channel[i] - channel[i - 1]);
      const zeroCrossingTime = (i - 1 + t) / sampleRate;
      zeroCrossings.push(zeroCrossingTime);
    }
  }

  return zeroCrossings;
}

export function snapToNearestZeroCrossing(
  currTimeSec: number, // Seconds from start of audio buffer
  zeroCrossings: number[]
): number {
  if (zeroCrossings.length === 0) {
    console.warn('No zero crossings found');
    return currTimeSec;
  }

  return zeroCrossings.reduce((prev, curr) =>
    Math.abs(curr - currTimeSec) < Math.abs(prev - currTimeSec) ? curr : prev
  );
}

// Untested on real audio!
export function findWaveCycles(
  audioBuffer: AudioBuffer,
  threshold: number = THRESHOLD
): Array<{
  startTime: number;
  endTime: number;
  startSample: number;
  endSample: number;
}> {
  const channel = audioBuffer.getChannelData(0);
  const sr = audioBuffer.sampleRate;
  // Build zero crossings with direction (+ going up through zero, - going down)
  const zc: Array<{ t: number; dir: 1 | -1 }> = [];
  for (let i = 1; i < channel.length; i++) {
    const a = channel[i - 1],
      b = channel[i];
    if (Math.abs(b) < threshold) {
      zc.push({ t: i / sr, dir: (Math.sign(b) as 1 | -1) || 1 });
    } else if (Math.sign(a) !== Math.sign(b)) {
      const t = -a / (b - a);
      const time = (i - 1 + t) / sr;
      const dir = (b > a ? 1 : -1) as 1 | -1;
      zc.push({ t: time, dir });
    }
  }

  const cycles: Array<{
    startTime: number;
    endTime: number;
    startSample: number;
    endSample: number;
  }> = [];
  // Pair zero-crossings of the same direction (one full waveform period)
  for (let i = 0; i < zc.length - 2; i++) {
    const a = zc[i];
    const c = zc[i + 2];
    if (a.dir === c.dir) {
      const startTime = a.t;
      const endTime = c.t;
      cycles.push({
        startTime,
        endTime,
        startSample: Math.floor(startTime * sr),
        endSample: Math.floor(endTime * sr),
      });
    }
  }

  // Fallback: if too few directional pairs, use previous simple pairing
  if (cycles.length === 0 && zc.length > 1) {
    for (let i = 0; i < zc.length - 1; i += 2) {
      const startTime = zc[i].t;
      const endTime = zc[i + 1].t;
      cycles.push({
        startTime,
        endTime,
        startSample: Math.floor(startTime * sr),
        endSample: Math.floor(endTime * sr),
      });
    }
  }

  return cycles;
}

// Usage
// const zeroCrossings = findZeroCrossings(audioBuffer);
// loopStart = snapToNearestZeroCrossing(userSelectedLoopStart, zeroCrossings);
// loopEnd = snapToNearestZeroCrossing(userSelectedLoopEnd, zeroCrossings);
