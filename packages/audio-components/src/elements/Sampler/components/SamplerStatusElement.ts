// SamplerStatusElement.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';

const { div } = van.tags;

export const SamplerStatusElement = (attributes: ElementProps) => {
  const nodeId: State<string> = attributes.attr('target-node-id', '');
  const status = van.state('No sampler found');

  const updateStatus = () => {
    if (!nodeId.val) {
      status.val = 'No node-id specified';
      return;
    }

    const samplePlayer = getSampler(nodeId.val);
    if (!samplePlayer) {
      status.val = 'Sampler not found';
      return;
    }

    status.val = 'Ready';
  };

  attributes.mount(() => {
    updateStatus();

    // Handlers
    const handleSamplerReady = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.nodeId === nodeId.val) {
        updateStatus();
      }
    };

    const handleSampleLoaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.nodeId === nodeId.val) {
        status.val = 'Sample loaded';
      }
    };

    const handleSamplerError = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.nodeId === nodeId.val) {
        status.val = `Error: ${customEvent.detail.error}`;
      }
    };

    // Listeners
    document.addEventListener('sampler-ready', handleSamplerReady);
    document.addEventListener('sample-loaded', handleSampleLoaded);
    document.addEventListener('sampler-error', handleSamplerError);

    return () => {
      document.removeEventListener('sampler-ready', handleSamplerReady);
      document.removeEventListener('sample-loaded', handleSampleLoaded);
      document.removeEventListener('sampler-error', handleSamplerError);
    };
  });

  return div(
    {
      'target-node-id': () => nodeId.val,
      style: `font-family: monospace; font-size: 12px;`,
    },
    () => `${status.val}`
  );
};
