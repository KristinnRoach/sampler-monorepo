// TODO: Improve this and add error handling
export function isValidAudioBuffer(
  buffer: AudioBuffer | null | undefined
): boolean {
  if (buffer === null || buffer === undefined) {
    return false;
  }

  const minDuration = 0.01; // Minimum duration in seconds
  const maxDuration = 60; // Maximum duration in seconds
  const minChannels = 1;
  const maxChannels = 32; // Arbitrary upper limit

  if (buffer.duration < minDuration) {
    return false;
  }

  if (buffer.duration > maxDuration) {
    return false;
  }

  if (
    buffer.numberOfChannels < minChannels ||
    buffer.numberOfChannels > maxChannels
  ) {
    return false;
  }

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    if (!channelData || channelData.length === 0) {
      return false;
    }

    // Check if the channel contains non-zero data
    const hasNonZeroData = channelData.some((sample) => sample !== 0);
    if (!hasNonZeroData) {
      return false;
    }
  }

  return true;
}
