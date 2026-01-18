import type { IRepository } from '../core/interfaces';
import type { Category } from '../core/models';

export class CategoryService {
    private repository: IRepository<Category>;

    constructor(repository: IRepository<Category>) {
        this.repository = repository;
    }

    async getCategories(): Promise<Category[]> {
        return this.repository.findAll();
    }

    async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
        return this.repository.create({
            ...category,
            id: crypto.randomUUID()
        } as Category);
    }

    async deleteCategory(id: string): Promise<void> {
        return this.repository.delete(id);
    }
}
