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
  TrimStartKnob,
  TrimEndKnob,
  DistortionKnob,
  FeedbackLpfKnob,
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
  PitchToggle,
} from './components/SamplerToggleFactory';

import { EnvelopeDisplay } from './components/EnvelopeDisplay';
import { EnvelopeSwitcher } from './components/EnvelopeSwitcher';
import { ComputerKeyboard } from './components/ComputerKeyboard';
import { PianoKeyboard } from './components/PianoKeyboard';
import { RecordButton, UploadButton } from './components/SamplerButtonFactory';
import {
  KeymapSelect,
  WaveformSelect,
  InputSourceSelect,
} from './components/SamplerSelectFactory';
import { AMModulation } from './components/AMModulation';
import { SamplerStatusElement } from './components/SamplerStatusElement';

const { div } = van.tags;

// Utility: Encode AudioBuffer as WAV (PCM 16-bit LE)
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;
  const wavBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(wavBuffer);

  // RIFF header
  let offset = 0;
  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  }
  writeString('RIFF');
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true);
  offset += 4; // PCM chunk size
  view.setUint16(offset, 1, true);
  offset += 2; // PCM format
  view.setUint16(offset, numChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, byteRate, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2; // bits per sample
  writeString('data');
  view.setUint32(offset, dataSize, true);
  offset += 4;

  // Write PCM samples
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = buffer.getChannelData(ch)[i];
      // Clamp and convert to 16-bit PCM
      sample = Math.max(-1, Math.min(1, sample));

      const pcmSample = Math.round(sample * 32767);
      view.setInt16(offset, pcmSample, true);
      offset += 2;
    }
  }

  return wavBuffer;
}

function isWav(arrayBuffer: ArrayBuffer) {
  // Check for WAV header: 'RIFF' at 0, 'WAVE' at 8
  const header = new Uint8Array(arrayBuffer);
  const isWav =
    header[0] === 0x52 && // 'R'
    header[1] === 0x49 && // 'I'
    header[2] === 0x46 && // 'F'
    header[3] === 0x46 && // 'F'
    header[8] === 0x57 && // 'W'
    header[9] === 0x41 && // 'A'
    header[10] === 0x56 && // 'V'
    header[11] === 0x45; // 'E'

  return isWav;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary); // encode as base64
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary: string = atob(base64);
  const len: number = binary.length;
  const buffer: ArrayBuffer = new ArrayBuffer(len);
  const bytes: Uint8Array = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export interface SamplerElement extends HTMLElement {
  nodeId: string;
  getSamplePlayer: () => SamplePlayer | null;
}

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
        let initSample = undefined;
        const storedBuffer = localStorage.getItem('currentSample');

        if (storedBuffer?.length) {
          const arrayBuffer = base64ToArrayBuffer(storedBuffer);

          if (isWav(arrayBuffer)) {
            initSample = arrayBuffer;
          }
        }

        samplePlayer = await createSamplePlayer(
          initSample,
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
          const audiobuffer = samplePlayer?.audiobuffer;

          document.dispatchEvent(
            new CustomEvent('sample-loaded', {
              detail: {
                nodeId: nodeId.val,
                buffer: audiobuffer,
                durationSeconds: msg.durationSeconds,
              },
            })
          );
          if (audiobuffer?.length) {
            // Store as WAV for compatibility with decodeAudioData
            const wavBuffer = audioBufferToWav(audiobuffer);
            const base64buffer = arrayBufferToBase64(wavBuffer);
            localStorage.setItem('currentSample', base64buffer);
          }
        });

        Object.assign(attributes.$this, {
          nodeId: nodeId.val,
          getSamplePlayer: () => samplePlayer,
        });
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
          const errText =
            typeof error?.message === 'string' ? error.message : String(error);
          status.val = `Error: ${errText}`;
          document.dispatchEvent(
            new CustomEvent('sampler-error', {
              detail: {
                nodeId: nodeId.val,
                error: errText,
              },
            })
          );
        }
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
  TrimStartKnob,
  TrimEndKnob,
  DistortionKnob,
  FeedbackLpfKnob,

  // Toggle components
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
  GainLFOSyncNoteToggle,
  PitchLFOSyncNoteToggle,
  PlaybackDirectionToggle,
  PanDriftToggle,
  PitchToggle,

  // Control components
  ComputerKeyboard,
  PianoKeyboard,
  RecordButton,
  UploadButton,

  // Select components
  KeymapSelect,
  WaveformSelect,
  InputSourceSelect,

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
  defineIfNotExists('load-button', UploadButton, false);
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
  defineIfNotExists('feedback-lpf-knob', FeedbackLpfKnob, false);
  defineIfNotExists('gain-lfo-rate-knob', GainLFORateKnob, false);
  defineIfNotExists('gain-lfo-depth-knob', GainLFODepthKnob, false);
  defineIfNotExists('pitch-lfo-rate-knob', PitchLFORateKnob, false);
  defineIfNotExists('pitch-lfo-depth-knob', PitchLFODepthKnob, false);
  defineIfNotExists('am-mod-knob', AMModKnob, false);
  defineIfNotExists('loop-start-knob', LoopStartKnob, false);
  defineIfNotExists('loop-duration-knob', LoopDurationKnob, false);
  defineIfNotExists('loop-duration-drift-knob', LoopDurationDriftKnob, false);
  defineIfNotExists('trim-start-knob', TrimStartKnob, false);
  defineIfNotExists('trim-end-knob', TrimEndKnob, false);
  defineIfNotExists('distortion-knob', DistortionKnob, false);

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
  defineIfNotExists('pitch-toggle', PitchToggle, false);

  // Envelopes
  defineIfNotExists('envelope-display', EnvelopeDisplay, false);
  defineIfNotExists('envelope-switcher', EnvelopeSwitcher, false);

  // Input controls
  defineIfNotExists('computer-keyboard', ComputerKeyboard, false);
  defineIfNotExists('piano-keyboard', PianoKeyboard, false);

  // Select controls
  defineIfNotExists('keymap-select', KeymapSelect, false);
  defineIfNotExists('waveform-select', WaveformSelect, false);
  defineIfNotExists('input-select', InputSourceSelect, false);

  // Composite controls
  defineIfNotExists('am-modulation', AMModulation, false);

  // Status display
  defineIfNotExists('sampler-status', SamplerStatusElement, false);
};

defineSampler();
