const audioDir = '../../../assets/audio/'; // import.meta.env.VITE_SAMPLELIB_PATH;
const DEFAULT_SAMPLE_NAME = 'trimmed.wav';

export const audioBaseUrl = new URL(audioDir, import.meta.url).href;
export const defaultSampleUrl = audioBaseUrl + DEFAULT_SAMPLE_NAME;
