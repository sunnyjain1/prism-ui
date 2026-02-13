/**
 * EncryptionService — Client-side PII encryption using Web Crypto API.
 * 
 * Uses AES-256-GCM for authenticated encryption.
 * Key derivation: PBKDF2 with 100,000 iterations from a user-provided Master Key.
 * 
 * Storage format for each encrypted field:
 *   "ENC:v1:" + base64(salt[16] + iv[12] + ciphertext + authTag[16])
 * 
 * The "ENC:v1:" prefix allows us to detect encrypted vs plaintext values.
 */

const ENCRYPTION_PREFIX = 'ENC:v1:';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100_000;
const KEY_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

export class EncryptionService {
    private cachedKey: CryptoKey | null = null;
    private cachedSalt: Uint8Array | null = null;
    private masterKeyHash: string | null = null;

    /**
     * Derive a CryptoKey from a master password and salt.
     */
    private async deriveKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(masterKey),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt as BufferSource,
                iterations: PBKDF2_ITERATIONS,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: KEY_ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Initialize encryption with a master key.
     * Generates a new salt on first use, reuses it for the session.
     */
    async init(masterKey: string): Promise<void> {
        // Generate a persistent salt per user (stored in localStorage)
        let saltB64 = localStorage.getItem('encryption_salt');
        if (!saltB64) {
            const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
            saltB64 = this.toBase64(salt);
            localStorage.setItem('encryption_salt', saltB64);
        }
        this.cachedSalt = this.fromBase64(saltB64);
        this.cachedKey = await this.deriveKey(masterKey, this.cachedSalt);

        // Store a hash of the master key for verification
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(masterKey));
        this.masterKeyHash = this.toBase64(new Uint8Array(hashBuffer));
        sessionStorage.setItem('master_key_hash', this.masterKeyHash);
    }

    /**
     * Check if encryption is currently active (key is loaded in memory).
     */
    isActive(): boolean {
        return this.cachedKey !== null;
    }

    /**
     * Check if a value appears to be encrypted.
     */
    isEncrypted(value: string): boolean {
        return value.startsWith(ENCRYPTION_PREFIX);
    }

    /**
     * Encrypt a plaintext string. Returns prefixed base64 string.
     */
    async encrypt(plaintext: string): Promise<string> {
        if (!this.cachedKey) {
            throw new Error('Encryption not initialized. Call init() first.');
        }

        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        const ciphertext = await crypto.subtle.encrypt(
            { name: KEY_ALGORITHM, iv },
            this.cachedKey,
            encoder.encode(plaintext)
        );

        // Combine iv + ciphertext into single buffer
        const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), IV_LENGTH);

        return ENCRYPTION_PREFIX + this.toBase64(combined);
    }

    /**
     * Decrypt a previously encrypted value. Returns plaintext.
     * If the value is not encrypted (no prefix), returns it as-is.
     */
    async decrypt(value: string): Promise<string> {
        if (!value || !this.isEncrypted(value)) {
            return value; // Not encrypted, return as-is
        }

        if (!this.cachedKey) {
            throw new Error('Encryption not initialized. Call init() first.');
        }

        try {
            const raw = value.slice(ENCRYPTION_PREFIX.length);
            const combined = this.fromBase64(raw);

            const iv = combined.slice(0, IV_LENGTH);
            const ciphertext = combined.slice(IV_LENGTH);

            const decrypted = await crypto.subtle.decrypt(
                { name: KEY_ALGORITHM, iv },
                this.cachedKey,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch {
            console.warn('Failed to decrypt value — wrong key or corrupted data');
            return '[Encrypted]';
        }
    }

    /**
     * Encrypt specific PII fields in a transaction-like object.
     * Only encrypts if encryption is active.
     */
    async encryptPII<T extends Record<string, any>>(
        obj: T,
        fields: string[]
    ): Promise<T> {
        if (!this.isActive()) return obj;

        const result = { ...obj };
        for (const field of fields) {
            if (result[field] && typeof result[field] === 'string') {
                (result as any)[field] = await this.encrypt(result[field]);
            }
        }
        return result;
    }

    /**
     * Decrypt specific PII fields in a transaction-like object.
     * Handles both encrypted and plaintext values gracefully.
     */
    async decryptPII<T extends Record<string, any>>(
        obj: T,
        fields: string[]
    ): Promise<T> {
        if (!this.isActive()) return obj;

        const result = { ...obj };
        for (const field of fields) {
            if (result[field] && typeof result[field] === 'string') {
                (result as any)[field] = await this.decrypt(result[field]);
            }
        }
        return result;
    }

    /**
     * Batch decrypt an array of objects.
     */
    async decryptBatch<T extends Record<string, any>>(
        items: T[],
        fields: string[]
    ): Promise<T[]> {
        if (!this.isActive()) return items;
        return Promise.all(items.map(item => this.decryptPII(item, fields)));
    }

    /**
     * Clear the cached key from memory.
     */
    lock(): void {
        this.cachedKey = null;
        this.masterKeyHash = null;
        sessionStorage.removeItem('master_key_hash');
    }

    // --- Utility ---

    private toBase64(buffer: Uint8Array): string {
        return btoa(String.fromCharCode(...buffer));
    }

    private fromBase64(b64: string): Uint8Array {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}

// Singleton instance
export const encryptionService = new EncryptionService();
