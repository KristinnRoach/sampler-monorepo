// EnvelopeSwitcher.ts
import van from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { EnvelopeSVG, EnvelopeSettings } from '@/elements/controls/envelope';
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
  const bgColor = attributes.attr('bg-color', '#1e1e1e');

  const activeEnvelope = van.state<SupportedEnvelopeType>('amp-env');
  const samplerInitialized = van.state(false);
  const sampleLoaded = van.state(false);

  // Store saved envelope settings
  let savedEnvelopeSettings: Record<string, EnvelopeSettings> | null = null;

  const envelopes: Record<SupportedEnvelopeType, EnvelopeSVG | null> = {
    'amp-env': null,
    'filter-env': null,
    'pitch-env': null,
  };

  const createEnvelopes = () => {
    if (!samplerInitialized.val || !sampleLoaded.val) return;

    const sampler = getSampler(targetNodeId.val);
    if (!sampler) return;

    let snapToValues = {};
    (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach((envType) => {
      if (!envelopes[envType]) {
        if (envType === 'pitch-env') snapToValues = { y: [0.5] }; // Snap to center line
        try {
          const savedSettings = savedEnvelopeSettings?.[envType] || undefined;
          envelopes[envType] = EnvelopeSVG(
            sampler,
            envType as EnvelopeType,
            width.val,
            height.val,
            snapToValues,
            0.025,
            true,
            savedSettings,
            bgColor.val
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

  // Public method to restore envelope settings
  const restoreEnvelopeSettings = (
    settings: Record<string, EnvelopeSettings>
  ) => {
    (Object.keys(settings) as SupportedEnvelopeType[]).forEach((envType) => {
      if (envelopes[envType] && settings[envType]) {
        envelopes[envType]!.restoreState(settings[envType]);
      }
    });
  };

  // Add the method to the custom element instance
  (attributes.$this as any).restoreEnvelopeSettings = restoreEnvelopeSettings;

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
        // Store envelope settings if provided in the event
        if (customEvent.detail.envelopeSettings) {
          savedEnvelopeSettings = customEvent.detail.envelopeSettings;
        }
        if (samplerInitialized.val) {
          createEnvelopes();
        }
      }
    };

    const handleRestoreEnvelopes = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail.nodeId === targetNodeId.val &&
        customEvent.detail.envelopeSettings
      ) {
        restoreEnvelopeSettings(customEvent.detail.envelopeSettings);
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
    document.addEventListener(
      'restore-envelope-settings',
      handleRestoreEnvelopes as EventListener
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
      document.removeEventListener(
        'restore-envelope-settings',
        handleRestoreEnvelopes as EventListener
      );
    };
  });

  // Common style for loading state containers
  const loadingStateStyle = `background: transparent; justify-content: center; padding: 1rem; padding-top: 3rem; `; //  height: ${height.val}; width: ${width.val}

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

    div(
      {
        class: 'envelope-container',
        style: () =>
          `background-color: ${!sampleLoaded.val ? 'transparent' : bgColor.val};`,
      },
      () => {
        if (!samplerInitialized.val)
          return div(
            { style: () => loadingStateStyle },
            'Click anywhere to start'
          );
        if (!sampleLoaded.val)
          return div(
            { style: () => loadingStateStyle },
            'Loading audio sample...'
          );

        // Return a container with all envelope elements
        const container = div({ style: 'position: relative;' });

        // Add all created envelopes to the container
        (Object.keys(envelopes) as SupportedEnvelopeType[]).forEach(
          (envType) => {
            if (envelopes[envType]) {
              container.appendChild(envelopes[envType]!.element as HTMLElement);
            }
          }
        );

        return container.children.length > 0
          ? container
          : div('Loading envelopes...');
      }
    )
  );
};
