/// <reference types="vite/client" />
import type { IRepository } from '../core/interfaces';
import type { Transaction, Account } from '../core/models';
import { RemoteRepository } from '../repositories/RemoteRepository';
import { encryptionService } from './EncryptionService';

const TX_PII_FIELDS = ['description', 'merchant', 'notes'];

export class TransactionService {
    private repository: IRepository<Transaction>;

    private readonly EXCHANGE_RATES: Record<string, number> = {
        'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'INR': 83.12, 'JPY': 148.25
    };

    constructor(repository: IRepository<Transaction>) {
        this.repository = repository;
    }

    async addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
        let newTransaction: Transaction = {
            ...transaction,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        newTransaction = await encryptionService.encryptPII(newTransaction, TX_PII_FIELDS);
        const result = await this.repository.create(newTransaction);
        return encryptionService.decryptPII(result, TX_PII_FIELDS);
    }

    async getRecentTransactions(limit: number = 20): Promise<Transaction[]> {
        const txs = await this.repository.findAll({ limit });
        return encryptionService.decryptBatch(txs, TX_PII_FIELDS);
    }

    async getHistory(months: number = 6, month?: number, year?: number): Promise<{ month: string, income: number, expense: number }[]> {
        const repo = this.repository as RemoteRepository<Transaction>;
        const params = new URLSearchParams({ months: months.toString() });
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());

        const response = await fetch(`${repo.url}/history?${params.toString()}`, {
            headers: repo.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    }

    async getMonthSummary(month: number, year: number): Promise<{ income: number, expense: number, balance: number }> {
        const repo = this.repository as RemoteRepository<Transaction>;
        const response = await fetch(`${repo.url}/summary?month=${month}&year=${year}`, {
            headers: repo.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch month summary');
        const summaryData: { type: string, currency: string, total: number }[] = await response.json();

        // This will be converted in calculateSummary usually, but for backward compat/direct use:
        // We'll return it and let the caller handle conversion if needed, or just sum it here for basic use.
        let income = 0;
        let expense = 0;
        summaryData.forEach(s => {
            if (s.type === 'income') income += s.total;
            else if (s.type === 'expense') expense += s.total;
        });
        return { income, expense, balance: income - expense };
    }

    async getRawSummary(month: number, year: number): Promise<{ type: string, currency: string, total: number }[]> {
        const repo = this.repository as RemoteRepository<Transaction>;
        const response = await fetch(`${repo.url}/summary?month=${month}&year=${year}`, {
            headers: repo.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch raw summary');
        return response.json();
    }

    async getTransactions(params: { month?: number; year?: number; start_date?: string; end_date?: string; search?: string; category_ids?: string[]; account_id?: string; limit?: number; skip?: number }): Promise<Transaction[]> {
        const txs = await this.repository.findAll(params);
        return encryptionService.decryptBatch(txs, TX_PII_FIELDS);
    }

    async aggregateTransactions(params: { month?: number; year?: number; start_date?: string; end_date?: string; search?: string; category_ids?: string[]; account_id?: string }): Promise<{ count: number; total_income: number; total_expense: number }> {
        const repo = this.repository as RemoteRepository<Transaction>;
        const searchParams = new URLSearchParams();
        if (params.month) searchParams.append('month', params.month.toString());
        if (params.year) searchParams.append('year', params.year.toString());
        if (params.start_date) searchParams.append('start_date', params.start_date);
        if (params.end_date) searchParams.append('end_date', params.end_date);
        if (params.search) searchParams.append('search', params.search);
        if (params.category_ids) params.category_ids.forEach(id => searchParams.append('category_ids', id));
        if (params.account_id) searchParams.append('account_id', params.account_id);

        const response = await fetch(`${repo.url}/aggregate?${searchParams.toString()}`, {
            headers: repo.getHeaders()
        });
        if (!response.ok) throw new Error('Failed to aggregate transactions');
        return response.json();
    }

    async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
        return this.getTransactions({ month, year, limit: 10000 }); // High limit to get "all"
    }

    async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
        const encrypted = await encryptionService.encryptPII(transaction as Record<string, any>, TX_PII_FIELDS);
        const result = await this.repository.update(id, encrypted);
        return encryptionService.decryptPII(result, TX_PII_FIELDS);
    }

    async deleteTransaction(id: string): Promise<void> {
        return this.repository.delete(id);
    }

    convert(amount: number, fromCurrency: string, toCurrency: string) {
        if (fromCurrency === toCurrency) return amount;
        const inUSD = amount / (this.EXCHANGE_RATES[fromCurrency] || 1);
        return inUSD * (this.EXCHANGE_RATES[toCurrency] || 1);
    }

    calculateSummaryFromRaw(rawData: { type: string, currency: string, total: number }[], displayCurrency: string = 'INR') {
        let income = 0;
        let expense = 0;

        rawData.forEach(s => {
            const amt = this.convert(s.total, s.currency, displayCurrency);
            if (s.type === 'income') income += amt;
            else if (s.type === 'expense') expense += amt;
        });

        return { income, expense, balance: income - expense };
    }

    calculateSummary(txs: Transaction[], accs: Account[], displayCurrency: string = 'INR') {
        let income = 0;
        let expense = 0;

        txs.forEach(t => {
            const account = accs.find(a => a.id === t.account_id);
            const amt = this.convert(t.amount, account?.currency || 'INR', displayCurrency);
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
