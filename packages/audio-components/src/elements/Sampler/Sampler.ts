// Sampler.ts
import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { SamplePlayer, createSamplePlayer } from '@repo/audiolib';

import { registerSampler, unregisterSampler } from './SamplerRegistry';

import { COMPONENT_STYLE } from '../../shared/styles/component-styles';

import {
  DryWetKnob,
  FeedbackKnob,
  DriveKnob,
  ClippingKnob,
  GlideKnob,
  FeedbackPitchKnob,
  FeedbackDecayKnob,
  GainLFORateKnob,
  GainLFODepthKnob,
  PitchLFORateKnob,
  PitchLFODepthKnob,
  VolumeKnob,
  ReverbSendKnob,
  ReverbSizeKnob,
  LowpassFilterKnob,
  HighpassFilterKnob,
  LoopStartKnob,
  LoopDurationKnob,
  LoopDurationDriftKnob,
  AMModKnob,
} from './components/SamplerKnobFactory';

import {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  GainLFOSyncNoteToggle,
  PitchLFOSyncNoteToggle,
  PlaybackDirectionToggle,
  PanDriftToggle,
} from './components/SamplerToggleFactory';

import { EnvelopeDisplay } from './components/EnvelopeDisplay';
import { EnvelopeSwitcher } from './components/EnvelopeSwitcher';
import { ComputerKeyboard } from './components/ComputerKeyboard';
import { PianoKeyboard } from './components/PianoKeyboard';
import { RecordButton, LoadButton } from './components/SamplerButtonFactory';
import {
  KeymapSelect,
  WaveformSelect,
} from './components/SamplerSelectFactory';
import { AMModulation } from './components/AMModulation';
import { SamplerStatusElement } from './components/SamplerStatusElement';

const { div } = van.tags;

// ===== SAMPLER ENGINE =====
export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;

  const nodeId: State<string> = attributes.attr('node-id', '');
  const polyphony = attributes.attr('polyphony', '16');
  const debugMode = attributes.attr('debug-mode', 'false');
  const status = van.state('Click to start');

  attributes.mount(() => {
    const initializeAudio = async () => {
      try {
        samplePlayer = await createSamplePlayer(
          undefined,
          parseInt(polyphony.val)
        );

        if (!nodeId.val) {
          nodeId.val = samplePlayer.nodeId;
        }

        registerSampler(nodeId.val, samplePlayer);
        status.val = 'Initialized';

        document.dispatchEvent(
          new CustomEvent('sampler-initialized', {
            detail: { nodeId: nodeId.val },
          })
        );

        samplePlayer.onMessage('sample:loaded', (msg: any) => {
          status.val = 'Loaded';
          document.dispatchEvent(
            new CustomEvent('sample-loaded', {
              detail: {
                nodeId: nodeId.val,
                buffer: samplePlayer?.audiobuffer,
                durationSeconds: msg.durationSeconds,
              },
            })
          );
        });

        Object.assign(attributes.$this, { nodeId: nodeId.val });
      } catch (error: any) {
        console.error('Sampler initialization error:', error);
        if (error?.message?.includes('AudioWorklet')) {
          status.val = 'Browser not supported';
          document.dispatchEvent(
            new CustomEvent('sampler-error', {
              detail: {
                nodeId: nodeId.val,
                error: 'AudioWorklet not supported',
                message:
                  'This browser does not fully support Web Audio. Please use Chrome, Firefox, or Edge on desktop, or update your mobile browser.',
              },
            })
          );
        } else {
          status.val = `Error: ${error}`;
        }
        throw error;
      }
    };

    initializeAudio();

    return () => {
      if (samplePlayer && nodeId.val) {
        unregisterSampler(nodeId.val);
        samplePlayer.dispose();
      }
    };
  });

  // Render debug information, only if debug-mode attribute is present
  if (debugMode.val === 'true' || debugMode.val === '') {
    return div(
      {
        'node-id': () => nodeId.val,
        style: `${COMPONENT_STYLE}`,
      },
      div(() => `Sampler: ${nodeId.val}`),
      div(() => `Status: ${status.val}`)
    );
  }

  // Return invisible element
  return div({
    'node-id': () => nodeId.val,
    style: 'display: none;',
  });
};

