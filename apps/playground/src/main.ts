import { qs } from './utils';

import { defineSampler } from '@repo/audio-components';

defineSampler(); // Define all sampler components

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');
  const samplerEl = qs('sampler-element') as any;

  setTimeout(() => {
    console.debug(samplerEl.nodeId);
  }, 10);
});
