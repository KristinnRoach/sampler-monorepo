import van from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { createKarplusStrongSynth, KarplusStrongSynth } from '@repo/audiolib';
import { createCheckbox, createSlider } from './utils/createInputEl';

const { div } = van.tags;

const KarplusElement = (attributes: ElementProps) => {
  let ksSynth: KarplusStrongSynth;

  const keyboardEnabled = van.state(false);
  const midiEnabled = van.state(false);
  const volume = van.state(0.5);
  const attack = van.state(0.001);
  const decay = van.state(0.9);
  const noiseTime = van.state(10);
  const lpfFreq = van.state(18000);
  const hpfFreq = van.state(20);

  // Helper to avoid repetitive null checks (replacing "if (!ksSynth) return")
  const derive = (fn: () => void) => van.derive(() => ksSynth && fn());

  attributes.mount(() => {
    ksSynth = createKarplusStrongSynth(32);
    if (!ksSynth) {
      console.warn('Failed to create Karplus-Strong synthesizer');
      return;
    }

    ksSynth.connect(ksSynth.context.destination);

    derive(() =>
      keyboardEnabled.val ? ksSynth.enableKeyboard() : ksSynth.disableKeyboard()
    );
    derive(() =>
      midiEnabled.val ? ksSynth.enableMIDI() : ksSynth.disableMIDI()
    );
    derive(() => (ksSynth.volume = volume.val));
    derive(() => {
      ksSynth.setParameterValue('attack', attack.val);
      ksSynth.setParameterValue('decay', decay.val);
      ksSynth.setParameterValue('noiseTime', noiseTime.val);
    });
    derive(() => {
      ksSynth.setLpfCutoff(lpfFreq.val);
      ksSynth.setHpfCutoff(hpfFreq.val);
    });

    return () => ksSynth?.dispose();
  });

  return div(
    { class: 'karplus-synth', style: 'padding: 20px; font-family: Arial;' },
    createSlider('Volume', volume, 0, 1, 0.01),
    createSlider('Decay', decay, 0, 1, 0.01),
    createSlider('Attack', attack, 0, 1, 0.01),
    createSlider('Noise Hold', noiseTime, 1, 100, 1, '%', 1),
    createSlider('LPF Frequency', lpfFreq, 20, 20000, 1, ' Hz', 1),
    createSlider('HPF Frequency', hpfFreq, 20, 20000, 1, ' Hz', 1),
    div(
      { style: 'display: flex; gap: 10px;' },
      createCheckbox('Enable Keyboard', keyboardEnabled),
      createCheckbox('Enable MIDI', midiEnabled)
    )
  );
};

export const defineKarplusSynth = (elementName: string = 'karplus-synth') => {
  define(elementName, KarplusElement, false);
};

// import van from '@repo/vanjs-core';
// import { define, ElementProps } from '@repo/vanjs-core/element';
// import { createKarplusStrongSynth, KarplusStrongSynth } from '@repo/audiolib';
// import { createCheckbox, createSlider } from './utils/createInputEl';

// const { div } = van.tags;

// const KarplusElement = (attributes: ElementProps) => {
//   let ksSynth: KarplusStrongSynth;

//   // Reactive states
//   const keyboardEnabled = van.state(false);
//   const midiEnabled = van.state(false);
//   const volume = van.state(0.5);
//   const attack = van.state(0.001);
//   const decay = van.state(0.9);
//   const noiseTime = van.state(10);
//   const lpfFreq = van.state(18000);
//   const hpfFreq = van.state(20);

//   attributes.mount(() => {
//     ksSynth = createKarplusStrongSynth(32);
//     ksSynth.connect(ksSynth.context.destination);
//     // Reactive updates
//     van.derive(() => {
//       keyboardEnabled.val
//         ? ksSynth.enableKeyboard()
//         : ksSynth.disableKeyboard();
//       midiEnabled.val ? ksSynth.enableMIDI() : ksSynth.disableMIDI();

//       ksSynth.volume = volume.val;

//       ksSynth.setParameterValue('attack', attack.val);
//       ksSynth.setParameterValue('decay', decay.val);
//       ksSynth.setParameterValue('noiseTime', noiseTime.val);

//       ksSynth.setLpfCutoff(lpfFreq.val);
//       ksSynth.setHpfCutoff(hpfFreq.val);
//     });

//     return () => ksSynth?.dispose();
//   });

//   return div(
//     { class: 'karplus-synth', style: 'padding: 20px; font-family: Arial;' },

//     createSlider('Volume', volume, 0, 1, 0.01),
//     createSlider('Decay', decay, 0, 1, 0.01),
//     createSlider('Attack', attack, 0, 1, 0.01),
//     createSlider('Noise Hold', noiseTime, 1, 100, 1, '%', 1),
//     createSlider('LPF Frequency', lpfFreq, 20, 20000, 1, ' Hz', 1),
//     createSlider('HPF Frequency', hpfFreq, 20, 20000, 1, ' Hz', 1),

//     div(
//       { style: 'display: flex; gap: 10px;' },
//       createCheckbox('Enable Keyboard', keyboardEnabled),
//       createCheckbox('Enable MIDI', midiEnabled)
//     )
//   );
// };

// export const defineKarplusSynth = (elementName: string = 'karplus-synth') => {
//   define(elementName, KarplusElement, false);
// };
