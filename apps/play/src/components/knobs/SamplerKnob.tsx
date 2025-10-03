// src/components/knobs/SamplerKnob.tsx
import { Component } from 'solid-js';
import {
  KnobComponent,
  type KnobChangeEventDetail,
} from '@repo/audio-components/solidjs';
import type { SamplePlayer } from '@repo/audio-components';
import { samplerKnobConfigs, type SamplerKnobConfigKey } from './knobConfigs';

interface SamplerKnobProps {
  type: SamplerKnobConfigKey;
  samplePlayer: SamplePlayer | null;
  size?: number;
  customLabel?: string;
  class?: string;
}

/**
 * A knob component that uses predefined configurations
 */
export const SamplerKnob: Component<SamplerKnobProps> = (props) => {
  const config = samplerKnobConfigs[props.type];

  const handleChange = (detail: KnobChangeEventDetail) => {
    if (!props.samplePlayer) return;

    const value = detail.value;

    // Handle special cases
    switch (props.type) {
      case 'reverbSend':
        if (typeof props.samplePlayer.sendToFx === 'function') {
          props.samplePlayer.sendToFx('reverb', value);
        }
        break;

      case 'gainLFORate':
        if (
          props.samplePlayer.gainLFO &&
          typeof props.samplePlayer.gainLFO.setFrequency === 'function'
        ) {
          const freqHz = value * 100 + 0.1;
          props.samplePlayer.gainLFO.setFrequency(freqHz);
        }
        break;

      case 'gainLFODepth':
        if (
          props.samplePlayer.gainLFO &&
          typeof props.samplePlayer.gainLFO.setDepth === 'function'
        ) {
          props.samplePlayer.gainLFO.setDepth(value);
        }
        break;

      case 'dryWet':
        if (typeof props.samplePlayer.setDryWetMix === 'function') {
          props.samplePlayer.setDryWetMix({ dry: 1 - value, wet: value });
        }
        break;

      default:
        // Standard method call
        const method = props.samplePlayer[config.method as keyof SamplePlayer];
        if (typeof method === 'function') {
          (method as Function).call(props.samplePlayer, value);
        }
        break;
    }
  };

  return (
    <KnobComponent
      preset={config.preset}
      size={props.size || 50}
      label={
        props.customLabel ||
        ('label' in config ? (config.label as string) : undefined)
      }
      class={props.class}
      onChange={handleChange}
    />
  );
};
