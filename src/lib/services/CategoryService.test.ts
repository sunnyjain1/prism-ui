import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from './CategoryService';

describe('CategoryService', () => {
    let service: CategoryService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            create: vi.fn(),
            findAll: vi.fn(),
            delete: vi.fn(),
        };
        service = new CategoryService(mockRepo);
    });

    it('should get all categories', async () => {
        mockRepo.findAll.mockResolvedValue([]);
        await service.getCategories();
        expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('should create a category with a random UUID', async () => {
        mockRepo.create.mockImplementation((data: any) => Promise.resolve(data));
        const catData: any = { name: 'Food', type: 'expense', color: 'red' };
        const result = await service.createCategory(catData);
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Food');
        expect(mockRepo.create).toHaveBeenCalled();
    });

    it('should delete a category', async () => {
        mockRepo.delete.mockResolvedValue(undefined);
        await service.deleteCategory('123');
        expect(mockRepo.delete).toHaveBeenCalledWith('123');
    });
});
