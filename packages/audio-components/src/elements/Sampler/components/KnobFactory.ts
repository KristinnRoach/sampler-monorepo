// KnobFactory.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../../../SamplerRegistry';
import { createLabeledKnob } from '../../primitives/createKnob';
import { createFindNodeId } from '@/shared/utils/component-utils';

// ===== DRY/WET MIX KNOB =====
export const DryWetKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(0.0); // 0 = fully dry, 1 = fully wet
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
        sampler.setDryWetMix({ dry: 1 - value.val, wet: value.val });
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

  return createLabeledKnob({
    label: 'Dry/Wet',
    defaultValue: 0.0,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== FEEDBACK KNOB =====
export const FeedbackKnob = (attributes: ElementProps) => {
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
      van.derive(() => sampler.setFeedbackAmount(value.val));
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
    label: 'Feedback',
    defaultValue: 0.0,
    minValue: 0,
    maxValue: 1,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== DRIVE KNOB =====
export const DriveKnob = (attributes: ElementProps) => {
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
      van.derive(() => sampler.outputBus?.setDrive(value.val));
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
    label: 'Drive',
    defaultValue: 0.0,
    minValue: 0,
    maxValue: 1,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== CLIPPING KNOB =====
export const ClippingKnob = (attributes: ElementProps) => {
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
      van.derive(() => sampler.outputBus?.setClippingMacro(value.val));
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
    label: 'Clipping',
    defaultValue: 0.0,
    minValue: 0,
    maxValue: 1,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== GLIDE KNOB =====
export const GlideKnob = (attributes: ElementProps) => {
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
      van.derive(() => sampler.setGlideTime(value.val));
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
    label: 'Glide',
    defaultValue: 0.0,
    minValue: 0,
    maxValue: 1,
    snapIncrement: 0.0001,
    curve: 2.75,
    valueFormatter: (v: number) => v.toFixed(3),
    onChange: (v: number) => (value.val = v),
  });
};

// ===== FEEDBACK PITCH KNOB =====
export const FeedbackPitchKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(1.0);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.setFeedbackPitchScale(value.val));
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
    label: 'FB-Pitch',
    defaultValue: 1.0,
    minValue: 0.25,
    maxValue: 4,
    allowedValues: [0.25, 0.5, 1.0, 2.0, 3.0, 4.0],
    curve: 2,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== FEEDBACK DECAY KNOB =====
export const FeedbackDecayKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(1.0);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.setFeedbackDecay(value.val));
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
    label: 'FB-Decay',
    defaultValue: 1.0,
    minValue: 0.001,
    maxValue: 1,
    curve: 1,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== LFO KNOBS =====
export const GainLFORateKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(0.1);
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
        const freqHz = value.val * 100 + 0.1; // Scale 0-1 to 0.1-100 Hz
        sampler.gainLFO?.setFrequency(freqHz);
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

  return createLabeledKnob({
    label: 'Amp LFO Rate',
    defaultValue: 0.1,
    curve: 5,
    snapIncrement: 0,
    onChange: (v: number) => (value.val = v),
  });
};

export const GainLFODepthKnob = (attributes: ElementProps) => {
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
      van.derive(() => sampler.gainLFO?.setDepth(value.val));
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
    label: 'Amp LFO Depth',
    defaultValue: 0.0,
    curve: 1.5,
    onChange: (v: number) => (value.val = v),
  });
};

export const PitchLFORateKnob = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const value = van.state(0.01);
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
        const freqHz = value.val * 100 + 0.1; // Scale 0-1 to 0.1-100 Hz
        sampler.pitchLFO?.setFrequency(freqHz);
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

  return createLabeledKnob({
    label: 'Pitch LFO Rate',
    defaultValue: 0.01,
    curve: 5,
    snapIncrement: 0,
    onChange: (v: number) => (value.val = v),
  });
};

export const PitchLFODepthKnob = (attributes: ElementProps) => {
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
      van.derive(() => {
        const scaledDepth = value.val / 10;
        sampler.pitchLFO?.setDepth(scaledDepth);
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

  return createLabeledKnob({
    label: 'Pitch LFO Depth',
    defaultValue: 0.0,
    curve: 1.5,
    onChange: (v: number) => (value.val = v),
  });
};

// ===== VOLUME KNOB =====
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

// ===== REVERB KNOB =====
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

// ===== FILTER KNOB =====
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
