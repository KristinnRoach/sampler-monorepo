// component-utils.ts - Shared utilities for components
import { type SamplePlayer } from '@repo/audiolib';
import { getSamplePlayer } from '../../../App';


/**
 * Creates a reusable connection handler for sampler components
 */
export const createSamplerConnection = (
  onConnect: (sampler: SamplePlayer) => void
) => {
  let connected = false;

  const connect = () => {
    if (connected) return;
    const sampler = getSamplePlayer();
    if (sampler) {
      connected = true;
      onConnect(sampler);
    }
  };

  const createMountHandler = () => {
    return () => {
      // Try to connect immediately
      connect();

      // If not yet available, listen for sampler-initialized
      if (!connected) {
        const handleSamplerInitialized = () => {
          connect();
        };
        document.addEventListener(
          'sampler-initialized',
          handleSamplerInitialized as EventListener
        );

        return () => {
          document.removeEventListener(
            'sampler-initialized',
            handleSamplerInitialized as EventListener
          );
        };
      }
    };
  };

  return { connect, createMountHandler };
};