// ===== EXPORT ALL COMPONENTS =====
export {
  // Knob components
  DryWetKnob,
  FeedbackKnob,
  DriveKnob,
  ClippingKnob,
  GlideKnob,
  FeedbackPitchKnob,
  FeedbackDecayKnob,
  GainLFORateKnob,
  GainLFODepthKnob,
  PitchLFORateKnob,
  PitchLFODepthKnob,
  VolumeKnob,
  ReverbSendKnob,
  ReverbSizeKnob,
  LowpassFilterKnob,
  HighpassFilterKnob,
  LoopStartKnob,
  LoopDurationKnob,
  LoopDurationDriftKnob,
  AMModKnob,

  // Toggle components
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  GainLFOSyncNoteToggle,
  PitchLFOSyncNoteToggle,
  PlaybackDirectionToggle,
  PanDriftToggle,

  // Control components
  ComputerKeyboard,
  PianoKeyboard,
  RecordButton,
  LoadButton,

  // Select components
  KeymapSelect,
  WaveformSelect,

  // Composite components
  AMModulation,

  // Status display
  SamplerStatusElement,

  // Envelopes
  EnvelopeDisplay,
};

// ===== REGISTRATION =====
const defineIfNotExists = (name: string, elementFunc: any, options: any) => {
  if (!customElements.get(name)) {
    define(name, elementFunc, options);
  }
};

export const defineSampler = () => {
  // Core sampler
  defineIfNotExists('sampler-element', SamplerElement, false);

  // Basic controls
  defineIfNotExists('load-button', LoadButton, false);
  defineIfNotExists('record-button', RecordButton, false);

  // Knob controls
  defineIfNotExists('volume-knob', VolumeKnob, false);
  defineIfNotExists('reverb-send-knob', ReverbSendKnob, false);
  defineIfNotExists('reverb-size-knob', ReverbSizeKnob, false);
  defineIfNotExists('lowpass-filter-knob', LowpassFilterKnob, false);
  defineIfNotExists('highpass-filter-knob', HighpassFilterKnob, false);
  defineIfNotExists('dry-wet-knob', DryWetKnob, false);
  defineIfNotExists('feedback-knob', FeedbackKnob, false);
  defineIfNotExists('drive-knob', DriveKnob, false);
  defineIfNotExists('clipping-knob', ClippingKnob, false);
  defineIfNotExists('glide-knob', GlideKnob, false);
  defineIfNotExists('feedback-pitch-knob', FeedbackPitchKnob, false);
  defineIfNotExists('feedback-decay-knob', FeedbackDecayKnob, false);
  defineIfNotExists('gain-lfo-rate-knob', GainLFORateKnob, false);
  defineIfNotExists('gain-lfo-depth-knob', GainLFODepthKnob, false);
  defineIfNotExists('pitch-lfo-rate-knob', PitchLFORateKnob, false);
  defineIfNotExists('pitch-lfo-depth-knob', PitchLFODepthKnob, false);
  defineIfNotExists('am-mod-knob', AMModKnob, false);
  defineIfNotExists('loop-start-knob', LoopStartKnob, false);
  defineIfNotExists('loop-duration-knob', LoopDurationKnob, false);
  defineIfNotExists('loop-duration-drift-knob', LoopDurationDriftKnob, false);

  // Toggle controls
  defineIfNotExists('feedback-mode-toggle', FeedbackModeToggle, false);
  defineIfNotExists('midi-toggle', MidiToggle, false);
  defineIfNotExists('loop-lock-toggle', LoopLockToggle, false);
  defineIfNotExists('hold-lock-toggle', HoldLockToggle, false);
  defineIfNotExists('gain-lfo-sync-toggle', GainLFOSyncNoteToggle, false);
  defineIfNotExists('pitch-lfo-sync-toggle', PitchLFOSyncNoteToggle, false);
  defineIfNotExists(
    'playback-direction-toggle',
    PlaybackDirectionToggle,
    false
  );
  defineIfNotExists('pan-drift-toggle', PanDriftToggle, false);

  // Envelopes
  defineIfNotExists('envelope-display', EnvelopeDisplay, false);
  defineIfNotExists('envelope-switcher', EnvelopeSwitcher, false);

  // Input controls
  defineIfNotExists('computer-keyboard', ComputerKeyboard, false);
  defineIfNotExists('piano-keyboard', PianoKeyboard, false);

  // Select controls
  defineIfNotExists('keymap-select', KeymapSelect, false);
  defineIfNotExists('waveform-select', WaveformSelect, false);

  // Composite controls
  defineIfNotExists('am-modulation', AMModulation, false);

  // Status display
  defineIfNotExists('sampler-status', SamplerStatusElement, false);
};

defineSampler();
