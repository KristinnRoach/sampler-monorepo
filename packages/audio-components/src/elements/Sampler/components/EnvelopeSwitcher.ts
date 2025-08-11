// EnvelopeSwitcher.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { EnvelopeSVG } from '@/elements/controls/envelope';
import { EnvelopeType } from '@repo/audiolib';
import { getSampler } from '../SamplerRegistry';
import { COMPONENT_STYLE } from '@/shared/styles/component-styles';

const { div, button } = van.tags;

// Define the envelope types we actually support
type SupportedEnvelopeType = 'amp-env' | 'filter-env' | 'pitch-env';

export const EnvelopeSwitcher = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');
  const width = attributes.attr('width', '100%');
  const height = attributes.attr('height', '200px');

  const activeEnvelope = van.state<SupportedEnvelopeType>('amp-env');
  const samplerReady = van.state(false);
  const sampleLoaded = van.state(false);

  const envelopes: Record<SupportedEnvelopeType, EnvelopeSVG | null> = {
    'amp-env': null,
    'filter-env': null,
    'pitch-env': null,
  };

  const createEnvelope = (envType: SupportedEnvelopeType) => {
    if (!samplerReady.val || !sampleLoaded.val) return;

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    try {
      // Cleanup existing envelope
      if (envelopes[envType]) {
        envelopes[envType]!.cleanup();
      }

      // Create new envelope instance
      envelopes[envType] = EnvelopeSVG(
        sampler,
        envType as EnvelopeType,
        width.val,
        height.val
      );

      // Draw waveform if sample is loaded
      if (sampler.audiobuffer) {
        envelopes[envType]!.drawWaveform(sampler.audiobuffer);
      }
    } catch (error) {
      console.error(`Error creating ${envType} envelope:`, error);
    }
  };

  const createEnvelopes = () => {
    if (!samplerReady.val || !sampleLoaded.val) return;

    // Create all envelope instances
    (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach((envType) => {
      createEnvelope(envType);
    });
  };

  // Watch for active envelope changes and recreate the envelope to get fresh data
  van.derive(() => {
    const currentEnvType = activeEnvelope.val;
    if (samplerReady.val && sampleLoaded.val) {
      createEnvelope(currentEnvType);
    }
  });

  attributes.mount(() => {
    const handleSamplerReady = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.nodeId === targetNodeId.val) {
        samplerReady.val = true;
        createEnvelopes();
      }
    };

    const handleSampleLoaded = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.nodeId === targetNodeId.val) {
        sampleLoaded.val = true;
        createEnvelopes();
      }
    };

    document.addEventListener(
      'sampler-ready',
      handleSamplerReady as EventListener
    );
    document.addEventListener(
      'sample-loaded',
      handleSampleLoaded as EventListener
    );

    return () => {
      // Cleanup all envelopes
      Object.values(envelopes).forEach((env) => {
        if (env) env.cleanup();
      });
      document.removeEventListener(
        'sampler-ready',
        handleSamplerReady as EventListener
      );
      document.removeEventListener(
        'sample-loaded',
        handleSampleLoaded as EventListener
      );
    };
  });

  // Common style for loading state containers
  const loadingStateStyle = `display: flex; height: ${height.val}; width: ${width.val}; justify-content: center; align-items: center; margin-top: 1rem; padding: 1rem;`;

  return div(
    { class: 'envelope-switcher', style: COMPONENT_STYLE },

    // Envelope type buttons
    div(
      { class: 'envelope-buttons' },
      button({ onclick: () => (activeEnvelope.val = 'amp-env') }, 'Amp Env'),
      button(
        { onclick: () => (activeEnvelope.val = 'filter-env') },
        'Filter Env'
      ),
      button({ onclick: () => (activeEnvelope.val = 'pitch-env') }, 'Pitch Env')
    ),

    // Envelope display area
    div({ class: 'envelope-container' }, () => {
      if (!samplerReady.val)
        return div(
          { style: loadingStateStyle },
          'Click anywhere to start the audio system'
        );
      if (!sampleLoaded.val)
        return div({ style: loadingStateStyle }, 'Loading audio sample...');

      const currentEnv = envelopes[activeEnvelope.val];
      if (!currentEnv) return div('Loading envelope...');

      return currentEnv.element;
    })
  );
};
