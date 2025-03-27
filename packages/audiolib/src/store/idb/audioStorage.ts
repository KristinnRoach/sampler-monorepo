// src/idb/audioStorage.ts
import { db, ISampleItem } from './db';
import { getAudioContext } from '@/context/globalAudioContext';

/**
 * Stores an AudioBuffer in IndexedDB
 *
 * @param id - Unique identifier for the sample
 * @param url - Original URL or path where the sample was loaded from
 * @param audioBuffer - The decoded AudioBuffer to store
 * @returns Promise resolving to the stored item's ID
 */
export async function storeAudioSample(
  id: string,
  url: string,
  audioBuffer: AudioBuffer
): Promise<string> {
  try {
    // Extract raw audio data
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;

    // Create a Float32Array with enough space for all channels
    const audioData = new Float32Array(numberOfChannels * length);

    // Copy each channel's data into our array
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      audioData.set(channelData, channel * length);
    }

    // Convert Float32Array to ArrayBuffer for storage
    const serializedData = audioData.buffer;

    // Create metadata
    const metadata = {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: numberOfChannels,
    };

    // Create the sample item
    const sampleItem: ISampleItem = {
      id,
      url,
      audioData: serializedData,
      dateAdded: new Date(),
      metadata,
    };

    // Store it in IndexedDB
    await db.samples.put(sampleItem);

    return id;
  } catch (error) {
    console.error('Failed to store audio sample:', error);
    throw new Error(
      `Failed to store audio sample: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Retrieves an AudioBuffer from IndexedDB
 *
 * @param id - Unique identifier for the sample
 * @returns Promise resolving to the AudioBuffer or null if not found
 */
export async function getAudioSample(id: string): Promise<AudioBuffer | null> {
  try {
    // Get the sample item from IndexedDB
    const sampleItem = await db.samples.get(id);

    if (!sampleItem) {
      return null;
    }

    // Get the audio context
    const audioContext = await getAudioContext();

    // Metadata needed for reconstruction
    const channels = sampleItem.metadata?.channels || 1;
    const length = sampleItem.audioData.byteLength / (4 * channels); // 4 bytes per float

    // Create a new AudioBuffer
    const audioBuffer = audioContext.createBuffer(
      channels,
      length,
      sampleItem.metadata?.sampleRate || audioContext.sampleRate
    );

    // Convert ArrayBuffer back to Float32Array
    const audioData = new Float32Array(sampleItem.audioData);

    // Copy data into the AudioBuffer for each channel
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const start = channel * length;
      const end = start + length;
      channelData.set(audioData.subarray(start, end));
    }

    return audioBuffer;
  } catch (error) {
    console.error('Failed to retrieve audio sample:', error);
    throw new Error(
      `Failed to retrieve audio sample: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Removes an audio sample from IndexedDB
 *
 * @param id - Unique identifier for the sample
 * @returns Promise resolving to true if sample was deleted, false otherwise
 */
export async function removeAudioSample(id: string): Promise<boolean> {
  try {
    // Check if the sample exists
    const exists = await db.samples.get(id);
    if (!exists) {
      return false;
    }

    // Delete the sample
    await db.samples.delete(id);
    return true;
  } catch (error) {
    console.error('Failed to remove audio sample:', error);
    throw new Error(
      `Failed to remove audio sample: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Checks if an audio sample exists in IndexedDB
 *
 * @param id - Unique identifier for the sample
 * @returns Promise resolving to true if sample exists, false otherwise
 */
export async function hasAudioSample(id: string): Promise<boolean> {
  try {
    const count = await db.samples.where('id').equals(id).count();
    return count > 0;
  } catch (error) {
    console.error('Failed to check for audio sample:', error);
    throw new Error(
      `Failed to check for audio sample: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
