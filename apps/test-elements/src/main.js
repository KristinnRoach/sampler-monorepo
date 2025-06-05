import van from '@repo/vanjs-core';
// import { Toggle } from './components/VanToggle.js';
import { createDraggable } from 'animejs';
import { getAttributesArr } from './utils/log.js';

import {
  KarplusSynthComponent,
  ksSynth,
} from './components/KarplusComponent.js';

import { saveState, loadState, debouncedSaveState } from './state.js';

import { defineKarplusSynth } from './components/KarplusElement.js';

const init = () => {
  // Get references to elements

  const playerEl = document.getElementById(`sampler-1`);

  // const karplusCompBox = document.getElementById('karplus-1');
  const karplusEl = document.getElementById('karplus-2');

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
      karplusEl,
      // karplusCompBox,
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

    // // Testing out Karplus synth
    // van.add(karplusCompBox, KarplusSynthComponent());

    defineKarplusSynth();

    // MEGA TEST __________________________
    // const player = playerEl.player;
    // console.table(player);

    // const ctx = ksSynth.context;
    // const eXtraGain = new GainNode(ctx);
    // eXtraGain.gain.setValueAtTime(1.5, ctx.currentTime);

    // player.connectAltOut(eXtraGain);

    // console.info(ksSynth.auxIn);
    // eXtraGain.connect(ksSynth.auxIn);

    // MEGA TEST __________________________

    // Load saved state
    loadState();

    // Set up event listeners to save state on changes
    document.querySelectorAll('.draggable').forEach((el) => {
      el.addEventListener('mouseup', debouncedSaveState);
    });

    // Add event listeners to elements to detect changes
    [
      playerEl,
      loaderEl,
      recorderEl,
      envelopeEl,
      loopControllerEl,
      offsetControllerEl,
      karplusEl,
    ].forEach((el) => {
      if (el) {
        el.addEventListener('change', debouncedSaveState);
      }
    });

    // Save state before page unload
    window.addEventListener('beforeunload', saveState);
  });

  loopControllerEl.setMinimumGap(0.003);
  offsetControllerEl.setMinimumGap(0.1);

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
