import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransactionService } from './TransactionService';
import type { Transaction, Account } from '../core/models';

describe('TransactionService', () => {
    let service: TransactionService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            create: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };
        service = new TransactionService(mockRepo);
        vi.stubGlobal('localStorage', {
            getItem: vi.fn().mockReturnValue('fake-token'),
            setItem: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should add a transaction with id and timestamp', async () => {
        const txData: any = { amount: 100, type: 'income', description: 'Test' };
        mockRepo.create.mockResolvedValue({ ...txData, id: '123', timestamp: 456 });

        const result = await service.addTransaction(txData);
        expect(result.id).toBeDefined();
        expect(result.timestamp).toBeDefined();
        expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should get transactions with params', async () => {
        const params = { month: 1, year: 2025 };
        mockRepo.findAll.mockResolvedValue([]);

        await service.getTransactions(params);
        expect(mockRepo.findAll).toHaveBeenCalledWith(params);
    });

    it('should convert currency correctly', () => {
        // USD to INR (83.12)
        expect(service.convert(1, 'USD', 'INR')).toBe(83.12);
        // INR to USD
        expect(service.convert(83.12, 'INR', 'USD')).toBeCloseTo(1);
        // Same currency
        expect(service.convert(100, 'USD', 'USD')).toBe(100);
    });

    it('should calculate summary correctly', () => {
        const txs: any[] = [
            { amount: 100, type: 'income', account_id: 'acc1' },
            { amount: 50, type: 'expense', account_id: 'acc1' },
        ];
        const accs: any[] = [{ id: 'acc1', currency: 'USD' }];

        const summary = service.calculateSummary(txs, accs, 'USD');
        expect(summary.income).toBe(100);
        expect(summary.expense).toBe(50);
        expect(summary.balance).toBe(50);
    });

    it('should get month summary', async () => {
        const txs: any[] = [
            { amount: 200, type: 'income' },
            { amount: 100, type: 'expense' },
        ];
        mockRepo.findAll.mockResolvedValue(txs);

        const summary = await service.getMonthSummary(1, 2025);
        expect(summary.income).toBe(200);
        expect(summary.expense).toBe(100);
    });

    it('should get transactions with filters', async () => {
        mockRepo.findAll.mockResolvedValue([]);
        await service.getTransactions({ search: 'test' });
        expect(mockRepo.findAll).toHaveBeenCalledWith({ search: 'test' });
    });

    it('should get recent transactions', async () => {
        mockRepo.findAll.mockResolvedValue([]);
        await service.getRecentTransactions(10);
        expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 10 });
    });

    it('should get history', async () => {
        const mockTxs = [{ month: 'Jan', income: 100, expense: 50 }];
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockTxs),
        });
        vi.stubGlobal('fetch', mockFetch);
        mockRepo.url = 'http://api';
        mockRepo.getHeaders = vi.fn().mockReturnValue({});

        const result = await service.getHistory(3, 1, 2025);
        expect(result).toEqual(mockTxs);
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should update and delete transaction', async () => {
        mockRepo.update.mockResolvedValue({});
        await service.updateTransaction('123', {});
        expect(mockRepo.update).toHaveBeenCalledWith('123', {});

        mockRepo.delete.mockResolvedValue(undefined);
        await service.deleteTransaction('123');
        expect(mockRepo.delete).toHaveBeenCalledWith('123');
    });

    it('should export transactions', async () => {
        const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            blob: () => Promise.resolve(mockBlob),
        });
        vi.stubGlobal('fetch', mockFetch);
        const mockCreateObjectURL = vi.fn().mockReturnValue('blob-url');
        const mockRevokeObjectURL = vi.fn();
        vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL });

        // Mock document.createElement and body.appendChild
        const mockA = { href: '', download: '', click: vi.fn() } as any;
        vi.spyOn(document, 'createElement').mockReturnValue(mockA);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockA);

        await service.exportTransactions();
        expect(mockFetch).toHaveBeenCalled();
        expect(mockA.download).toBe('transactions.csv');
        expect(mockA.click).toHaveBeenCalled();
    });

    it('should import transactions', async () => {
        const mockFile = new File(['csv'], 'test.csv', { type: 'text/csv' });
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ count: 1 }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await service.importTransactions(mockFile);
        expect(result.count).toBe(1);
        expect(mockFetch).toHaveBeenCalled();
    });
});
