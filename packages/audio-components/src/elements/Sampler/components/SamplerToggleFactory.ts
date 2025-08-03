// ToggleComponents.ts - Toggle and control components
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../../../SamplerRegistry';
import { Toggle } from '../../primitives/VanToggle';
import { INLINE_COMPONENT_STYLE } from '../../../shared/styles/component-styles';
import { createFindNodeId } from '@/shared/utils/component-utils';

const { div, label } = van.tags;

// ===== FEEDBACK MODE TOGGLE =====
export const FeedbackModeToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const isPolyphonic = van.state(false); // false = monophonic, true = polyphonic
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
        const mode = isPolyphonic.val ? 'polyphonic' : 'monophonic';
        sampler.setFeedbackMode(mode);
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'Feedback Mode' }),
    Toggle({
      on: isPolyphonic.val,
      size: 1,
      onColor: '#4CAF50',
      onChange: () => (isPolyphonic.val = !isPolyphonic.val),
    }),
    div(() => (isPolyphonic.val ? 'Polyphonic' : 'Monophonic'))
  );
};

// ===== MIDI ENABLE TOGGLE =====
export const MidiToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const enabled = van.state(true);
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
        if (enabled.val) {
          if (
            sampler &&
            'enableMIDI' in sampler &&
            typeof sampler.enableMIDI === 'function'
          ) {
            sampler.enableMIDI();
          }
        } else {
          if (
            sampler &&
            'disableMIDI' in sampler &&
            typeof sampler.disableMIDI === 'function'
          ) {
            sampler.disableMIDI();
          }
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'MIDI' }),
    Toggle({
      on: enabled.val,
      size: 1,
      onColor: '#4CAF50',
      onChange: () => (enabled.val = !enabled.val),
    }),
    div(() => (enabled.val ? 'ON' : 'OFF'))
  );
};

// ===== LOOP/HOLD LOCK TOGGLES =====
export const LoopLockToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const locked = van.state(false);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.setLoopLocked(locked.val));
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'Loop Lock' }),
    Toggle({
      on: locked.val,
      size: 1,
      onColor: '#ff9800',
      onChange: () => (locked.val = !locked.val),
    }),
    div(() => (locked.val ? 'LOCKED' : 'FREE'))
  );
};

export const HoldLockToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const locked = van.state(false);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.setHoldLocked(locked.val));
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'Hold Lock' }),
    Toggle({
      on: locked.val,
      size: 1,
      onColor: '#ff9800',
      onChange: () => (locked.val = !locked.val),
    }),
    div(() => (locked.val ? 'LOCKED' : 'FREE'))
  );
};

// ===== LFO TOGGLES =====

export const GainLFOSyncNoteToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const synced = van.state(false);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.syncLFOsToNoteFreq('gain-lfo', synced.val));
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'Gain LFO Sync' }),
    Toggle({
      on: synced.val,
      size: 1,
      onColor: '#ff9800',
      onChange: () => (synced.val = !synced.val),
    }),
    div(() => (synced.val ? 'SYNCED' : 'FREE'))
  );
};

export const PitchLFOSyncNoteToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const synced = van.state(false);
  let connected = false;

  const findNodeId = createFindNodeId(attributes, targetNodeId);

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    if (!nodeId) return;
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => sampler.syncLFOsToNoteFreq('pitch-lfo', synced.val));
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'Pitch LFO Sync' }),
    Toggle({
      on: synced.val,
      size: 1,
      onColor: '#ff9800',
      onChange: () => (synced.val = !synced.val),
    }),
    div(() => (synced.val ? 'SYNCED' : 'FREE'))
  );
};

export const PlaybackDirectionToggle = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const reversed = van.state(false);
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
        const direction = reversed.val === true ? 'reverse' : 'forward';
        sampler.setPlaybackDirection(direction);
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

  return div(
    { style: INLINE_COMPONENT_STYLE },
    label({ textContent: 'Direction' }),
    Toggle({
      on: reversed.val,
      size: 1,
      onColor: '#ff9800',
      onChange: () => (reversed.val = !reversed.val),
    }),
    div(() => (reversed.val ? 'REVERSE' : 'FORWARD'))
  );
};
