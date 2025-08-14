```typescript
// Sampler.ts - Simplified with Standardized Async Init Pattern

import van, { State } from '@repo/vanjs-core';
import { define, ElementProps } from '@repo/vanjs-core/element';
import { SamplePlayer, createSamplePlayer } from '@repo/audiolib';
import { registerSampler, unregisterSampler } from './SamplerRegistry';

const { div } = van.tags;

export const SamplerElement = (attributes: ElementProps) => {
  let samplePlayer: SamplePlayer | null = null;

  const nodeId: State<string> = attributes.attr('node-id', '');
  const polyphony = attributes.attr('polyphony', '16');
  const debugMode = attributes.attr('debug-mode', 'false');
  const status = van.state('Click to start');

  // Single initialization function - much simpler!
  const initializeAudio = async () => {
    if (samplePlayer) return; // Already initialized

    try {
      status.val = 'Initializing...';

      // All complexity is now handled in the audio library
      samplePlayer = await createSamplePlayer(
        undefined,
        parseInt(polyphony.val)
      );

      // Set node ID
      if (!nodeId.val) {
        nodeId.val = samplePlayer.nodeId;
      }

      // Register and set up event listeners
      registerSampler(nodeId.val, samplePlayer);
      setupEventListeners();

      status.val = 'Ready';
      Object.assign(attributes.$this, { nodeId: nodeId.val });
    } catch (error: any) {
      console.error('Sampler initialization error:', error);

      // Clean error messages from audio library
      if (error.message.includes('AudioWorklet')) {
        status.val = 'Browser not supported';
      } else {
        status.val = `Error: ${error.message}`;
      }
    }
  };

  const setupEventListeners = () => {
    if (!samplePlayer) return;

    // Event listeners are now guaranteed to work since init() completed
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
  };

  attributes.mount(() => {
    // Simple user interaction handler
    const handleUserInteraction = () => {
      initializeAudio();
    };

    // Add single listener to component
    const element = attributes.$this;
    if (element) {
      element.addEventListener('click', handleUserInteraction, { once: true });
    }

    // Cleanup
    return () => {
      if (samplePlayer && nodeId.val) {
        unregisterSampler(nodeId.val);
        samplePlayer.dispose();
      }
    };
  });

  // Render logic unchanged
  if (debugMode.val === 'true' || debugMode.val === '') {
    return div(
      {
        'node-id': () => nodeId.val,
        style: 'border: 1px solid #ccc; padding: 10px; margin: 5px;',
      },
      div(() => `Sampler: ${nodeId.val}`),
      div(() => `Status: ${status.val}`)
    );
  }

  return div({
    'node-id': () => nodeId.val,
    style: 'display: none;',
  });
};

// Export and registration logic unchanged...
```
