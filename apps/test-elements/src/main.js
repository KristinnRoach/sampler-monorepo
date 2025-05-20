import { animate, utils, createDraggable, createSpring } from 'animejs';
import { logAttributes, logKeyDown } from './utils/log.js';

// logKeyDown();

const init = () => {
  // Get references to elements
  const playerEl = document.getElementById(`sampler-1`);
  const loaderEl = document.getElementById(`loader-1`);
  const recorderEl = document.getElementById('recorder-1');
  const envelopeEl = document.getElementById('envelope-1');

  logAttributes([playerEl, loaderEl, recorderEl, envelopeEl]);

  loaderEl.connect(playerEl);
  recorderEl.connect(playerEl);

  // Test envelope interactions
  // You can remove the destination attribute from HTML and connect programmatically instead
  // envelopeEl.connect(playerEl);

  // Listen for envelope connection events
  envelopeEl.addEventListener('envelope-connected', (e) => {
    console.log('Envelope connected:', e.detail);
  });

  // Test changing envelope values after connection
  setTimeout(() => {
    console.log('Testing envelope parameter changes');
    envelopeEl.setAttribute('attack', '0.2');
    setTimeout(() => {
      envelopeEl.setAttribute('release', '1.0');
    }, 1000);
  }, 2000);

  // create draggables
  const dragContainers = document.querySelectorAll('.draggable-container');

  const draggables = [];
  dragContainers.forEach((container) => {
    draggables.push(createDraggable(container.firstElementChild));
  });

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());
