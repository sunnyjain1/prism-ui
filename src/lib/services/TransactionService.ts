import type { IRepository } from '../core/interfaces';
import type { Transaction, Account } from '../core/models';

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

    async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
        return this.repository.findAll({ month, year });
    }

    async getMonthSummary(month: number, year: number) {
        const transactions = await this.getTransactionsByMonth(month, year);
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { income, expense, balance: income - expense };
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
