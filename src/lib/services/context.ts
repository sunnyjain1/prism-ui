import { TransactionService } from './TransactionService';
import { AccountService } from './AccountService';
import { CategoryService } from './CategoryService';
import { RemoteRepository } from '../repositories/RemoteRepository';
import type { Transaction, Account, Category } from '../core/models';

const API_URL = 'http://localhost:8000/api';

const transactionRepo = new RemoteRepository<Transaction>(API_URL, 'transactions');
const accountRepo = new RemoteRepository<Account>(API_URL, 'accounts');
const categoryRepo = new RemoteRepository<Category>(API_URL, 'categories');

export const transactionService = new TransactionService(transactionRepo);
export const accountService = new AccountService(accountRepo);
export const categoryService = new CategoryService(categoryRepo);

