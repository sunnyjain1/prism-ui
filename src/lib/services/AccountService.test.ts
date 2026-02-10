import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountService } from './AccountService';

describe('AccountService', () => {
    let service: AccountService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            create: vi.fn(),
            findAll: vi.fn(),
            findById: vi.fn(),
            delete: vi.fn(),
        };
        service = new AccountService(mockRepo);
    });

    it('should create an account with a random UUID', async () => {
        mockRepo.create.mockImplementation((data: any) => Promise.resolve(data));
        const result = await service.createAccount('Checking', 'checking');
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Checking');
        expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should get all accounts', async () => {
        mockRepo.findAll.mockResolvedValue([]);
        await service.getAccounts();
        expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('should find account by id', async () => {
        mockRepo.findById.mockResolvedValue({ id: '123' });
        const result = await service.getAccount('123');
        expect(result?.id).toBe('123');
        expect(mockRepo.findById).toHaveBeenCalledWith('123');
    });

    it('should delete account', async () => {
        mockRepo.delete.mockResolvedValue(undefined);
        await service.deleteAccount('123');
        expect(mockRepo.delete).toHaveBeenCalledWith('123');
    });
});
