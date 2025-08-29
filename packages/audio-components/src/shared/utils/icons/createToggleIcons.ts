// createToggleIcons.ts
import { createSvgIcon } from './createSvgIcon';

import midiSvgRaw from '../../assets/icons/svg/svgrepo/midi-logo.svg?raw';
import keysSvgRaw from '../../assets/icons/svg/svgrepo/computer-keyboard-2.svg?raw';
import loopOnSvgRaw from '../../assets/icons/svg/svgrepo/loop-on.svg?raw';
import loopOffSvgRaw from '../../assets/icons/svg/svgrepo/loop-off.svg?raw';
import listeningSvgRaw from '../../assets/icons/svg/svgrepo/listening.svg?raw';
import recordSvgRaw from '../../assets/icons/svg/phosphore/record.svg?raw';
import stopSvgRaw from '../../assets/icons/svg/phosphore/stop.svg?raw';

export const createToggleIcons = (
  options: { width?: string; height?: string } = {}
) => {
  const { width = '2rem', height = '2rem' } = options;

  return {
    midi: createSvgIcon(midiSvgRaw, { width, height, color: 'white' }) ?? '',
    keys: createSvgIcon(keysSvgRaw, { width, height, color: 'white' }) ?? '',
    loopOn:
      createSvgIcon(loopOnSvgRaw, { width, height, color: 'white' }) ?? '',
    loopOff:
      createSvgIcon(loopOffSvgRaw, { width, height, color: 'white' }) ?? '',
    record:
      createSvgIcon(recordSvgRaw, {
        width,
        height,
        color: 'currentColor',
      }) ?? '',
    armed:
      createSvgIcon(listeningSvgRaw, { width, height, color: 'white' }) ?? '',
    stop:
      createSvgIcon(stopSvgRaw, { width, height, color: 'curren}tColor' }) ??
      '',
  };
};
