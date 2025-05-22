import {
  utils,
  stagger,
  animate,
  createDraggable,
  createSpring,
} from 'animejs';
import { logAttributes, logKeyDown } from './utils/log.js';

// logKeyDown();

const init = () => {
  // Get references to elements
  const playerEl = document.getElementById(`sampler-1`);
  const loaderEl = document.getElementById(`loader-1`);
  const recorderEl = document.getElementById('recorder-1');
  const envelopeEl = document.getElementById('envelope-1');
  const loopControlEl = document.getElementById('loop-control-1');

  logAttributes([playerEl, loaderEl, recorderEl, envelopeEl, loopControlEl]);

  loaderEl.connect(playerEl);
  recorderEl.addEventListener('recorder-initialized', (e) => {
    console.log('Recorder initialized:', e.detail);
    recorderEl.connect(playerEl);
  });

  // Manual connection (can also be passed target elementId as attribute)
  envelopeEl.connect(playerEl);
  loopControlEl.connect(playerEl);

  // Listen for envelope connection events
  envelopeEl.addEventListener('envelope-connected', (e) => {
    console.log('Envelope connected:', e.detail);
  });

  // create draggables
  const draggables = document.querySelectorAll('.draggable');
  draggables.forEach((el) => {
    createDraggable(el);
  });

  console.log('Web Audio Elements app initialized');

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }

    if (e.key === 'Escape') {
      draggables.forEach((draggable) => {
        draggable.reset();
      });
    }
  });
};

document.addEventListener('DOMContentLoaded', () => init());
