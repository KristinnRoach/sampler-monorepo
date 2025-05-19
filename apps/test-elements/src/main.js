import { animate, utils, createDraggable, createSpring } from 'animejs';

// document.addEventListener('keydown', (e) => console.log(e.code));

const init = () => {
  // Get references to elements
  const playerEl = document.getElementById(`sampler-1`);
  const loaderEl = document.getElementById(`loader-1`);
  const recorderEl = document.getElementById('recorder-1');

  console.log(playerEl.getAttributeNames());
  console.log(loaderEl.getAttributeNames());
  console.log(recorderEl.getAttributeNames());

  loaderEl.connect(playerEl);
  recorderEl.connect(playerEl);

  // create draggables
  const dragContainers = document.querySelectorAll('.draggable-container');

  const draggables = [];
  dragContainers.forEach((container) => {
    draggables.push(createDraggable(container.firstElementChild));
  });

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());
