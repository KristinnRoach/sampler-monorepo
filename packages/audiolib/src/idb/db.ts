// src/idb/db.ts
import Dexie from 'dexie';

// Define the database schema
export class AudioSampleDB extends Dexie {
  // Define tables
  samples: Dexie.Table<ISampleItem, string>;

  constructor() {
    super('AudioSampleDB');

    // Define schema with version
    this.version(1).stores({
      samples: 'id, url, dateAdded',
    });

    // Type the tables
    this.samples = this.table('samples');
  }
}

// Sample item interface
export interface ISampleItem {
  id: string; // Unique identifier (could be the file path or a generated ID)
  url: string; // Original URL or file path
  audioData: ArrayBuffer; // Serializable audio data
  dateAdded: Date; // Timestamp for cache management
  metadata?: {
    // Optional metadata
    duration?: number; // Duration in seconds
    sampleRate?: number;
    channels?: number;
  };
}

// Create and export a singleton instance
export const db = new AudioSampleDB();
