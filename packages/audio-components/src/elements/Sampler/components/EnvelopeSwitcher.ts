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

  const createEnvelopes = () => {
    if (!samplerInitialized.val || !sampleLoaded.val) return;

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach((envType) => {
      if (!envelopes[envType]) {
        try {
          envelopes[envType] = EnvelopeSVG(
            sampler,
            envType as EnvelopeType,
            width.val,
            height.val
          );

          if (envType !== activeEnvelope.val) {
            (envelopes[envType]!.element as HTMLElement).style.display = 'none';
          }
        } catch (error) {
          console.error(`Error creating ${envType} envelope:`, error);
        }
      }
    });
  };

  van.derive(() => {
    const currentEnvType = activeEnvelope.val;

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
  const loadingStateStyle = `display: flex; height: 100%; width: 100%; justify-content: center; align-items: center; margin-top: 1rem; padding: 1rem;`; //  height: ${height.val}; width: ${width.val}

  return div(
    { class: 'envelope-switcher', style: COMPONENT_STYLE },

    div(
      { class: 'envelope-buttons' },
      div(
        {
          class: () =>
            `button ${activeEnvelope.val === 'amp-env' ? 'selected' : ''}`,
          onclick: () => (activeEnvelope.val = 'amp-env'),
        },
        'Amp'
      ),
      div(
        {
          class: () =>
            `button ${activeEnvelope.val === 'filter-env' ? 'selected' : ''}`,
          onclick: () => (activeEnvelope.val = 'filter-env'),
        },
        'Filter'
      ),
      div(
        {
          class: () =>
            `button ${activeEnvelope.val === 'pitch-env' ? 'selected' : ''}`,
          onclick: () => (activeEnvelope.val = 'pitch-env'),
        },
        'Pitch'
      )
    ),

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

      return container.children.length > 0
        ? container
        : div('Loading envelopes...');
    })
  );
};
