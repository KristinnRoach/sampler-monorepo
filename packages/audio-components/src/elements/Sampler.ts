// Sampler.ts
import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { SamplePlayer, createSamplePlayer } from '@repo/audiolib';
import { createLabeledKnob } from './primitives/createKnob';
import {
  registerSampler,
  unregisterSampler,
  getSampler,
} from '../SamplerRegistry';
import { createFindNodeId } from './ComponentUtils';
import { COMPONENT_STYLE, BUTTON_STYLE } from './ComponentStyles';

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
} from './MissingKnobs';

import {
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,
} from './ToggleComponents';

import { ComputerKeyboard } from './ComputerKeyboard';
import { PianoKeyboard } from './PianoKeyboard';
import { RecordButton } from './RecordButton';

const { div, button } = van.tags;

// ===== SAMPLER ENGINE =====
export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;
  let initialized = false;

  const nodeId: State<string> = attributes.attr('node-id', 'no-id');
  const polyphony = attributes.attr('polyphony', '16');
  const status = van.state('Initializing...');

  attributes.mount(() => {
    const initializeAudio = async () => {
      try {
        samplePlayer = await createSamplePlayer(
          undefined,
          parseInt(polyphony.val)
        );

        // Use attribute id if passed in, otherwise use the audiolib's nodeId
        if (nodeId.val === 'no-id') {
          nodeId.val = samplePlayer.nodeId;
        }

        samplePlayer.onMessage('sample-player:ready', () => {
          if (!samplePlayer) throw new Error('WTF');
          registerSampler(nodeId.val, samplePlayer);
          initialized = true;
          status.val = 'Ready';
          document.dispatchEvent(
            new CustomEvent('sampler-ready', {
              detail: { nodeId: nodeId.val },
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

  return div(
    {
      'data-node-id': () => nodeId.val,
      style: COMPONENT_STYLE,
    },
    div(() => `Sampler: ${nodeId.val}`),
    div(() => status.val)
  );
};

// ===== EXISTING CONTROL COMPONENTS (unchanged) =====
export const VolumeKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(0.75);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connectToSampler = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => {
        if (sampler) sampler.volume = value.val;
      });
    }
  };

  attributes.mount(() => {
    connectToSampler();
    const handleReady = (e: CustomEvent) => {
      if (e.detail.nodeId === findNodeId()) {
        connectToSampler();
      }
    };
    document.addEventListener('sampler-ready', handleReady as EventListener);
    return () =>
      document.removeEventListener(
        'sampler-ready',
        handleReady as EventListener
      );
  });

  return createLabeledKnob({
    label: 'Volume',
    defaultValue: 0.75,
    onChange: (v: number) => (value.val = v),
  });
};

export const ReverbKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(0.0);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.setReverbAmount(value.val));
    }
  };

  attributes.mount(() => {
    connect();
    const handleReady = (e: CustomEvent) => {
      if (e.detail.nodeId === findNodeId()) connect();
    };
    document.addEventListener('sampler-ready', handleReady as EventListener);
    return () =>
      document.removeEventListener(
        'sampler-ready',
        handleReady as EventListener
      );
  });

  return createLabeledKnob({
    label: 'Reverb',
    defaultValue: 0.0,
    onChange: (v: number) => (value.val = v),
  });
};

export const FilterKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const filterType: State<string> = attributes.attr('filter-type', 'lpf');
  const value = van.state(filterType.val === 'lpf' ? 18000 : 40);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => {
        if (filterType.val === 'lpf') {
          sampler.setLpfCutoff(value.val);
        } else {
          sampler.setHpfCutoff(value.val);
        }
      });
    }
  };

  attributes.mount(() => {
    connect();
    const handleReady = (e: CustomEvent) => {
      if (e.detail.nodeId === findNodeId()) connect();
    };
    document.addEventListener('sampler-ready', handleReady as EventListener);
    return () =>
      document.removeEventListener(
        'sampler-ready',
        handleReady as EventListener
      );
  });

  const isLpf = filterType.val === 'lpf';
  return createLabeledKnob({
    label: isLpf ? 'LPF' : 'HPF',
    defaultValue: isLpf ? 18000 : 40,
    minValue: 20,
    maxValue: 20000,
    curve: 5,
    onChange: (v: number) => (value.val = v),
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

  // Toggle components
  FeedbackModeToggle,
  MidiToggle,
  LoopLockToggle,
  HoldLockToggle,

  // Control components
  ComputerKeyboard,
  PianoKeyboard,
  RecordButton,
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
  defineIfNotExists('filter-knob', FilterKnob, false);
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

  // Toggle controls
  defineIfNotExists('feedback-mode-toggle', FeedbackModeToggle, false);
  defineIfNotExists('midi-toggle', MidiToggle, false);
  defineIfNotExists('loop-lock-toggle', LoopLockToggle, false);
  defineIfNotExists('hold-lock-toggle', HoldLockToggle, false);

  // Input controls
  defineIfNotExists('computer-keyboard', ComputerKeyboard, false);
  defineIfNotExists('piano-keyboard', PianoKeyboard, false);
};

defineSampler();
