import React, { useState } from 'react';
import { Sun, Moon, Globe, Shield, User, Download, Lock, Unlock, Key } from 'lucide-react';
import { transactionService } from '../lib/services/context';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';

const MasterKeySection: React.FC = () => {
    const { isUnlocked, isSetup, unlock, lock } = useCrypto();
    const [masterKey, setMasterKey] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleUnlock = async () => {
        if (!masterKey.trim()) return;
        setStatus('loading');
        const success = await unlock(masterKey);
        setStatus(success ? 'success' : 'error');
        if (success) setMasterKey('');
        setTimeout(() => setStatus('idle'), 2000);
    };

    if (isUnlocked) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Unlock size={16} color="var(--income)" /> Encryption Active
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            PII fields (descriptions, notes, account names) are being encrypted.
                        </div>
                    </div>
                    <button
                        onClick={lock}
                        className="btn"
                        style={{ border: '1px solid var(--border)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Lock size={14} /> Lock
                    </button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '8px' }}>
                    Your data is encrypted client-side. The server only sees ciphertext for sensitive fields.
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '600' }}>Master Key</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {isSetup
                        ? 'Enter your Master Key to decrypt your data for this session.'
                        : 'Set a Master Key to encrypt sensitive data (descriptions, notes, account names). This key never leaves your browser.'}
                </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="password"
                        placeholder={isSetup ? 'Enter Master Key...' : 'Choose a Master Key...'}
                        value={masterKey}
                        onChange={(e) => setMasterKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        style={{
                            width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px',
                            border: '1px solid var(--border)', background: 'var(--bg-main)',
                            color: 'var(--text-main)', fontSize: '14px'
                        }}
                    />
                </div>
                <button
                    onClick={handleUnlock}
                    disabled={!masterKey.trim() || status === 'loading'}
                    className="btn"
                    style={{
                        background: 'var(--primary)', color: 'white', padding: '10px 20px',
                        borderRadius: '10px', fontWeight: '600', opacity: masterKey.trim() ? 1 : 0.5
                    }}
                >
                    {status === 'loading' ? 'Unlocking...' : isSetup ? 'Unlock' : 'Enable'}
                </button>
            </div>
            {status === 'success' && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--income)' }}>✓ Encryption unlocked for this session.</div>
            )}
            {status === 'error' && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--expense)' }}>Failed to initialize encryption.</div>
            )}
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '8px' }}>
                ⚠️ If you lose your Master Key, encrypted text fields cannot be recovered. Amounts, dates, and categories remain accessible.
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');
    const [currency, setCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');

    const toggleTheme = () => {
        const newTheme = !darkMode ? 'dark' : 'light';
        setDarkMode(!darkMode);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleCurrencyChange = (newCur: string) => {
        setCurrency(newCur);
        localStorage.setItem('dashboardCurrency', newCur);
        // Dispatch event for other components to listen to if needed
        window.dispatchEvent(new CustomEvent('currency-changed', { detail: newCur }));
    };

    const handleExport = async () => {
        try {
            await transactionService.exportTransactions();
        } catch (e) {
            alert('Failed to export data');
        }
    };

    return (
        <div className="settings-page">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your preferences and personal data.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Profile Section */}
                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <User size={20} /> User Profile
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                            {user?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '18px' }}>{user?.full_name || 'User'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{user?.email || 'user@example.com'}</div>
                        </div>
                    </div>
                    <button className="btn" style={{ border: '1px solid var(--border)', fontSize: '13px' }}>Edit Profile</button>
                </section>

                {/* Appearance Section */}
                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sun size={20} /> Appearance
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Theme Preference</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Dark mode or light mode interface.</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="btn"
                            style={{
                                background: darkMode ? 'var(--primary)' : 'var(--bg-main)',
                                color: darkMode ? 'white' : 'var(--text-main)',
                                border: darkMode ? 'none' : '1px solid var(--border)',
                                padding: '8px 16px'
                            }}
                        >
                            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                            <span style={{ marginLeft: '8px' }}>{darkMode ? 'Dark' : 'Light'}</span>
                        </button>
                    </div>
                </section>

                {/* Localization Section */}
                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Globe size={20} /> Preference & Localization
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>Base Currency</div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Primary currency for dashboard metrics.</div>
                            </div>
                            <select
                                value={currency}
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                                style={{
                                    padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)',
                                    background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '14px'
                                }}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Language</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>English (US)</span>
                        </div>
                    </div>
                </section>

                {/* Data Section */}
                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Download size={20} /> Data Management
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Export All Data</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Download your transactions as CSV.</div>
                        </div>
                        <button onClick={handleExport} className="btn" style={{ border: '1px solid var(--border)' }}>
                            <Download size={16} /> <span style={{ marginLeft: '8px' }}>Export</span>
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Cloud Sync</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Synchronize data across devices.</div>
                        </div>
                        <span style={{ fontSize: '12px', background: 'var(--border-soft)', padding: '2px 8px', borderRadius: '4px' }}>Pro Only</span>
                    </div>
                </section>

                {/* Privacy & Encryption Section */}
                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={20} /> Privacy & Encryption
                    </h3>
                    <MasterKeySection />
                </section>
            </div>
        </div>
    );
};

export default Settings;
