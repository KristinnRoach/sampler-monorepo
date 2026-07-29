import type { SamplePlayer } from '@repo/audiolib';
import { SavedSample } from '../db/samplelib/sampleIdb';
import { restoreInstrumentState } from '../utils/instrumentState';

export const useSampleSelection = (
  getSamplePlayer: () => SamplePlayer | null,
  getControlsRoot: () => ParentNode | null,
  setSidebarOpen: (value: boolean) => void,
) => {
  const handleSampleSelect = async (sample: SavedSample) => {
    try {
      const samplePlayerRef = getSamplePlayer();
      if (!samplePlayerRef) return;

      const arrayBuffer = sample.audioData;

      await samplePlayerRef.loadSample(arrayBuffer, undefined, {
        skipPreProcessing: true,
      });

      if (sample.settings) {
        const controlsRoot = getControlsRoot();
        if (controlsRoot) {
          restoreInstrumentState(
            samplePlayerRef,
            controlsRoot,
            sample.settings,
          );
        }
      }

      setSidebarOpen(false);
    } catch (error) {
      console.error('Failed to load sample:', error);
    }
  };

  return { handleSampleSelect };
};
