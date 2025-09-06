// db/sampleDatabase.ts
import Dexie, { Table } from 'dexie';

export interface SavedSample {
  id?: number;
  name: string;
  audioData: ArrayBuffer;
  sampleRate?: number;
  channels?: number;
  createdAt?: Date;
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
