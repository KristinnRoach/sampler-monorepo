// src/idb/db.ts
import Dexie from 'dexie';

export class AudioSampleDB extends Dexie {
  samples: Dexie.Table<IdbSample, TODO>; //

  constructor() {
    super('AudioSampleDB');

    this.version(1).stores({
      samples: 'id, url, dateAdded', // hmmm, stuff missing right?
    });

    this.samples = this.table('samples');
  }
}

// Singleton instance
export const db = new AudioSampleDB();
