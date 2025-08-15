// SamplerStatusElement.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSampler } from '../SamplerRegistry';
import {
  createFindNodeId,
  createSamplerConnection,
} from '../../../shared/utils/component-utils';

const { div } = van.tags;

export const SamplerStatusElement = (attributes: ElementProps) => {
  const nodeId: State<string> = attributes.attr('target-node-id', '');
  const status = van.state('No sampler found');
  const findNodeId = createFindNodeId(attributes, nodeId);

  // Use standardized connection utility for initial status
  const { createMountHandler } = createSamplerConnection(
    findNodeId,
    getSampler,
    () => (status.val = 'Initialized')
  );

  attributes.mount(() => {
    status.val = 'Click to start';
    createMountHandler(attributes)();

    // Additional listeners for sample-loaded and error events
    const handleSampleLoaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.nodeId === findNodeId()) {
        status.val = 'Sample loaded';
      }
    };
    const handleSamplerError = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.nodeId === findNodeId()) {
        status.val = `Error: ${customEvent.detail.error}`;
      }
    };
    document.addEventListener('sample-loaded', handleSampleLoaded);
    document.addEventListener('sampler-error', handleSamplerError);
    return () => {
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
