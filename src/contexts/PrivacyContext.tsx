import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface PrivacyContextType {
    isPrivacyMode: boolean;
    togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
        const saved = localStorage.getItem('privacyMode');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('privacyMode', String(isPrivacyMode));
    }, [isPrivacyMode]);

    const togglePrivacyMode = () => {
        setIsPrivacyMode(!isPrivacyMode);
    };

    return (
        <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
            {children}
        </PrivacyContext.Provider>
    );
};

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
};
