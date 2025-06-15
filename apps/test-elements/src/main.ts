import van from '@repo/vanjs-core';
import { createDraggable } from 'animejs';
import { defineKarplusSynth, defineSampler } from '@repo/audio-components';
import { createAudiolib } from '@repo/audio-components';

const init = () => {
  const audiolib = createAudiolib({ autoInit: true })
    .then(() => {
      defineSampler();
      defineKarplusSynth();
    })
    .catch((e) => console.error(`main.js, Create audiolib error: ${e}`));

  console.info({ audiolib });

  // create draggables
  const draggables = document.querySelectorAll('.instrument-draggable');
  draggables.forEach((el) => createDraggable(el));

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
});
