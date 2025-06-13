import van from '@repo/vanjs-core';
import { define } from '@repo/vanjs-core/element';
import { createKarplusStrongSynth } from '@repo/audio-components';

const { div, span, input, label } = van.tags;

// Helper function to create slider controls
export const createSliderControl = (
  labelText,
  state,
  min,
  max,
  step,
  unit = '%',
  multiplier = 100
) => {
  return div(
    { style: 'margin-bottom: 20px;' },
    label(labelText + ': '),
    input({
      type: 'range',
      min,
      max,
      step,
      value: state,
      oninput: (e) => (state.val = parseFloat(e.target.value)),
      style: 'margin-left: 10px;',
      class: 'interactive-element',
    }),
    span({ style: 'margin-left: 10px;' }, () =>
      unit === '%'
        ? Math.round(state.val * multiplier) + unit
        : state.val + unit
    )
  );
};

// Helper function to create checkbox controls
export const createCheckboxControl = (labelText, state) => {
  return label(
    { style: 'display: flex; align-items: center; gap: 8px; cursor: pointer;' },
    input({
      type: 'checkbox',
      checked: state,
      onchange: (e) => (state.val = e.target.checked),
    }),
    labelText
  );
};

const KarplusElement = (attributes) => {
  let ksSynth;

  // Van.js reactive states
  const keyboardEnabled = van.state(false);
  const midiEnabled = van.state(false);
  const volume = van.state(0.5);
  const attack = van.state(0.001);
  const decay = van.state(0.9);
  const noiseTime = van.state(10);
  const lpfFreq = van.state(18000);
  const hpfFreq = van.state(20);

  // Initialize synth when element mounts
  attributes.mount(() => {
    ksSynth = createKarplusStrongSynth(32);
    ksSynth.connect(ksSynth.context.destination);

    // Consolidated reactive updates
    van.derive(() => {
      // Enable/disable features
      keyboardEnabled.val
        ? ksSynth.enableKeyboard()
        : ksSynth.disableKeyboard();
      midiEnabled.val ? ksSynth.enableMIDI() : ksSynth.disableMIDI();

      // Update volume
      ksSynth.volume = volume.val;

      // Update synth parameters
      ksSynth.setParameterValue('attack', attack.val);
      ksSynth.setParameterValue('decay', decay.val);
      ksSynth.setParameterValue('noiseTime', noiseTime.val);

      // Update filters
      ksSynth.setLpfCutoff(lpfFreq.val);
      ksSynth.setHpfCutoff(hpfFreq.val);
    });

    return () => ksSynth?.dispose();
  });

  return div(
    { class: 'karplus-synth', style: 'padding: 20px; font-family: Arial;' },

    // Parameter controls using helper function
    createSliderControl('Volume', volume, 0, 1, 0.01),
    createSliderControl('Decay', decay, 0, 1, 0.01),
    createSliderControl('Attack', attack, 0, 1, 0.01),
    createSliderControl('Noise Hold', noiseTime, 1, 100, 1, '%', 1),
    createSliderControl('LPF Frequency', lpfFreq, 20, 20000, 1, ' Hz', 1),
    createSliderControl('HPF Frequency', hpfFreq, 20, 20000, 1, ' Hz', 1),

    // Control buttons
    div(
      { style: 'display: flex; gap: 10px;' },
      createCheckboxControl('Enable Keyboard', keyboardEnabled),
      createCheckboxControl('Enable MIDI', midiEnabled)
    )
  );
};

// Export a function that defines the custom element
export const defineKarplusSynth = (elementName = 'karplus-synth') => {
  define(elementName, KarplusElement, false);
};

// // Usage:
// // defineKarplusSynth('ks-name-test');
// // <karplus-synth></karplus-synth>

// /** Alternatively auto-register, just call define here and:
//  *  import './components/KarplusElement.js';
//  */
