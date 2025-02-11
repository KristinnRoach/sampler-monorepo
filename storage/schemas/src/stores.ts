// storage/schemas/src/stores.ts
import { User, Sample, SingleSampleInstrument } from './types';

export interface StoreDefinition {
  indices: string;
  version: number;
}

export const storeDefinitions = {
  users: {
    indices: '++id, email, name, role, createdAt, updatedAt',
    version: 1,
  },
  samples: {
    indices: '++id, name, type, instrumentId, createdAt, updatedAt',
    version: 1,
  },
  singleSampleInstruments: {
    indices: '++id, name, serialNumber, status, createdAt, updatedAt',
    version: 1,
  },
} as const;

export type StoreNames = keyof typeof storeDefinitions;

export type StoreEntities = {
  users: User;
  samples: Sample;
  singleSampleInstruments: SingleSampleInstrument;
};
