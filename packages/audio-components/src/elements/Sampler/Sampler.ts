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
import { RecordButton, LoadButton } from './components/SamplerButtonFactory';
import {
  KeymapSelect,
  WaveformSelect,
} from './components/SamplerSelectFactory';
import { AMModulation } from './components/AMModulation';

const { div } = van.tags;

// ===== SAMPLER ENGINE =====
export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;
  let initialized = false;

  const nodeId: State<string> = attributes.attr('node-id', '');
  const polyphony = attributes.attr('polyphony', '16');
  const debugMode = attributes.attr('debug-mode', '');
  const status = van.state('Initializing...');

  // Track audio initialization with promise to prevent race conditions
  let initializationPromise: Promise<void> | null = null;
  let userInteractionHandler: (() => void) | null = null;

  attributes.mount(() => {
    const initializeAudio = async () => {
      if (initializationPromise) {
        return initializationPromise; // Return existing promise if already initializing
      }

      initializationPromise = (async () => {
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
        } catch (error: any) {
          // Reset promise on error to allow retry
          initializationPromise = null;
          console.error('Sampler initialization error:', error);

          // Check if it's an AudioWorklet support issue
          if (error?.message?.includes('AudioWorklet')) {
            status.val = 'Browser not supported';

            // Show a user-friendly message
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
          throw error; // Re-throw to maintain error behavior
        }
      })();

      return initializationPromise;
    };

    // Feature detection for audio context policy
    const requiresUserInteraction = async () => {
      try {
        // Create a test AudioContext to check if it starts suspended
        const testContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const needsInteraction = testContext.state === 'suspended';
        await testContext.close();
        return needsInteraction;
      } catch {
        // If we can't create an AudioContext, we'll need user interaction
        return true;
      }
    };

    // Initialize audio based on browser policy
    requiresUserInteraction().then((needsInteraction) => {
      if (needsInteraction) {
        // Wait for user interaction before initializing audio
        status.val = 'Click to start audio';

        // Create localized handler that only affects this component
        userInteractionHandler = async () => {
          if (initializationPromise) return; // Already initializing or initialized
          status.val = 'Initializing...';
          await initializeAudio();

          // Clean up the handler reference
          userInteractionHandler = null;
        };

        // Add listener to the component itself, not the document
        const element = attributes.$this;
        if (element) {
          // Use capture phase to ensure we get the event first
          element.addEventListener('click', userInteractionHandler, {
            once: true,
            capture: true,
          });
          element.addEventListener('touchstart', userInteractionHandler, {
            once: true,
            capture: true,
          });
          element.addEventListener('keydown', userInteractionHandler, {
            once: true,
            capture: true,
          });

          // Also listen on parent to catch events on child elements
          if (element.parentElement) {
            element.parentElement.addEventListener(
              'click',
              userInteractionHandler,
              { once: true, capture: true }
            );
            element.parentElement.addEventListener(
              'touchstart',
              userInteractionHandler,
              { once: true, capture: true }
            );
          }
        }
      } else {
        // Initialize immediately if no user interaction is needed
        initializeAudio();
      }
    });

    return () => {
      // Clean up event listeners if they haven't been triggered
      if (userInteractionHandler) {
        const element = attributes.$this;
        if (element) {
          element.removeEventListener('click', userInteractionHandler);
          element.removeEventListener('touchstart', userInteractionHandler);
          element.removeEventListener('keydown', userInteractionHandler);
          if (element.parentElement) {
            element.parentElement.removeEventListener(
              'click',
              userInteractionHandler
            );
            element.parentElement.removeEventListener(
              'touchstart',
              userInteractionHandler
            );
          }
        }
      }

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
  LoadButton,

  // Select components
  KeymapSelect,
  WaveformSelect,

  // Composite components
  AMModulation,

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

  // Select controls
  defineIfNotExists('keymap-select', KeymapSelect, false);
  defineIfNotExists('waveform-select', WaveformSelect, false);

  // Composite controls
  defineIfNotExists('am-modulation', AMModulation, false);
};

defineSampler();
