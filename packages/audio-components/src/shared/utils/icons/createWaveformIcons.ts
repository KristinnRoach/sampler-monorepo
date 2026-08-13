// createWaveformIcons.ts
import { createSvgIcon } from './createSvgIcon';
import { SupportedWaveform } from '@repo/audiolib';

import sineRaw from '../../assets/icons/svg/waveworm/sine.svg?raw';
import sawtoothRaw from '../../assets/icons/svg/waveworm/sawtooth.svg?raw';
import triangleRaw from '../../assets/icons/svg/waveworm/triangle.svg?raw';
import squareRaw from '../../assets/icons/svg/waveworm/square.svg?raw';
import blSawRaw from '../../assets/icons/svg/waveworm/bl-saw.svg?raw';
import brownNoiseRaw from '../../assets/icons/svg/waveworm/brown-noise.svg?raw';
import coloredNoiseRaw from '../../assets/icons/svg/waveworm/colored-noise.svg?raw';
import customFunctionRaw from '../../assets/icons/svg/waveworm/custom-function.svg?raw';
import formantRaw from '../../assets/icons/svg/waveworm/formant.svg?raw';
import metallicRaw from '../../assets/icons/svg/waveworm/metallic.svg?raw';
import pinkNoiseRaw from '../../assets/icons/svg/waveworm/pink-noise.svg?raw';
import pulseRaw from '../../assets/icons/svg/waveworm/pulse.svg?raw';
import randomHarmonicRaw from '../../assets/icons/svg/waveworm/random-harmonic.svg?raw';
import supersawRaw from '../../assets/icons/svg/waveworm/supersaw.svg?raw';
import warmpadRaw from '../../assets/icons/svg/waveworm/warmpad.svg?raw';
import whiteRaw from '../../assets/icons/svg/waveworm/white.svg?raw';

// Map waveform names to their raw SVG imports
const waveformRawMap: Record<SupportedWaveform, string | undefined> = {
  sine: sineRaw,
  sawtooth: sawtoothRaw,
  triangle: triangleRaw,
  square: squareRaw,
  'bandlimited-sawtooth': blSawRaw,
  'brown-noise': brownNoiseRaw,
  'colored-noise': coloredNoiseRaw,
  'custom-function': customFunctionRaw,
  formant: formantRaw,
  metallic: metallicRaw,
  'pink-noise': pinkNoiseRaw,
  pulse: pulseRaw,
  'random-harmonic': randomHarmonicRaw,
  supersaw: supersawRaw,
  'warm-pad': warmpadRaw,
  'white-noise': whiteRaw,
};

/**
 * Returns the SVG icon for a single waveform
 * @param waveform SupportedWaveform
 * @param options width, height, color
 * @returns SVGElement | HTMLElement | string
 */
export function createWaveformIcon(
  waveform: SupportedWaveform,
  options: { width?: string; height?: string; color?: string } = {}
): SVGElement | null {
  const { width = '1.5rem', height = '1.5rem', color = 'white' } = options;
  const raw = waveformRawMap[waveform];
  return raw ? createSvgIcon(raw, { width, height, color }) : null;
}

export const createAllWaveformIcons = (
  options: {
    width?: string;
    height?: string;
    color?: string;
  } = {}
): Record<SupportedWaveform, SVGElement | null> => {
  const { width = '1.5rem', height = '1.5rem', color = 'white' } = options;
  const supportedWaveforms = Object.keys(waveformRawMap) as SupportedWaveform[];
  const icons: Record<SupportedWaveform, SVGElement | null> = {} as any;
  for (const waveform of supportedWaveforms) {
    icons[waveform] = createWaveformIcon(waveform, { width, height, color });
  }
  return icons;
};
