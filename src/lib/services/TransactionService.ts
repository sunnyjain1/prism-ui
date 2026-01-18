import type { IRepository } from '../core/interfaces';
import type { Transaction } from '../core/models';

export class TransactionService {
    private repository: IRepository<Transaction>;

    constructor(repository: IRepository<Transaction>) {
        this.repository = repository;
    }

    async addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
        const newTransaction: Transaction = {
            ...transaction,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        return this.repository.create(newTransaction);
    }

    async getRecentTransactions(limit: number = 20): Promise<Transaction[]> {
        return this.repository.findAll({ limit });
    }

    async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
        return this.repository.findAll({ month, year });
    }

    async deleteTransaction(id: string): Promise<void> {
        return this.repository.delete(id);
    }

    async getMonthSummary(month: number, year: number) {
        const transactions = await this.getTransactionsByMonth(month, year);
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { income, expense, balance: income - expense };
    }

    async exportTransactions(): Promise<void> {
        const response = await fetch('http://localhost:8000/api/transactions/export');
        if (!response.ok) throw new Error('Failed to export transactions');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async importTransactions(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('http://localhost:8000/api/transactions/import', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to import transactions');
        return response.json();
    }
}

