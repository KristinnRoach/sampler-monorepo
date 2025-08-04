import van from '@repo/vanjs-core';
import { qs } from './utils';
import { makeDraggable } from './utils/makeDraggable';

import { defineSampler } from '@repo/audio-components';

defineSampler(); // Define all sampler components

// Test auto-generated node ID
setTimeout(() => {
  const samplerEl = document.querySelector('sampler-element') as any;
  console.log('Auto-generated nodeId:', samplerEl?.nodeId);
}, 1000);

console.log('playground initialized');
