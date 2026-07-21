// Replaces audio-components' <sampler-element>: creates the SamplePlayer,
// restores/persists the current sample via localStorage, registers it in the
// audio-components SamplerRegistry and dispatches the same DOM events, so the
// remaining web components (knobs, toggles, keyboards) keep working unchanged.
import { createSamplePlayer, type SamplePlayer } from '@repo/audiolib';
import { registerSampler, unregisterSampler } from '@repo/audio-components';
import { audioBufferToWav } from './audio/audioBufferToWav';

const STORAGE_KEY = 'currentSample';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// Guards against corrupted samples persisted by some browsers (seen in Brave):
// requires a WAV header, >= 0.2s of audio and non-silent amplitude.
function validateWavBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 44) return false;

  const header = new Uint8Array(buffer);
  const isWav =
    header[0] === 0x52 && // 'R'
    header[1] === 0x49 && // 'I'
    header[2] === 0x46 && // 'F'
    header[3] === 0x46 && // 'F'
    header[8] === 0x57 && // 'W'
    header[9] === 0x41 && // 'A'
    header[10] === 0x56 && // 'V'
    header[11] === 0x45; // 'E'
  if (!isWav) return false;

  const view = new DataView(buffer);
  const sampleRate = view.getUint32(24, true);
  const numChannels = view.getUint16(22, true);
  const bitsPerSample = view.getUint16(34, true);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const dataSize = view.getUint32(40, true);
  if (dataSize === 0 || dataSize / byteRate < 0.2) return false;

  const dataOffset = 44;
  const sampleSize = bitsPerSample / 8;
  const numSamples = Math.floor((buffer.byteLength - dataOffset) / sampleSize);
  let sumAbs = 0;
  const samplesToCheck = Math.min(1000, numSamples);
  for (let i = 0; i < samplesToCheck; i++) {
    const sampleIndex = Math.floor((i * numSamples) / samplesToCheck);
    if (bitsPerSample === 16) {
      sumAbs += Math.abs(view.getInt16(dataOffset + sampleIndex * sampleSize, true));
    } else if (bitsPerSample === 8) {
      sumAbs += Math.abs(view.getInt8(dataOffset + sampleIndex * sampleSize));
    }
  }
  return sumAbs / samplesToCheck >= 0.08 * (1 << (bitsPerSample - 1));
}

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
      const arrayBuffer = base64ToArrayBuffer(stored);
      if (validateWavBuffer(arrayBuffer)) initSample = arrayBuffer;
    }

    const samplePlayer = await createSamplePlayer(
      initSample,
      options.polyphony ?? 16,
    );
    const nodeId = options.nodeId || samplePlayer.nodeId;

    registerSampler(nodeId, samplePlayer);
    document.dispatchEvent(
      new CustomEvent('sampler-initialized', { detail: { nodeId } }),
    );

    samplePlayer.onMessage('sample:loaded', (msg: any) => {
      const audiobuffer = samplePlayer.audiobuffer;
      document.dispatchEvent(
        new CustomEvent('sample-loaded', {
          detail: {
            nodeId,
            buffer: audiobuffer,
            durationSeconds: msg.durationSeconds,
          },
        }),
      );
      if (audiobuffer?.length) {
        localStorage.setItem(
          STORAGE_KEY,
          arrayBufferToBase64(audioBufferToWav(audiobuffer)),
        );
      }
    });

    return {
      nodeId,
      samplePlayer,
      dispose: () => {
        unregisterSampler(nodeId);
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
