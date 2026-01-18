import type { RxJsonSchema } from 'rxdb';

export interface TransactionDoc {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    merchant?: string;
    date: string; // ISO Date
    timestamp: number;
}

export const transactionSchema: RxJsonSchema<TransactionDoc> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        amount: {
            type: 'number'
        },
        type: {
            type: 'string',
            enum: ['income', 'expense']
        },
        category: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        merchant: {
            type: 'string'
        },
        date: {
            type: 'string',
            format: 'date-time'
        },
        timestamp: {
            type: 'number'
        }
    },
    required: ['id', 'amount', 'type', 'date', 'timestamp']
};
