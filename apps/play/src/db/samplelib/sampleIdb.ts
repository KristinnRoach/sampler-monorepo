// db/sampleDatabase.ts
import Dexie, { Table } from 'dexie';
import type { SamplerParamPatch } from '@kidlib/web-audio';

export interface SavedSample {
  id?: number;
  name: string;
  audioData: ArrayBuffer;
  sampleRate?: number;
  channels?: number;
  createdAt?: Date;
  patch?: { params: SamplerParamPatch };
}

export interface WorkingSample {
  id: 'current';
  audioData: ArrayBuffer;
}

export class SampleDatabase extends Dexie {
  samples!: Table<SavedSample>;
  workingSamples!: Table<WorkingSample, WorkingSample['id']>;

  constructor() {
    super('SampleDatabase');
    this.version(1).stores({
      samples: '++id, name, createdAt',
    });
    this.version(2).stores({
      samples: '++id, name, createdAt',
      workingSamples: 'id',
    });
  }
}

export const db = new SampleDatabase();
