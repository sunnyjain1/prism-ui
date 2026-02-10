import type { IRepository, Entity } from '../core/interfaces';

export class RemoteRepository<T extends Entity> implements IRepository<T> {
    private baseUrl: string;
    private endpoint: string;

    constructor(baseUrl: string, endpoint: string) {
        this.baseUrl = baseUrl;
        this.endpoint = endpoint;
    }

    public get url() {
        return `${this.baseUrl}/${this.endpoint}`;
    }

    public getHeaders() {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async handleResponse(response: Response) {
        if (response.status === 401) {
            console.error('Session expired (401). Triggering logout.');
            window.dispatchEvent(new CustomEvent('unauthorized'));
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || 'Request failed');
        }
        return response.json();
    }

    async create(item: T): Promise<T> {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(item),
        });

        return this.handleResponse(response);
    }

    async findAll(params?: any): Promise<T[]> {
        let queryString = '';
        if (params) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v));
                } else if (value !== undefined && value !== null) {
                    searchParams.append(key, value);
                }
            });
            queryString = '?' + searchParams.toString();
        }

        const response = await fetch(`${this.url}${queryString}`, {
            headers: this.getHeaders()
        });

        return this.handleResponse(response);
    }

    async findById(id: string): Promise<T | null> {
        const response = await fetch(`${this.url}/${id}`, {
            headers: this.getHeaders()
        });

        if (response.status === 404) return null;
        return this.handleResponse(response);
    }

    async update(id: string, item: Partial<T>): Promise<T> {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(item),
        });

        return this.handleResponse(response);
    }

    async delete(id: string): Promise<void> {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('unauthorized'));
            throw new Error('Unauthorized');
        }
        if (!response.ok) throw new Error('Failed to delete item');
    }
}
