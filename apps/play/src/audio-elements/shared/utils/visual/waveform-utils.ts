/**
 * Generate SVG path data for waveform visualization
 */
export const getWaveformSVGData = (
  audiobuffer: AudioBuffer,
  width: number,
  height: number,
  offsetY: number = 0
): string => {
  if (!audiobuffer.length) return '';

  const channelData = audiobuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / width);
  let path = '';

  for (let i = 0; i < width; i++) {
    const idx = i * step;
    const v = channelData[idx] || 0;
    const y = (1 - (v + 1) / 2) * height + offsetY;
    path += (i === 0 ? 'M' : 'L') + `${i},${y} `;
  }

  return path;
};
