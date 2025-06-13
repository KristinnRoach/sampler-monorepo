import van from '@repo/vanjs-core';
import { createKarplusStrongSynth } from '@repo/audio-components';

const { div, span, input, label } = van.tags;

export let ksSynth;

export const KarplusSynthComponent = () => {
  ksSynth = createKarplusStrongSynth(32);

  // Van.js reactive states
  const keyboardEnabled = van.state(false);
  const midiEnabled = van.state(false);

  const volume = van.state(0.5);
  const attack = van.state(0.001);
  const decay = van.state(0.9);
  const noiseTime = van.state(50);

  ksSynth.connect(ksSynth.context.destination); // for now

  // Update when state changes
  van.derive(() => {
    if (keyboardEnabled.val) {
      ksSynth.enableKeyboard();
    } else {
      ksSynth.disableKeyboard();
    }
  });

  van.derive(() => {
    if (midiEnabled.val) {
      ksSynth.enableMIDI();
    } else {
      ksSynth.disableMIDI();
    }
  });

  van.derive(() => {
    ksSynth.volume = volume.val;
  });

  van.derive(() => {
    ksSynth.setParameterValue('attack', attack.val);
  });

  van.derive(() => {
    ksSynth.setParameterValue('decay', decay.val);
  });

  van.derive(() => {
    ksSynth.setParameterValue('noiseTime', noiseTime.val);
  });

  return div(
    { class: 'karplus-synth', style: 'padding: 20px; font-family: Arial;' },

    // Volume control
    div(
      { style: 'margin-bottom: 20px;' },
      label('Volume: '),
      input({
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: () => volume.val,
        oninput: (e) => (volume.val = parseFloat(e.target.value)),
        style: 'margin-left: 10px;',
      }),
      span(
        { style: 'margin-left: 10px;' },
        () => Math.round(volume.val * 100) + '%'
      )
    ),

    // Decay control
    div(
      { style: 'margin-bottom: 20px;' },
      label('Decay: '),
      input({
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: () => decay.val,
        oninput: (e) => (decay.val = parseFloat(e.target.value)),
        style: 'margin-left: 10px;',
      }),
      span(
        { style: 'margin-left: 10px;' },
        () => Math.round(decay.val * 100) + '%'
      )
    ),

    // Attack control
    div(
      { style: 'margin-bottom: 20px;' },
      label('Attack: '),
      input({
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: () => attack.val,
        oninput: (e) => (attack.val = parseFloat(e.target.value)),
        style: 'margin-left: 10px;',
      }),
      span(
        { style: 'margin-left: 10px;' },
        () => Math.round(attack.val * 100) + '%'
      )
    ),

    // Noise hold time control
    div(
      { style: 'margin-bottom: 20px;' },
      label('Noise Hold: '),
      input({
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
        value: () => noiseTime.val,
        oninput: (e) => (noiseTime.val = parseFloat(e.target.value)),
        style: 'margin-left: 10px;',
      }),
      span(
        { style: 'margin-left: 10px;' },
        () => Math.round(noiseTime.val * 100) + '%'
      )
    ),

    // Control buttons
    div(
      { style: 'display: flex; gap: 10px;' },

      label(
        {
          style:
            'display: flex; align-items: center; gap: 8px; cursor: pointer;',
        },
        input({
          type: 'checkbox',
          checked: () => keyboardEnabled.val,
          onchange: (e) => (keyboardEnabled.val = e.target.checked),
        }),
        'Keyboard'
      ),
      label(
        {
          style:
            'display: flex; align-items: center; gap: 8px; cursor: pointer;',
        },
        input({
          type: 'checkbox',
          checked: () => midiEnabled.val,
          onchange: (e) => (midiEnabled.val = e.target.checked),
        }),
        'MIDI'
      )
    )
  );
};

// Usage example:
// van.add(document.body, KarplusSynthComponent());
