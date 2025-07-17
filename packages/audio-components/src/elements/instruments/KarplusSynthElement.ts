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
} from '../controls/AudioControls';

const { div } = van.tags;

const KarplusSynthElement = (attributes: ElementProps) => {
  let ksSynth: KarplusStrongSynth;

  // Attributes
  const expanded = attributes.attr('expanded', 'true');

  // Audio parameters
  const volume = van.state(0.5);
  const attack = van.state(0.001);
  const decay = van.state(0.9);
  const noiseTime = van.state(10);
  const lpfFreq = van.state(18000);
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
        derive(() => {
          ksSynth.setParameterValue('attack', attack.val);
          ksSynth.setParameterValue('decay', decay.val);
          ksSynth.setParameterValue('noiseTime', noiseTime.val);
        });
        derive(() => {
          ksSynth.setLpfCutoff(lpfFreq.val);
          ksSynth.setHpfCutoff(hpfFreq.val);
        });

        // Control states
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

        createSlider('Attack', attack, 0, 1, 0.01),
        createSlider('Decay', decay, 0, 1, 0.01),
        createSlider('Thickness', noiseTime, 1, 100, 1),

        FilterSliders(lpfFreq, hpfFreq),

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
