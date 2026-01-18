import type { Entity } from './interfaces';

export interface Category extends Entity {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    color: string;
}

export interface Transaction extends Entity {
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    description: string;
    merchant?: string;
    date: string; // ISO String
    timestamp: number;
    account_id?: string;
    category_id?: string;
    category?: Category;
    destination_account_id?: string;
}

export interface Account extends Entity {
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
    currency: string;
    balance: number;
    billing_cycle_day: number;
    credit_limit?: number;
}

