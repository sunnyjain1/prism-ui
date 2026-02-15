import type { IRepository } from '../core/interfaces';
import type { Account } from '../core/models';
import { encryptionService } from './EncryptionService';

const ACCOUNT_PII_FIELDS = ['name'];

export class AccountService {
    private repository: IRepository<Account>;

    constructor(repository: IRepository<Account>) {
        this.repository = repository;
    }

    async createAccount(name: string, type: Account['type'], currency: string = 'INR'): Promise<Account> {
        let newAccount: Account = {
            id: crypto.randomUUID(),
            name,
            type,
            currency,
            balance: 0,
            billing_cycle_day: 1,
            monthly_income: 0,
            monthly_expense: 0,
        };
        newAccount = await encryptionService.encryptPII(newAccount, ACCOUNT_PII_FIELDS);
        const result = await this.repository.create(newAccount);
        return encryptionService.decryptPII(result, ACCOUNT_PII_FIELDS);
    }

    async getAccounts(): Promise<Account[]> {
        const accounts = await this.repository.findAll();
        return encryptionService.decryptBatch(accounts, ACCOUNT_PII_FIELDS);
    }

    async getAccount(id: string): Promise<Account | null> {
        const account = await this.repository.findById(id);
        if (!account) return null;
        return encryptionService.decryptPII(account, ACCOUNT_PII_FIELDS);
    }

    async deleteAccount(id: string): Promise<void> {
        return this.repository.delete(id);
    }
}
