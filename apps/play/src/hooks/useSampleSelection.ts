import type { SamplePlayer } from '@repo/audio-components';
import { SavedSample } from '../db/samplelib/sampleIdb';
import { restoreInstrumentState } from '../utils/instrumentState';

export const useSampleSelection = (
  getSamplePlayer: () => SamplePlayer | null,
  setSidebarOpen: (value: boolean) => void
) => {
  const handleSampleSelect = async (sample: SavedSample) => {
    try {
      const samplePlayerRef = getSamplePlayer();
      if (!samplePlayerRef) return;

      const arrayBuffer = sample.audioData;

      await samplePlayerRef.loadSample(arrayBuffer, undefined, {
        skipPreProcessing: true,
      });

      // Restore envelope settings using direct method call
      if (sample.settings?.envelopes) {
        // Wait a bit for the sample-loaded event to complete and envelopes to be created
        setTimeout(() => {
          const envelopeSwitcherElement = document.querySelector(
            'envelope-switcher[target-node-id="test-sampler"]'
          ) as any;
          if (
            envelopeSwitcherElement &&
            envelopeSwitcherElement.restoreEnvelopeSettings
          ) {
            envelopeSwitcherElement.restoreEnvelopeSettings(
              sample.settings.envelopes
            );
          }
        }, 100);
      }

      // Restore other settings (non-envelope) after a delay
      if (sample.settings) {
        setTimeout(() => {
          const settingsWithoutEnvelopes = { ...sample.settings };
          delete settingsWithoutEnvelopes.envelopes;
          restoreInstrumentState(settingsWithoutEnvelopes);
        }, 500);
      }

      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
  };

  return { handleSampleSelect };
};
