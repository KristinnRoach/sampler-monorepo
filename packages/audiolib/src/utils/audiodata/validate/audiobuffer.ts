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

  // Check if all channels are silent
  let hasNonZeroData = false;
  let peakAmplitude = 0;
  let rmsAmplitude = 0;

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    try {
      const channelData = buffer.getChannelData(channel);
      if (!channelData || channelData.length === 0) {
        return false;
      }

      let sumSquared = 0;
      // Check for any non-zero samples and calculate peak/RMS
      for (let i = 0; i < channelData.length; i++) {
        const sampleValue = Math.abs(channelData[i]);
        if (sampleValue > 0) {
          hasNonZeroData = true;
        }
        if (sampleValue > peakAmplitude) {
          peakAmplitude = sampleValue;
        }
        sumSquared += sampleValue * sampleValue;
      }

      // Calculate RMS for this channel
      const channelRMS = Math.sqrt(sumSquared / channelData.length);
      if (channelRMS > rmsAmplitude) {
        rmsAmplitude = channelRMS;
      }

      if (hasNonZeroData) break;
    } catch (error) {
      return false;
    }
  }

  // Log amplitude information
  if (hasNonZeroData) {
    const peakDB = 20 * Math.log10(peakAmplitude);
    const rmsDB = 20 * Math.log10(rmsAmplitude);
    console.log(`AudioBuffer Analysis:
      Duration: ${buffer.duration} seconds
      Peak amplitude: ${peakAmplitude.toFixed(4)} (${peakDB.toFixed(1)} dB)
      RMS amplitude: ${rmsAmplitude.toFixed(4)} (${rmsDB.toFixed(1)} dB)
    `);
  }

  return hasNonZeroData;
}
