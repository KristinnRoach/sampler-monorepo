import {
  arrayBufferToBase64,
  audioBufferToWav,
  base64ToArrayBuffer,
  validateWavBuffer,
} from "./bufferUtils";

const STORAGE_KEY = "currentSample";

export const loadDefaultSample = async (): Promise<ArrayBuffer> => {
  const res = await fetch(`${import.meta.env.BASE_URL}audio/init_sample.webm`);
  if (!res.ok) {
    throw new Error(`Failed to fetch app default sample: ${res.status} ${res.statusText}`);
  }
  return res.arrayBuffer();
};

export const loadCurrentSample = (): ArrayBuffer | undefined => {
  let stored: string | null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to read current sample:", error);
    return;
  }

  if (!stored?.length) return;

  try {
    const buffer = base64ToArrayBuffer(stored);
    if (validateWavBuffer(buffer)) return buffer;
  } catch {
    // Remove corrupt or unreadable sample data below.
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to remove invalid current sample:", error);
  }
};

export const saveCurrentSample = (buffer: AudioBuffer): void => {
  try {
    localStorage.setItem(STORAGE_KEY, arrayBufferToBase64(audioBufferToWav(buffer)));
  } catch (error) {
    console.error("Failed to persist current sample:", error);
  }
};
