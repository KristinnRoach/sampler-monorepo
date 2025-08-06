import { qs, qsa } from './utils';
import gsap from 'gsap';
import { makeDraggable } from './utils/makeDraggable';

import { defineSampler } from '@repo/audio-components';
import '@repo/audio-components/audio-components.css';

defineSampler(); // Define all sampler components

// Function to animate sampler components entry
const animateSamplerEntry = () => {
  // Set initial state - target inner divs instead of custom elements
  gsap.set(
    '[target-node-id="test-sampler"] > div, computer-keyboard > *, piano-keyboard > *',
    {
      opacity: 0,
      scale: 0.75,
      y: 25,
      x: 0,
      // force3D: true, // Forces hardware acceleration
    }
  );

  // Create timeline for staggered animation
  const tl = gsap.timeline();

  // Animate main sampler element first
  tl.to('sampler-element > div', {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    duration: 0.6,
    ease: 'back.out(1.7)',
  });

  // Animate control groups with stagger
  tl.to(
    '[target-node-id="test-sampler"] > div',
    {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
      stagger: 0.05,
    },
    '-=0.3'
  );

  // Animate keyboards last
  tl.to(
    'computer-keyboard > *, piano-keyboard > *',
    {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      stagger: 0.2,
    },
    '-=0.1'
  );
};

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');
  const samplerEl = qs('sampler-element') as any;

  // Wait for sampler to be ready, then animate
  document.addEventListener('sampler-ready', () => {
    console.debug('Sampler ready, starting animations');
    animateSamplerEntry();
  });

  const sections = qsa('.grid-section');

  sections.forEach((element) => makeDraggable(element));

  setTimeout(() => {
    console.debug(samplerEl.nodeId);
  }, 10);
});
