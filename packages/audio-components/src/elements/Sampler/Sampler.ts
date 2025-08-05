// Sampler.ts
import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { SamplePlayer, createSamplePlayer } from '@repo/audiolib';
import { createFindNodeId } from '../../shared/utils/component-utils';

import {
  registerSampler,
  unregisterSampler,
  getSampler,
} from './SamplerRegistry';

import {
  COMPONENT_STYLE,
  BUTTON_STYLE,
} from '../../shared/styles/component-styles';

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
  ReverbKnob,
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
import { RecordButton } from './components/RecordButton';

const { div, button } = van.tags;

// ===== SAMPLER ENGINE =====
export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;
  let initialized = false;

  const nodeId: State<string> = attributes.attr('node-id', '');
  const polyphony = attributes.attr('polyphony', '16');
  const debugMode = attributes.attr('debug-mode', '');
  const status = van.state('Initializing...');

  attributes.mount(() => {
    const initializeAudio = async () => {
      try {
        samplePlayer = await createSamplePlayer(
          undefined,
          parseInt(polyphony.val)
        );

        // Use attribute id if passed in, otherwise use the audiolib's nodeId
        if (!nodeId.val) {
          nodeId.val = samplePlayer.nodeId;
        }

        // ===== EVENT LISTENERS =====

        samplePlayer.onMessage('sample-player:ready', () => {
          if (!samplePlayer) throw new Error('SamplerEl: no samplerPlayer!');
          registerSampler(nodeId.val, samplePlayer);
          initialized = true;
          status.val = 'Ready';
          document.dispatchEvent(
            new CustomEvent('sampler-ready', {
              detail: { nodeId: nodeId.val },
            })
          );
        });

        samplePlayer.onMessage('sample:loaded', (msg: any) => {
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
      } catch (error) {
        console.error('Sampler initialization error:', error);
        status.val = `Error: ${error}`;
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

  // Only render debug information if debug-mode attribute is present
  if (debugMode.val) {
    return div(
      {
        'node-id': () => nodeId.val,
        style: COMPONENT_STYLE,
      },
      div(() => `Sampler: ${nodeId.val}`),
      div(() => status.val)
    );
  }

  // Return invisible element that still maintains the nodeId attribute
  return div({
    'node-id': () => nodeId.val,
    style: 'display: none;',
  });
};

export const LoadButton = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const status = van.state('Ready');

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const loadSample = async () => {
    const nodeId = findNodeId();
    if (!nodeId) {
      status.val = 'Sampler not found';
      return;
    }
    const sampler = getSampler(nodeId);
    if (!sampler) {
      status.val = 'Sampler not found';
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';

    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (files && files.length > 0) {
        const file = files[0];
        status.val = `Loading: ${file.name}...`;

        try {
          const arrayBuffer = await file.arrayBuffer();
          await sampler.loadSample(arrayBuffer);
          status.val = `Loaded: ${file.name}`;
        } catch (error) {
          status.val = `Error: ${error}`;
        }
      }
    };

    fileInput.click();
  };

  return div(
    { style: COMPONENT_STYLE },
    button({ onclick: loadSample, style: BUTTON_STYLE }, 'Load Sample'),
    div(() => status.val)
  );
};

// ===== EXPORT ALL COMPONENTS =====
export {
  // New knob components
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
  ReverbKnob,
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
  defineIfNotExists('reverb-knob', ReverbKnob, false);
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
};

defineSampler();
