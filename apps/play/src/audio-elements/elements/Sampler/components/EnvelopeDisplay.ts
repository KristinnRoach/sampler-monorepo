// EnvelopeDisplay.ts
import van from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { EnvelopeSVG } from '@/elements/controls/envelope';
import { EnvelopeType } from '@repo/audiolib';
import { getSamplePlayer } from '../../../../App';
import { COMPONENT_STYLE } from '@/shared/styles/component-styles';

const { div } = van.tags;

export const EnvelopeDisplay = (attributes: ElementProps) => {
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
      console.log('Waiting for sampler...', {
        samplerReady: samplerInitialized.val,
        sampleLoaded: sampleLoaded.val,
      });
      return;
    }

    const sampler = getSamplePlayer();
    if (!sampler) {
      console.log('No sampler found');
      return;
    }

    // Cleanup previous instance
    if (envelopeInstance) {
      envelopeInstance.cleanup();
    }

    try {
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
    } catch (error) {
      console.error('Error creating envelope:', error);
    }
  };

  attributes.mount(() => {
    const handleSamplerInitialized = () => {
      samplerInitialized.val = true;
      tryCreateEnvelope();
    };

    const handleSampleLoaded = () => {
      sampleLoaded.val = true;
      tryCreateEnvelope();
    };

    document.addEventListener(
      'sampler-initialized',
      handleSamplerInitialized as EventListener
    );
    document.addEventListener(
      'sample-loaded',
      handleSampleLoaded as EventListener
    );

    // Hydrate immediately: the readiness events are one-shot and won't
    // fire again if the sampler (and its initial sample) were already
    // ready before this component mounted.
    const sampler = getSamplePlayer();
    if (sampler) {
      samplerInitialized.val = true;
      if (sampler.audiobuffer) sampleLoaded.val = true;
      tryCreateEnvelope();
    }

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
