// EnvelopeDisplay.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { EnvelopeSVG } from '@/elements/controls/envelope';
import { EnvelopeType } from '@repo/audiolib';
import { getSampler } from '../SamplerRegistry';
import { COMPONENT_STYLE } from '@/shared/styles/component-styles';

const { div } = van.tags;

export const EnvelopeDisplay = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');
  const envelopeType = attributes.attr('envelope-type', 'amp-env');
  const width = attributes.attr('width', '100%');
  const height = attributes.attr('height', '200px');

  let envelopeInstance: EnvelopeSVG | null = null;

  // Convert to VanJS states for reactivity
  const samplerInitialized = van.state(false);
  const sampleLoaded = van.state(false);

  const tryCreateEnvelope = () => {
    // Only create envelope when both sampler is ready AND sample is loaded
    if (!samplerInitialized.val || !sampleLoaded.val) {
      console.log('Waiting for both sampler ready and sample loaded...', {
        samplerReady: samplerInitialized.val,
        sampleLoaded: sampleLoaded.val,
      });
      return;
    }

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) {
      console.log('No sampler found for nodeId:', targetNodeId.val);
      return;
    }

    // Cleanup previous instance
    if (envelopeInstance) {
      envelopeInstance.cleanup();
    }

    try {
      console.log('Creating envelope after sample loaded...', envelopeType.val);

      // Create new envelope instance
      envelopeInstance = EnvelopeSVG(
        sampler,
        envelopeType.val as EnvelopeType,
        width.val,
        height.val
      );

      // Draw waveform since we know sample is loaded
      if (sampler.audiobuffer) {
        envelopeInstance.drawWaveform(sampler.audiobuffer);
      }

      console.log('Envelope created successfully');
    } catch (error) {
      console.error('Error creating envelope:', error);
    }
  };

  attributes.mount(() => {
    const handleSamplerInitialized = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('Sampler initialized event:', customEvent.detail);
      if (customEvent.detail.nodeId === targetNodeId.val) {
        samplerInitialized.val = true; // Update state
        tryCreateEnvelope();
      }
    };

    const handleSampleLoaded = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('Sample loaded event:', customEvent.detail);
      if (customEvent.detail.nodeId === targetNodeId.val) {
        sampleLoaded.val = true; // Update state
        tryCreateEnvelope();
      }
    };

    document.addEventListener(
      'sampler-initialized',
      handleSamplerInitialized as EventListener
    );
    document.addEventListener(
      'sample-loaded',
      handleSampleLoaded as EventListener
    );

    return () => {
      if (envelopeInstance) {
        envelopeInstance.cleanup();
      }
      document.removeEventListener(
        'sampler-initialized',
        handleSamplerInitialized as EventListener
      );
      document.removeEventListener(
        'sample-loaded',
        handleSampleLoaded as EventListener
      );
    };
  });

  return div(
    {
      class: 'envelope-display',
      style: COMPONENT_STYLE,
    },
    () => {
      if (!samplerInitialized.val) return div('Waiting for sampler...');
      if (!sampleLoaded.val) return div('Waiting for sample...');
      if (!envelopeInstance) return div('Creating envelope...');
      return envelopeInstance.element;
    }
  );
};

// export const EnvelopeDisplay = (attributes: ElementProps) => {
//   const targetNodeId = attributes.attr('target-node-id', '');
//   const envelopeType = attributes.attr('envelope-type', 'amp-env');
//   const width = attributes.attr('width', '100%');
//   const height = attributes.attr('height', '200px');

//   let envelopeInstance: EnvelopeSVG | null = null;
//   let connected = false;

//   const connect = () => {
//     if (connected) return;
//     const sampler = getSampler(targetNodeId.val);
//     if (!sampler) {
//       console.log('No sampler found for nodeId:', targetNodeId.val);
//       return;
//     }

//     console.log('Attempting to connect envelope, sampler:', sampler);

//     // Check if sampler is fully initialized
//     if (!sampler.initialized) {
//       console.log('Sampler not yet initialized, waiting...');
//       return;
//     }

//     // Cleanup previous instance
//     if (envelopeInstance) {
//       envelopeInstance.cleanup();
//     }

//     try {
//       // Create new envelope instance
//       envelopeInstance = EnvelopeSVG(
//         sampler,
//         envelopeType.val as EnvelopeType,
//         width.val,
//         height.val
//       );

//       // Draw waveform if sample is loaded
//       if (sampler.audiobuffer) {
//         envelopeInstance.drawWaveform(sampler.audiobuffer);
//       }

//       connected = true;
//       console.log('Envelope connected successfully');
//     } catch (error) {
//       console.error('Error creating envelope:', error);
//     }
//   };

//   attributes.mount(() => {
//     // Try to connect immediately
//     connect();

//     const handleSamplerReady = (e: Event) => {
//       const customEvent = e as CustomEvent;
//       console.log('Sampler ready event:', customEvent.detail);
//       if (customEvent.detail.nodeId === targetNodeId.val) {
//         // Reset connected flag and try again
//         connected = false;
//         connect();
//       }
//     };

//     const handleSampleLoaded = (e: Event) => {
//       const customEvent = e as CustomEvent;
//       if (customEvent.detail.nodeId === targetNodeId.val && envelopeInstance) {
//         envelopeInstance.drawWaveform(customEvent.detail.buffer);
//       }
//     };

//     document.addEventListener(
//       'sampler-initialized',
//       handleSamplerReady as EventListener
//     );
//     document.addEventListener(
//       'sample-loaded',
//       handleSampleLoaded as EventListener
//     );

//     return () => {
//       if (envelopeInstance) {
//         envelopeInstance.cleanup();
//       }
//       document.removeEventListener(
//         'sampler-initialized',
//         handleSamplerReady as EventListener
//       );
//       document.removeEventListener(
//         'sample-loaded',
//         handleSampleLoaded as EventListener
//       );
//     };
//   });

//   return div(
//     {
//       class: 'envelope-display',
//       style: COMPONENT_STYLE,
//     },
//     () =>
//       envelopeInstance ? envelopeInstance.element : div('Loading envelope...')
//   );
// };
