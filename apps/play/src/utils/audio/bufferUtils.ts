// TODO: Consider moving to audiolib

export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(
        -1,
        Math.min(1, buffer.getChannelData(channel)[i]),
      );
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return arrayBuffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
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
export function validateWavBuffer(buffer: ArrayBuffer): boolean {
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
      sumAbs += Math.abs(
        view.getInt16(dataOffset + sampleIndex * sampleSize, true),
      );
    } else if (bitsPerSample === 8) {
      sumAbs += Math.abs(
        view.getUint8(dataOffset + sampleIndex * sampleSize) - 128,
      );
    }
  }
  return sumAbs / samplesToCheck >= 0.08 * (1 << (bitsPerSample - 1));
}
