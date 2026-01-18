import { createRxDatabase, type RxDatabase, type RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { transactionSchema, type TransactionDoc } from './schema';

export type PrismCollections = {
    transactions: RxCollection<TransactionDoc>;
};

export type PrismDatabase = RxDatabase<PrismCollections>;

let dbPromise: Promise<PrismDatabase> | null = null;

const _createDb = async (): Promise<PrismDatabase> => {
    console.log('Initializing database...');
    const db = await createRxDatabase<PrismCollections>({
        name: 'prismdb',
        storage: getRxStorageDexie(),
        password: 'my-secret-password', // Placeholder for now
        multiInstance: true,
        ignoreDuplicate: true,
    });

    await db.addCollections({
        transactions: {
            schema: transactionSchema,
        },
    });

    console.log('Database initialized');
    return db;
};

export const getDatabase = () => {
    if (!dbPromise) {
        dbPromise = _createDb();
    }
    return dbPromise;
};
