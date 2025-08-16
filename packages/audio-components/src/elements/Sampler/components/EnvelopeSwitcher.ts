// EnvelopeSwitcher.ts
import van from '@repo/vanjs-core';
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
  const samplerInitialized = van.state(false);
  const sampleLoaded = van.state(false);

  const envelopes: Record<SupportedEnvelopeType, EnvelopeSVG | null> = {
    'amp-env': null,
    'filter-env': null,
    'pitch-env': null,
  };

  // Create all envelopes once when sampler is ready
  const createEnvelopes = () => {
    if (!samplerInitialized.val || !sampleLoaded.val) return;

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    // Create all envelope instances at once
    (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach((envType) => {
      if (!envelopes[envType]) {
        try {
          envelopes[envType] = EnvelopeSVG(
            sampler,
            envType as EnvelopeType,
            width.val,
            height.val
          );

          // No need to manually draw waveform - EnvelopeSVG listens for sample:loaded

          // Hide non-active envelopes initially
          if (envType !== activeEnvelope.val) {
            (envelopes[envType]!.element as HTMLElement).style.display = 'none';
          }
        } catch (error) {
          console.error(`Error creating ${envType} envelope:`, error);
        }
      }
    });
  };

  // Show/hide envelopes when active envelope changes
  van.derive(() => {
    const currentEnvType = activeEnvelope.val;
    
    // Hide all envelopes
    (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach((envType) => {
      if (envelopes[envType]) {
        (envelopes[envType]!.element as HTMLElement).style.display = 
          envType === currentEnvType ? 'block' : 'none';
      }
    });
  });

  attributes.mount(() => {
    const handlesamplerInitialized = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.nodeId === targetNodeId.val) {
        samplerInitialized.val = true;
        if (sampleLoaded.val) {
          createEnvelopes();
        }
      }
    };

    const handleSampleLoaded = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.nodeId === targetNodeId.val) {
        sampleLoaded.val = true;
        if (samplerInitialized.val) {
          createEnvelopes();
        }
      }
    };

    document.addEventListener(
      'sampler-initialized',
      handlesamplerInitialized as EventListener
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
        'sampler-initialized',
        handlesamplerInitialized as EventListener
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

    // Envelope display area - now contains all envelopes, showing/hiding them
    div({ class: 'envelope-container' }, () => {
      if (!samplerInitialized.val)
        return div({ style: loadingStateStyle }, 'Click anywhere to start');
      if (!sampleLoaded.val)
        return div({ style: loadingStateStyle }, 'Loading audio sample...');

      // Return a container with all envelope elements
      const container = div({ style: 'position: relative;' });
      
      // Add all created envelopes to the container
      (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach((envType) => {
        if (envelopes[envType]) {
          container.appendChild(envelopes[envType]!.element as HTMLElement);
        }
      });
      
      return container.children.length > 0 ? container : div('Loading envelopes...');
    })
  );
};
