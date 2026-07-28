// Replaces audio-components' <sampler-element>: creates the SamplePlayer,
// restores/persists the current sample via localStorage, and dispatches events.
import { createSamplePlayer, type SamplePlayer } from '@repo/audiolib';
import {
  audioBufferToWav,
  base64ToArrayBuffer,
  arrayBufferToBase64,
  validateWavBuffer,
} from './audio/bufferUtils';

const STORAGE_KEY = 'currentSample';

export interface Sampler {
  nodeId: string;
  samplePlayer: SamplePlayer;
  dispose: () => void;
}

export async function createSampler(
  options: { nodeId?: string; polyphony?: number } = {},
): Promise<Sampler> {
  try {
    let initSample: ArrayBuffer | undefined;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.length) {
      try {
        const arrayBuffer = base64ToArrayBuffer(stored);
        if (validateWavBuffer(arrayBuffer)) {
          initSample = arrayBuffer;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const samplePlayer = await createSamplePlayer(
      initSample,
      options.polyphony ?? 16,
    );
    const nodeId = options.nodeId || samplePlayer.nodeId;

    const dispatchSampleLoaded = (buffer: AudioBuffer, msg: any) => {
      document.dispatchEvent(
        new CustomEvent('sample-loaded', {
          detail: {
            nodeId,
            buffer,
            durationSeconds: msg.durationSeconds,
          },
        }),
      );
    };

    const localStoreSample = (buffer: AudioBuffer) => {
      localStorage.setItem(
        STORAGE_KEY,
        arrayBufferToBase64(audioBufferToWav(buffer)),
      );
    };

    // Currently initial sample loads in audiolib DURING createSamplePlayer's async init (to be reconsidered)
    // Dispatch the initial load
    if (samplePlayer.audiobuffer?.length) {
      dispatchSampleLoaded(samplePlayer.audiobuffer, {
        durationSeconds: samplePlayer.audiobuffer.duration,
      });
      localStoreSample(samplePlayer.audiobuffer);
    }

    samplePlayer.onMessage('sample:loaded', (msg: any) => {
      const audiobuffer = samplePlayer.audiobuffer;
      if (!audiobuffer?.length) {
        console.error('sample:loaded fired without usable audiobuffer');
        return;
      }
      dispatchSampleLoaded(audiobuffer, msg);
      localStoreSample(audiobuffer);
    });

    return {
      nodeId,
      samplePlayer,
      dispose: () => {
        samplePlayer.dispose();
      },
    };
  } catch (error: any) {
    const errText =
      typeof error?.message === 'string' ? error.message : String(error);
    console.error('Sampler initialization error:', error);
    document.dispatchEvent(
      new CustomEvent('sampler-error', {
        detail: {
          nodeId: options.nodeId ?? '',
          error: errText,
          ...(errText.includes('AudioWorklet') && {
            error: 'AudioWorklet not supported',
            message:
              'This browser does not fully support Web Audio. Please use Chrome, Firefox, or Edge on desktop, or update your mobile browser.',
          }),
        },
      }),
    );
    throw error;
  }
}
