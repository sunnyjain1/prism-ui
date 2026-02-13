import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { encryptionService } from '../lib/services/EncryptionService';

interface CryptoContextType {
    isUnlocked: boolean;
    isSetup: boolean;        // Whether user has set up encryption (salt exists)
    unlock: (masterKey: string) => Promise<boolean>;
    lock: () => void;
    encrypt: (plaintext: string) => Promise<string>;
    decrypt: (ciphertext: string) => Promise<string>;
    encryptPII: <T extends Record<string, any>>(obj: T, fields: string[]) => Promise<T>;
    decryptPII: <T extends Record<string, any>>(obj: T, fields: string[]) => Promise<T>;
    decryptBatch: <T extends Record<string, any>>(items: T[], fields: string[]) => Promise<T[]>;
}

const CryptoContext = createContext<CryptoContextType | null>(null);

export const CryptoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isSetup, setIsSetup] = useState(false);

    useEffect(() => {
        // Check if encryption has been set up (salt exists in localStorage)
        const salt = localStorage.getItem('encryption_salt');
        setIsSetup(!!salt);
    }, []);

    const unlock = useCallback(async (masterKey: string): Promise<boolean> => {
        try {
            await encryptionService.init(masterKey);
            setIsUnlocked(true);
            setIsSetup(true);
            return true;
        } catch (err) {
            console.error('Failed to unlock encryption:', err);
            return false;
        }
    }, []);

    const lock = useCallback(() => {
        encryptionService.lock();
        setIsUnlocked(false);
    }, []);

    const encrypt = useCallback(async (plaintext: string) => {
        return encryptionService.encrypt(plaintext);
    }, []);

    const decrypt = useCallback(async (ciphertext: string) => {
        return encryptionService.decrypt(ciphertext);
    }, []);

    const encryptPII = useCallback(async <T extends Record<string, any>>(obj: T, fields: string[]) => {
        return encryptionService.encryptPII(obj, fields);
    }, []);

    const decryptPII = useCallback(async <T extends Record<string, any>>(obj: T, fields: string[]) => {
        return encryptionService.decryptPII(obj, fields);
    }, []);

    const decryptBatch = useCallback(async <T extends Record<string, any>>(items: T[], fields: string[]) => {
        return encryptionService.decryptBatch(items, fields);
    }, []);

    return (
        <CryptoContext.Provider value={{
            isUnlocked,
            isSetup,
            unlock,
            lock,
            encrypt,
            decrypt,
            encryptPII,
            decryptPII,
            decryptBatch,
        }}>
            {children}
        </CryptoContext.Provider>
    );
};

export const useCrypto = (): CryptoContextType => {
    const ctx = useContext(CryptoContext);
    if (!ctx) {
        throw new Error('useCrypto must be used within a CryptoProvider');
    }
    return ctx;
};
