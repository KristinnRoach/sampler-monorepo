// import van from '@repo/vanjs-core';
// import { Toggle } from './components/VanToggle.js';
// import { getAttributesArr } from './utils/log.js';
import { createDraggable } from 'animejs';
// import { saveState, loadState, debouncedSaveState } from './state.js';
import { defineKarplusSynth, defineSampler } from '@repo/audio-components'; // ./components/KarplusElement.js';
import { createAudiolib } from '@repo/audio-components';

const init = () => {
  // const audioContext = new AudioContext();
  const audiolib = createAudiolib({ autoInit: true })
    .then(() => {
      defineSampler();
      defineKarplusSynth();
    })
    .catch((e) =>
      console.error(
        `main.js, 
      create audiolib: ${audiolib},
      error: ${e}
       `
      )
    );

  // const wrapperEl = document.getElementById('node-container');
  // const samplerEl = wrapperEl.querySelector(`.sampler`);
  // const karplusEl = wrapperEl.querySelector('.karplus');
  // console.info(karplusEl.synth);

  // samplerEl.addEventListener('sampler-initialized', () => {
  // // Load saved state
  // loadState();

  // // Event listeners to save state on changes
  // document.querySelectorAll('.draggable').forEach((el) => {
  //   el.addEventListener('mouseup', debouncedSaveState);
  // });

  // // Event listeners to detect changes
  // [samplerEl, karplusEl].forEach((el) => {
  //   if (el) {
  //     el.addEventListener('change', debouncedSaveState);
  //   }
  // });

  // // Save state before page unload
  // window.addEventListener('beforeunload', saveState);
  // });

  // create draggables
  const draggables = document.querySelectorAll('.draggable');
  draggables.forEach((el) => createDraggable(el));

  document.addEventListener('keydown', (e) => {
    if (e.key === ' ') e.preventDefault();

    // if (e.key === 'Escape') {
    //   draggables.forEach((draggable) => {
    //     draggable.reset();
    //   });
    // }
  });

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());

// function createTestFilterSlider(playerEl) {
//   /** Test filter sliders */
//   const { input, div, label, span } = van.tags;

//   const lfpHz = van.state(18000);
//   van.derive(() => playerEl.player.setLpfCutoff(lfpHz.val));

//   return div(
//     { style: 'margin-bottom: 20px;' },
//     label('LPF: '),
//     input({
//       type: 'range',
//       min: 20,
//       max: 20000,
//       step: 10,
//       value: () => lfpHz.val,
//       oninput: (e) => (lfpHz.val = parseFloat(e.target.value)),
//       style: 'margin-left: 10px;',
//     }),
//     span({ style: 'margin-left: 10px;' }, () => lfpHz.val + 'Hz')
//   );
// }
