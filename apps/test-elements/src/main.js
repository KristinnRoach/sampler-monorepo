import van from '@repo/vanjs-core';
// import { Toggle } from './components/VanToggle.js';
// import { getAttributesArr } from './utils/log.js';
import { createDraggable } from 'animejs';
import { saveState, loadState, debouncedSaveState } from './state.js';
import { defineKarplusSynth } from '@repo/audio-components'; // ./components/KarplusElement.js';

const init = () => {
  const wrapperEl = document.getElementById('node-container');
  const playerEl = wrapperEl.querySelector(`.sampler`);
  const karplusEl = wrapperEl.querySelector('.karplus');
  const loaderEl = playerEl.querySelector(`.loader`);
  const recorderEl = playerEl.querySelector('.recorder');
  const envelopeEl = playerEl.querySelector('.ampenv');
  const loopControllerEl = playerEl.querySelector('.looper');
  // const offsetControllerEl = playerEl.getElementById(
  //   'sample-offset-controller-1'
  // );

  playerEl.addEventListener('sampleplayer-initialized', () => {
    // Load saved state
    loadState();

    // make connections
    recorderEl.addEventListener('recorder-initialized', (e) => {
      recorderEl.connect(playerEl);
    });

    loaderEl.connect(playerEl);
    envelopeEl.connect(playerEl);
    loopControllerEl.connect(playerEl);
    // offsetControllerEl.connect(playerEl);

    defineKarplusSynth();

    const lpfFreqSlider = createTestFilterSlider(playerEl);
    van.add(envelopeEl, lpfFreqSlider);

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
      // offsetControllerEl,
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
  // offsetControllerEl.setMinimumGap(0.1);

  // create draggables
  const draggables = document.querySelectorAll('.draggable');
  draggables.forEach((el) => createDraggable(el));

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

function createTestFilterSlider(playerEl) {
  /** Test filter sliders */
  const { input, div, label, span } = van.tags;

  const lfpHz = van.state(18000);
  van.derive(() => playerEl.player.setLpfCutoff(lfpHz.val));

  return div(
    { style: 'margin-bottom: 20px;' },
    label('LPF: '),
    input({
      type: 'range',
      min: 20,
      max: 20000,
      step: 10,
      value: () => lfpHz.val,
      oninput: (e) => (lfpHz.val = parseFloat(e.target.value)),
      style: 'margin-left: 10px;',
    }),
    span({ style: 'margin-left: 10px;' }, () => lfpHz.val + 'Hz')
  );
}
