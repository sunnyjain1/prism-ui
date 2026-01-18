import type { IRepository, Entity } from '../core/interfaces';

export class RemoteRepository<T extends Entity> implements IRepository<T> {
    private baseUrl: string;
    private endpoint: string;

    constructor(baseUrl: string, endpoint: string) {
        this.baseUrl = baseUrl;
        this.endpoint = endpoint;
    }

    private get url() {
        return `${this.baseUrl}/${this.endpoint}`;
    }

    async create(item: T): Promise<T> {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to create item');
        return response.json();
    }

    async findAll(params?: any): Promise<T[]> {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        const response = await fetch(`${this.url}${query}`);
        if (!response.ok) throw new Error('Failed to fetch items');
        return response.json();
    }

    async findById(id: string): Promise<T | null> {
        const response = await fetch(`${this.url}/${id}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to fetch item');
        return response.json();
    }

    async update(id: string, item: Partial<T>): Promise<T> {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to update item');
        return response.json();
    }

    async delete(id: string): Promise<void> {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete item');
    }
}
