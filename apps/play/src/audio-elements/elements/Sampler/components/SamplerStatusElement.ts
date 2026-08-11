// SamplerStatusElement.ts
import van from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { getSamplePlayer } from '../../../../App';

const { div } = van.tags;

export const SamplerStatusElement = (attributes: ElementProps) => {
  const status = van.state('No sampler found');

  attributes.mount(() => {
    status.val = 'Click to start';
    let connected = false;

    const connect = () => {
      if (connected) return;
      const sampler = getSamplePlayer();
      if (!sampler) return;
      connected = true;
      status.val = 'Initialized';
    };

    connect();

    const handleSamplerInitialized = () => {
      connect();
    };

    if (!connected) {
      document.addEventListener(
        'sampler-initialized',
        handleSamplerInitialized as EventListener,
      );
    }

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
      document.removeEventListener(
        'sampler-initialized',
        handleSamplerInitialized as EventListener,
      );
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
