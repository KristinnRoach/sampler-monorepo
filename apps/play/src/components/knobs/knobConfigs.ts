// src/components/knobs/knobConfigs.ts
import type { KnobPresetKey } from '@repo/audio-components/solidjs';
import type { SamplePlayer } from '@repo/audio-components';

export interface SamplerKnobConfig {
  preset: KnobPresetKey;
  label?: string;
  method: keyof SamplePlayer;
  size?: number;
  class?: string;
}

// Define all your knob configurations in one place
export const samplerKnobConfigs = {
  // Space group
  dryWet: {
    preset: 'dryWet' as KnobPresetKey,
    method: 'setDryWetMix' as keyof SamplePlayer,
  },
  reverbSend: {
    preset: 'reverbSend' as KnobPresetKey,
    label: 'RevSend',
    method: 'sendToFx' as keyof SamplePlayer, // Special case - needs 'reverb' parameter
  },
  reverbSize: {
    preset: 'reverbSize' as KnobPresetKey,
    label: 'RevSize',
    method: 'setReverbAmount' as keyof SamplePlayer,
  },

  // Filter group
  highpassFilter: {
    preset: 'highpassFilter' as KnobPresetKey,
    method: 'setHpfCutoff' as keyof SamplePlayer,
  },
  lowpassFilter: {
    preset: 'lowpassFilter' as KnobPresetKey,
    method: 'setLpfCutoff' as keyof SamplePlayer,
  },

  // Feedback group
  feedback: {
    preset: 'feedback' as KnobPresetKey,
    label: 'Amount',
    method: 'setFeedbackAmount' as keyof SamplePlayer,
  },
  feedbackPitch: {
    preset: 'feedbackPitch' as KnobPresetKey,
    label: 'Pitch',
    method: 'setFeedbackPitchScale' as keyof SamplePlayer,
  },
  feedbackDecay: {
    preset: 'feedbackDecay' as KnobPresetKey,
    label: 'Decay',
    method: 'setFeedbackDecay' as keyof SamplePlayer,
  },

  // LFO group
  gainLFORate: {
    preset: 'gainLFORate' as KnobPresetKey,
    label: 'Rate',
    method: 'gainLFO' as keyof SamplePlayer, // Special case - needs setFrequency
  },
  gainLFODepth: {
    preset: 'gainLFODepth' as KnobPresetKey,
    label: 'Depth',
    method: 'gainLFO' as keyof SamplePlayer, // Special case - needs setDepth
  },

  // Performance
  glide: {
    preset: 'glide' as KnobPresetKey,
    method: 'setGlideTime' as keyof SamplePlayer,
  },
} as const;

export type SamplerKnobConfigKey = keyof typeof samplerKnobConfigs;
