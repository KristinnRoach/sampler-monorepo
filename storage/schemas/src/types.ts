// storage/schemas/src/types.ts
export interface BaseEntity {
  id?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Sample extends BaseEntity {
  name: string;
  type: string;
  metadata: Record<string, unknown>;
  instrumentId?: number;
}

export interface SingleSampleInstrument extends BaseEntity {
  name: string;
  settings: Record<string, unknown>; // params
  sampleId?: number;
}
