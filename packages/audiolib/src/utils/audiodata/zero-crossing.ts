// zero-crossing.ts

const THRESHOLD = 0.0001;

export function findZeroCrossings(
  audioBuffer: AudioBuffer,
  threshold: number = THRESHOLD
): number[] {
  const channel = audioBuffer.getChannelData(0); // Assuming mono audio !
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

export function findWaveCycles(
  audioBuffer: AudioBuffer,
  threshold: number = THRESHOLD
): Array<{
  startTime: number;
  endTime: number;
  startSample: number;
  endSample: number;
}> {
  const zeroCrossings = findZeroCrossings(audioBuffer, threshold);
  const sampleRate = audioBuffer.sampleRate;
  const cycles = [];

  // Every 2 zero crossings = 1 complete cycle
  for (let i = 0; i < zeroCrossings.length - 1; i += 2) {
    if (i + 1 < zeroCrossings.length) {
      const startTime = zeroCrossings[i];
      const endTime = zeroCrossings[i + 1];

      cycles.push({
        startTime,
        endTime,
        startSample: Math.floor(startTime * sampleRate),
        endSample: Math.floor(endTime * sampleRate),
      });
    }
  }

  return cycles;
}

// Usage
// const zeroCrossings = findZeroCrossings(audioBuffer);
// loopStart = snapToNearestZeroCrossing(userSelectedLoopStart, zeroCrossings);
// loopEnd = snapToNearestZeroCrossing(userSelectedLoopEnd, zeroCrossings);
