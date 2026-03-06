/**
 * SyncService - API client for Gmail sync endpoints.
 */

const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/sync';

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function handleResponse(response: Response) {
    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('unauthorized'));
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }
    return response.json();
}

// --- Types ---

export interface SyncConfig {
    id: string;
    account_id: string;
    is_enabled: boolean;
    gmail_search_query: string;
    importer_key: string;
    sync_interval_days: number;
    attachment_filename_pattern: string | null;
    last_synced_at: string | null;
    last_sync_status: 'idle' | 'syncing' | 'success' | 'failed';
    last_sync_error: string | null;
    last_sync_txn_count: number;
}

export interface GmailStatus {
    is_connected: boolean;
    gmail_email: string | null;
}

export interface SyncResult {
    account_id: string;
    status: string;
    transactions_imported: number;
    duplicates_skipped?: number;
    error: string | null;
}

// --- Gmail Connection ---

export async function getGmailAuthUrl(): Promise<{ auth_url: string; state: string }> {
    const response = await fetch(`${API_URL}/gmail/auth-url`, { headers: getHeaders() });
    return handleResponse(response);
}

export async function postGmailCallback(code: string): Promise<{ message: string; email: string | null }> {
    const response = await fetch(`${API_URL}/gmail/callback`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code })
    });
    return handleResponse(response);
}

export async function getGmailStatus(): Promise<GmailStatus> {
    const response = await fetch(`${API_URL}/gmail/status`, { headers: getHeaders() });
    return handleResponse(response);
}

export async function disconnectGmail(): Promise<void> {
    const response = await fetch(`${API_URL}/gmail/disconnect`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
}

// --- Sync Config CRUD ---

export async function getSyncConfig(accountId: string): Promise<SyncConfig | null> {
    const response = await fetch(`${API_URL}/accounts/${accountId}/config`, { headers: getHeaders() });
    if (response.status === 404) return null;
    return handleResponse(response);
}

export async function createOrUpdateSyncConfig(
    accountId: string,
    config: {
        gmail_search_query: string;
        importer_key: string;
        sync_interval_days?: number;
        attachment_filename_pattern?: string;
        is_enabled?: boolean;
    }
): Promise<SyncConfig> {
    const response = await fetch(`${API_URL}/accounts/${accountId}/config`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config)
    });
    return handleResponse(response);
}

export async function updateSyncConfig(
    accountId: string,
    config: Partial<{
        gmail_search_query: string;
        importer_key: string;
        sync_interval_days: number;
        attachment_filename_pattern: string;
        is_enabled: boolean;
    }>
): Promise<SyncConfig> {
    const response = await fetch(`${API_URL}/accounts/${accountId}/config`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(config)
    });
    return handleResponse(response);
}

export async function deleteSyncConfig(accountId: string): Promise<void> {
    const response = await fetch(`${API_URL}/accounts/${accountId}/config`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
}

// --- Sync Trigger & Status ---

export async function triggerSync(accountId: string): Promise<SyncResult> {
    const response = await fetch(`${API_URL}/accounts/${accountId}/trigger`, {
        method: 'POST',
        headers: getHeaders()
    });
    return handleResponse(response);
}

export async function getAllSyncStatus(): Promise<SyncConfig[]> {
    const response = await fetch(`${API_URL}/accounts/status`, { headers: getHeaders() });
    return handleResponse(response);
}

export async function getAvailableImporters(): Promise<Record<string, string>[]> {
    const response = await fetch(`${API_URL}/importers`, { headers: getHeaders() });
    return handleResponse(response);
}
