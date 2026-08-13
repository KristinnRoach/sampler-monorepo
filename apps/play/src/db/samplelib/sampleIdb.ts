// db/sampleDatabase.ts
import Dexie, { Table } from 'dexie';
import type { InstrumentSettings } from '../../utils/instrumentState';

export interface SavedSample {
  id?: number;
  name: string;
  audioData: ArrayBuffer;
  sampleRate?: number;
  channels?: number;
  createdAt?: Date;
  settings?: InstrumentSettings;
}

export class SampleDatabase extends Dexie {
  samples!: Table<SavedSample>;

  constructor() {
    super('SampleDatabase');
    this.version(1).stores({
      samples: '++id, name, createdAt',
    });
  }
}

export const db = new SampleDatabase();
