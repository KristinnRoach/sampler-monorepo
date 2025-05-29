// import van from '@repo/vanjs-core';
// import { Toggle } from './components/VanToggle.js';
import { createDraggable } from 'animejs';
import { getAttributesArr } from './utils/log.js';

// logKeyDown();

const init = () => {
  // Get references to elements
  const playerEl = document.getElementById(`sampler-1`);
  const loaderEl = document.getElementById(`loader-1`);
  const recorderEl = document.getElementById('recorder-1');

  const envelopeEl = document.getElementById('envelope-1');
  const loopControllerEl = document.getElementById('loop-controller-1');

  const offsetControllerEl = document.getElementById(
    'sample-offset-controller-1'
  );

  console.table(
    getAttributesArr([
      playerEl,
      loaderEl,
      recorderEl,
      envelopeEl,
      loopControllerEl,
      offsetControllerEl,
    ])
  );

  playerEl.addEventListener('sampleplayer-initialized', () => {
    // Manual connection (can also be passed target elementId as attribute)

    recorderEl.addEventListener('recorder-initialized', (e) =>
      recorderEl.connect(playerEl)
    );

    loaderEl.connect(playerEl);
    envelopeEl.connect(playerEl);
    loopControllerEl.connect(playerEl);
    offsetControllerEl.connect(playerEl);
  });

  loopControllerEl.setMinimumGap(0.003);
  offsetControllerEl.setMinimumGap(0.1);

  // van.add(
  //   loopControllerEl,
  //   Toggle({
  //     on: false,
  //     size: 2,
  //     onColor: '#4CAF50',
  //   })
  // );

  // create draggables
  const draggables = document.querySelectorAll('.draggable');
  draggables.forEach((el) => {
    createDraggable(el);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') e.preventDefault();

    if (e.key === 'Escape') {
      draggables.forEach((draggable) => {
        draggable.reset();
      });
    }
  });

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());
