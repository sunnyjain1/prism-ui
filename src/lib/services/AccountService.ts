import type { IRepository } from '../core/interfaces';
import type { Account } from '../core/models';

export class AccountService {
    private repository: IRepository<Account>;

    constructor(repository: IRepository<Account>) {
        this.repository = repository;
    }

    async createAccount(name: string, type: Account['type'], currency: string = 'USD'): Promise<Account> {
        const newAccount: Account = {
            id: crypto.randomUUID(),
            name,
            type,
            currency,
            balance: 0,
            billing_cycle_day: 1,
        };
        return this.repository.create(newAccount);
    }

    async getAccounts(): Promise<Account[]> {
        return this.repository.findAll();
    }

    async getAccount(id: string): Promise<Account | null> {
        return this.repository.findById(id);
    }
}
