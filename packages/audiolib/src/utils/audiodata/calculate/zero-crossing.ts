export function findZeroCrossings(
  audioBuffer: AudioBuffer,
  threshold: number = 0.001
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
  time: number,
  zeroCrossings: number[]
): number {
  if (zeroCrossings.length === 0) {
    console.warn('No zero crossings found');
    return time;
  }

  return zeroCrossings.reduce((prev, curr) =>
    Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev
  );
}

// Usage
// const zeroCrossings = findZeroCrossings(audioBuffer);
// loopStart = snapToNearestZeroCrossing(userSelectedLoopStart, zeroCrossings);
// loopEnd = snapToNearestZeroCrossing(userSelectedLoopEnd, zeroCrossings);

/* NOT TESTED MULTI CHANNEL VERSION BELOW */

/*
  export function processMultiChannel(
    audioBuffer: AudioBuffer,
    threshold: number = 0.001
  ): number[] {
    const multiChannelCrossings = findZeroCrossingsMultiChannel(
      audioBuffer,
      threshold
    );
    return findCommonZeroCrossings(multiChannelCrossings);
  }
  
  export function findZeroCrossingsMultiChannel(
    audioBuffer: AudioBuffer,
    threshold: number = 0.001
  ): number[][] {
    const channelCount = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const zeroCrossings: number[][] = Array(channelCount)
      .fill([])
      .map(() => []);
  
    for (let channel = 0; channel < channelCount; channel++) {
      const audioData = audioBuffer.getChannelData(channel);
  
      for (let i = 1; i < audioData.length; i++) {
        if (Math.abs(audioData[i]) < threshold) {
          zeroCrossings[channel].push(i / sampleRate);
        } else if (Math.sign(audioData[i]) !== Math.sign(audioData[i - 1])) {
          const t = -audioData[i - 1] / (audioData[i] - audioData[i - 1]);
          const zeroCrossingTime = (i - 1 + t) / sampleRate;
          zeroCrossings[channel].push(zeroCrossingTime);
        }
      }
    }
  
    return zeroCrossings;
  }
  
  export function findCommonZeroCrossings(zeroCrossings: number[][]): number[] {
    if (zeroCrossings.length === 0) {
      console.error('No zero crossings found');
      throw new Error('No zero crossings found');
    }
  
    const [first, ...rest] = zeroCrossings;
    return first.filter((crossing) =>
      rest.every((channel) =>
        channel.some((time) => Math.abs(time - crossing) < 0.001)
      )
    );
  }
    */
