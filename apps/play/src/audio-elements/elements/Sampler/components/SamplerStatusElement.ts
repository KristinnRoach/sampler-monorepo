// SamplerStatusElement.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSamplePlayer } from '../../../../App';
import { createSamplerConnection } from '../component-utils';

const { div } = van.tags;

export const SamplerStatusElement = (attributes: ElementProps) => {
  const status = van.state('No sampler found');

  // Use standardized connection utility for initial status
  const { createMountHandler } = createSamplerConnection(
    () => (status.val = 'Initialized')
  );

  attributes.mount(() => {
    status.val = 'Click to start';
    const disposeConnection = createMountHandler()();

    // Additional listeners for sample-loaded and error events
    const handleSampleLoaded = () => {
      status.val = 'Sample loaded';
    };
    const handleSamplerError = (event: Event) => {
      const customEvent = event as CustomEvent;
      status.val = `Error: ${customEvent.detail.error}`;
    };
    document.addEventListener('sample-loaded', handleSampleLoaded);
    document.addEventListener('sampler-error', handleSamplerError);
    return () => {
      disposeConnection?.();
      document.removeEventListener('sample-loaded', handleSampleLoaded);
      document.removeEventListener('sampler-error', handleSamplerError);
    };
  });

  return div(
    {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
      style: `font-family: monospace; font-size: 12px;`,
    },
    () => `${status.val}`
  );
};
