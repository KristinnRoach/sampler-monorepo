import { db } from '../../db/samplelib/sampleIdb';
import { audioBufferToWav, validateWavBuffer } from './bufferUtils';

const CURRENT_SAMPLE_ID = 'current';

export const loadDefaultSample = async (): Promise<ArrayBuffer> => {
  const res = await fetch(`${import.meta.env.BASE_URL}audio/init_sample.webm`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch app default sample: ${res.status} ${res.statusText}`,
    );
  }
  return res.arrayBuffer();
};

export const loadCurrentSample = async (): Promise<ArrayBuffer | undefined> => {
  const stored = await db.workingSamples.get(CURRENT_SAMPLE_ID);
  if (stored) {
    if (validateWavBuffer(stored.audioData)) return stored.audioData;
    try {
      await db.workingSamples.delete(CURRENT_SAMPLE_ID);
    } catch (error) {
      console.error('Failed to remove invalid current sample:', error);
    }
  }
};

export const saveCurrentSample = async (buffer: AudioBuffer): Promise<void> => {
  try {
    await db.workingSamples.put({
      id: CURRENT_SAMPLE_ID,
      audioData: audioBufferToWav(buffer),
    });
  } catch (error) {
    console.error('Failed to persist current sample:', error);
  }
};
