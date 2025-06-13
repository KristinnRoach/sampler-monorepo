import van from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import {
  getInstance,
  Audiolib,
  AudiolibOptions,
  createKarplusStrongSynth,
  KarplusStrongSynth,
} from '@repo/audiolib';
import { createCheckbox, createSlider } from './utils/createInputEl';

const { div } = van.tags;

const KarplusSynthElement = (attributes: ElementProps) => {
  let ksSynth: KarplusStrongSynth;

  const expanded = attributes.attr('expanded', 'true');

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
    ksSynth = createKarplusStrongSynth(16);
    if (!ksSynth) {
      console.warn('Failed to create Karplus-Strong synthesizer');
      return;
    }

    // Todo: destination master handling
    // @ts-ignore
    ksSynth.connect(ksSynth.context.destination);
    // console.info(ksSynth);

    // Add getter for the synth instance
    Object.defineProperty(attributes.$this, 'synth', {
      get: () => ksSynth,
      configurable: true,
    });

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

    return () => {
      delete (attributes.$this as any).synth;
      ksSynth?.dispose();
    };
  });

  const defaultStyle = `display: flex; flex-direction: column; padding: 1rem`;
  const minimizedHeaderStyle = `display: flex; flex-direction: row; column-gap: 1rem;`;
  const expandedHeaderStyle = minimizedHeaderStyle; // The same for now, easy to up

  return div(
    { class: 'karplus-synth', style: () => defaultStyle },
    div(
      {
        class: 'header',
        style: () => (expanded.val === 'true' ? expandedHeaderStyle : ''),
        onclick: () =>
          (expanded.val = expanded.val === 'true' ? 'false' : 'true'),
      },
      () => (expanded.val === 'true' ? '▼ Karplus Synth' : '▶ Karplus Synth')
    ),
    div(
      {
        class: 'controls',
        style: () => (expanded.val === 'true' ? '' : 'display: none'),
      },
      createSlider('Volume', volume, 0, 1, 0.01),
      createSlider('Decay', decay, 0, 1, 0.01),
      createSlider('Attack', attack, 0, 1, 0.01),
      createSlider('Noise Hold', noiseTime, 1, 100, 1, '%', 1),
      createSlider('LPF Frequency', lpfFreq, 20, 20000, 1, ' Hz', 1),
      createSlider('HPF Frequency', hpfFreq, 20, 20000, 1, ' Hz', 1),
      div(
        { style: 'display: flex; gap: 10px;' },
        createCheckbox('Keyboard', keyboardEnabled),
        createCheckbox('MIDI', midiEnabled)
      )
    )
  );
};

export const defineKarplusSynth = (elementName: string = 'karplus-synth') => {
  define(elementName, KarplusSynthElement, false);
};
