// main.ts
import { updateSW } from './utils/pwa-utils/updateSW';
import { defineSampler } from '@repo/audio-components';
import type { SamplerElement } from '@repo/audio-components';
import { addExpandCollapseListeners } from './utils/expandCollapse';
import { qs } from './utils/dom-utils';

defineSampler(); // Define all sampler components

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');

  const samplerEl = qs('sampler-element') as SamplerElement;
  let samplePlayer: any;

  document.addEventListener('sample-loaded', () => {
    samplePlayer = samplerEl.getSamplePlayer();
    // console.info(samplePlayer);
  });

  addExpandCollapseListeners();
});
