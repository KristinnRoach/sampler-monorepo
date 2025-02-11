// storage/dexie/src/base.ts
import Dexie, { Table, UpdateSpec } from 'dexie';
import {
  BaseEntity,
  User,
  Sample,
  SingleSampleInstrument,
  storeDefinitions,
  StoreNames,
  StoreEntities,
} from '@kid/schemas';

export interface DexieStores {
  users?: Table<User>;
  samples?: Table<Sample>;
  instruments?: Table<SingleSampleInstrument>;
}

export class BaseDexieDB extends Dexie {
  stores: Record<StoreNames, Table<any>> = {} as Record<StoreNames, Table<any>>;

  constructor(databaseName: string, selectedStores: StoreNames[]) {
    super(databaseName);

    // Only include the requested stores
    const storeIndices = selectedStores.reduce(
      (acc, storeName) => {
        acc[storeName] = storeDefinitions[storeName].indices;
        return acc;
      },
      {} as Record<string, string>
    );

    // Initialize the database with the selected stores
    this.version(1).stores(storeIndices);

    // Initialize table properties
    selectedStores.forEach((storeName) => {
      this.stores[storeName] =
        this.table<StoreEntities[typeof storeName]>(storeName);
    });
  }

  protected async createEntity<T extends BaseEntity>(
    table: Table<T>,
    data: Omit<T, keyof BaseEntity>
  ): Promise<number> {
    const timestamp = new Date();
    const entity = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as T;

    return await table.add(entity);
  }

  protected async updateEntity<T extends BaseEntity>(
    table: Table<T>,
    id: number,
    data: Partial<Omit<T, keyof BaseEntity>>
  ): Promise<void> {
    const timestamp = new Date();
    const updateData: Partial<Omit<T, keyof BaseEntity>> & { updatedAt: Date } =
      {
        ...data,
        updatedAt: timestamp,
      };

    await table.update(id, updateData as UpdateSpec<T>);
  }
}

//   // Example usage in an app:
//   // apps/app1/src/db/index.ts
//   import { BaseDexieDB } from '@your-org/dexie';
//   import { User, Sample } from '@your-org/schemas';

//   export class App1DB extends BaseDexieDB {
//     users!: Table<User>;
//     samples!: Table<Sample>;

//     constructor() {
//       super('App1DB', ['users', 'samples']);
//     }

//     // App-specific methods using shared schemas
//     async createUser(userData: Omit<User, keyof BaseEntity>) {
//       return this.createEntity(this.users, userData);
//     }

//     async findUserByEmail(email: string) {
//       return this.stores.users?.where('email').equals(email).first();
//     }
//   }

//   // Usage example
//   const db = new App1DB();

//   await db.createUser({
//     email: 'user@example.com',
//     name: 'Test User',
//     role: 'user'
//   });
