import {
  arrayBufferToBase64,
  audioBufferToWav,
  base64ToArrayBuffer,
  validateWavBuffer,
} from './bufferUtils';

const STORAGE_KEY = 'currentSample';

export const loadDefaultSample = async (): Promise<ArrayBuffer> => {
  const res = await fetch('/audio/init_sample.webm');
  return res.arrayBuffer();
};

export const loadCurrentSample = (): ArrayBuffer | undefined => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored?.length) return;

  try {
    const buffer = base64ToArrayBuffer(stored);
    if (validateWavBuffer(buffer)) return buffer;
  } catch {
    // Remove corrupt or unreadable sample data below.
  }

  localStorage.removeItem(STORAGE_KEY);
};

export const saveCurrentSample = (buffer: AudioBuffer): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      arrayBufferToBase64(audioBufferToWav(buffer)),
    );
  } catch (error) {
    console.error('Failed to persist current sample:', error);
  }
};
