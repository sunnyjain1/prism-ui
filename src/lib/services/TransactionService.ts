/// <reference types="vite/client" />
import type { IRepository } from '../core/interfaces';
import type { Transaction, Account } from '../core/models';
import { RemoteRepository } from '../repositories/RemoteRepository';

export class TransactionService {
    private repository: IRepository<Transaction>;

    private readonly EXCHANGE_RATES: Record<string, number> = {
        'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'INR': 83.12, 'JPY': 148.25
    };

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

    async getHistory(months: number = 6): Promise<{ month: string, income: number, expense: number }[]> {
        const repo = this.repository as RemoteRepository<Transaction>;
        const response = await fetch(`${repo.url}/history?months=${months}`, {
            headers: repo.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    }

    async getMonthSummary(month: number, year: number): Promise<{ income: number, expense: number, balance: number }> {
        const txs = await this.getTransactionsByMonth(month, year);
        let income = 0;
        let expense = 0;
        txs.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        });
        return { income, expense, balance: income - expense };
    }

    async getTransactions(params: { month?: number; year?: number; start_date?: string; end_date?: string; search?: string; category_ids?: string[]; account_id?: string }): Promise<Transaction[]> {
        return this.repository.findAll(params);
    }

    async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
        return this.getTransactions({ month, year });
    }

    async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
        return this.repository.update(id, transaction);
    }

    async deleteTransaction(id: string): Promise<void> {
        return this.repository.delete(id);
    }

    convert(amount: number, fromCurrency: string, toCurrency: string) {
        if (fromCurrency === toCurrency) return amount;
        const inUSD = amount / (this.EXCHANGE_RATES[fromCurrency] || 1);
        return inUSD * (this.EXCHANGE_RATES[toCurrency] || 1);
    }

    calculateSummary(txs: Transaction[], accs: Account[], displayCurrency: string) {
        let income = 0;
        let expense = 0;

        txs.forEach(t => {
            const account = accs.find(a => a.id === t.account_id);
            const amt = this.convert(t.amount, account?.currency || 'USD', displayCurrency);
            if (t.type === 'income') income += amt;
            else if (t.type === 'expense') expense += amt;
        });

        return { income, expense, balance: income - expense };
    }

    async exportTransactions(): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/transactions/export`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
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
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/transactions/import`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('Failed to import transactions');
        return response.json();
    }
}
