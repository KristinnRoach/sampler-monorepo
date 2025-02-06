// storage/schemas/src/stores.ts
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
  instruments: {
    indices: '++id, name, serialNumber, status, createdAt, updatedAt',
    version: 1,
  },
} as const;

export type StoreNames = keyof typeof storeDefinitions;
