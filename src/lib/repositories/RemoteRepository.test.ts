import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RemoteRepository } from './RemoteRepository';

describe('RemoteRepository', () => {
    let repo: RemoteRepository<any>;
    const baseUrl = 'http://api';
    const endpoint = 'items';

    beforeEach(() => {
        repo = new RemoteRepository(baseUrl, endpoint);
        vi.stubGlobal('localStorage', {
            getItem: vi.fn().mockReturnValue('fake-token'),
            setItem: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should construct the correct URL', () => {
        expect(repo.url).toBe(`${baseUrl}/${endpoint}`);
    });

    it('should generate headers with auth token', () => {
        const headers = repo.getHeaders();
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Authorization']).toBe('Bearer fake-token');
    });

    it('should handle successful create', async () => {
        const item = { name: 'test' };
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...item, id: '1' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await repo.create(item);
        expect(result.id).toBe('1');
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle unauthorized error (401)', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
        });
        vi.stubGlobal('fetch', mockFetch);
        const mockDispatch = vi.fn();
        vi.stubGlobal('dispatchEvent', mockDispatch);

        await expect(repo.findAll()).rejects.toThrow('Unauthorized');
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('should find account by id successfully', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: '123' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await repo.findById('123');
        expect(result?.id).toBe('123');
    });

    it('should handle 404 in findById', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await repo.findById('123');
        expect(result).toBeNull();
    });

    it('should handle generic error', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ detail: 'Server Error' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        await expect(repo.findAll()).rejects.toThrow('Server Error');
    });

    it('should handle update', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: '123', name: 'updated' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const result = await repo.update('123', { name: 'updated' });
        expect(result.name).toBe('updated');
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('123'), expect.objectContaining({ method: 'PUT' }));
    });

    it('should delete item', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 204,
        });
        vi.stubGlobal('fetch', mockFetch);

        await repo.delete('123');
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('123'), expect.objectContaining({ method: 'DELETE' }));
    });

    it('should handle unauthorized delete (401)', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
        });
        vi.stubGlobal('fetch', mockFetch);
        const mockDispatch = vi.fn();
        vi.stubGlobal('dispatchEvent', mockDispatch);

        await expect(repo.delete('123')).rejects.toThrow('Unauthorized');
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('should handle query params in findAll', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });
        vi.stubGlobal('fetch', mockFetch);

        await repo.findAll({ search: 'test', ids: [1, 2] });
        const callUrl = mockFetch.mock.calls[0][0];
        expect(callUrl).toContain('search=test');
        expect(callUrl).toContain('ids=1');
        expect(callUrl).toContain('ids=2');
    });
});
