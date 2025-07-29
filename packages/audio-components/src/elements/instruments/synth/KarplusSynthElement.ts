import van from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';

import {
  createKarplusStrongSynth,
  type KarplusStrongSynth,
} from '@repo/audiolib';

import { createIcons } from '../../utils/icons';
import { createSlider } from '../primitives/createInputEl';
import { ExpandableHeader } from '../primitives/ExpandableHeader';

import {
  VolumeSlider,
  AREnvSliders,
  InputControls,
  LoopHoldControls,
  FilterSliders,
} from '../controls/checboxes';
import { createLabeledKnob } from '../primitives/createKnob';

const { div } = van.tags;

const KarplusSynthElement = (attributes: ElementProps) => {
  let ksSynth: KarplusStrongSynth;

  // Attributes
  const expanded = attributes.attr('expanded', 'true');

  // Audio parameters
  const volume = van.state(0.5); // 0-1
  const noiseGain = van.state(0); // constant source of input noise
  const decayAmount = van.state(0.7); // normalized feedback gain amount (0-1)

  const attackSec = van.state(0.001); // in seconds
  const noiseSec = van.state(0.01); // in seconds

  const lpfFreq = van.state(10000); // Hz
  const hpfFreq = van.state(20);

  // const envelopeController = createCustomEnvelope();

  // Control states
  const keyboardEnabled = van.state(true);
  const midiEnabled = van.state(false);

  // Status
  const status = van.state('Not initialized');

  // Helper to avoid repetitive null checks (replacing "if (!ksSynth) return")
  const derive = (fn: () => void) => van.derive(() => ksSynth && fn());

  attributes.mount(() => {
    const initializeAudio = () => {
      try {
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
        // Reactive parameter binding
        derive(() => (ksSynth.volume = volume.val));
        derive(() => ksSynth.setParameterValue('noiseGain', noiseGain.val));
        derive(() => ksSynth.setParameterValue('attack', attackSec.val));
        derive(() => ksSynth.setParameterValue('decay', decayAmount.val));
        derive(() => ksSynth.setParameterValue('noiseTime', noiseSec.val));
        derive(() => ksSynth.setLpfCutoff(lpfFreq.val));
        derive(() => ksSynth.setHpfCutoff(hpfFreq.val));

        derive(() =>
          keyboardEnabled.val
            ? ksSynth.enableKeyboard()
            : ksSynth.disableKeyboard()
        );
        derive(() =>
          midiEnabled.val ? ksSynth.enableMIDI() : ksSynth.disableMIDI()
        );

        status.val = 'Ready';
      } catch (error) {
        console.error('Failed to initialize Karplus-Strong synth:', error);
        status.val = `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    };

    initializeAudio();

    return () => {
      delete (attributes.$this as any).synth;
      ksSynth?.dispose();
    };
  });

  const icons = createIcons();

  const defaultStyle = `display: flex; flex-direction: column; max-width: 50vw; padding: 0.5rem;`;

  return div(
    { class: 'karplus-synth', style: () => defaultStyle },

    ExpandableHeader('Karplus Synth', expanded),

    div(
      {
        class: 'controls',
        style: () => (expanded.val === 'true' ? '' : 'display: none'),
      },

      div(
        {
          class: 'controls',
          style: () => (expanded.val === 'true' ? '' : 'display: none'),
        },
        VolumeSlider(volume),

        createSlider('Attack', attackSec, 0.001, 2, 0.001), // in seconds
        createSlider('Thickness', noiseSec, 0.001, 0.5, 0.001), // seconds

        div(
          {
            class: 'knobs',
            style: () =>
              expanded.val === 'true'
                ? `
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                  gap: 1rem;
                  padding: 1rem;
                  max-width: 100%;
                  justify-items: center;
                  align-items: start;
                `
                : 'display: none; padding: 0.5rem;',
          },
          createLabeledKnob({
            label: 'Decay',
            defaultValue: 0.7,
            minValue: 0.01,
            maxValue: 1,
            curve: 2,
            onChange: (value: number) => (decayAmount.val = value),
          }),
          createLabeledKnob({
            label: 'Input Noise',
            defaultValue: 0,
            minValue: 0,
            maxValue: 1,
            curve: 1,
            onChange: (value: number) => (decayAmount.val = value),
          })
        ),

        FilterSliders(lpfFreq, hpfFreq), // Hz

        div(
          { style: 'display: flex; gap: 10px; flex-wrap: wrap;' },
          InputControls(keyboardEnabled, midiEnabled, icons.keys, icons.midi)
          // LoopHoldControls(loopEnabled, loopLocked, holdLocked, icons)
        ),

        div(
          { style: 'font-size: 0.8rem; color: #666; margin-top: 0.5rem;' },
          () => `Status: ${status.val}`
        )
      )
    )
  );
};

export const defineKarplusSynth = (elementName: string = 'karplus-synth') => {
  define(elementName, KarplusSynthElement, false);
};
