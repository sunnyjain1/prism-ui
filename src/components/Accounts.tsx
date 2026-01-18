import React, { useState, useEffect } from 'react';
import { accountService } from '../lib/services/context';
import type { Account } from '../lib/core/models';
import { CreditCard, Landmark, Banknote, TrendingUp, Plus } from 'lucide-react';

const Accounts: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<Account['type']>('checking');
    const [newCurrency, setNewCurrency] = useState('USD');

    const loadAccounts = async () => {
        try {
            const data = await accountService.getAccounts();
            setAccounts(data);
        } catch (e) {
            console.error('Failed to load accounts', e);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        try {
            await accountService.createAccount(newName, newType, newCurrency);
            setNewName('');
            setIsAdding(false);
            loadAccounts();
        } catch (e) {
            console.error('Failed to create account', e);
        }
    };

    const getIcon = (type: Account['type']) => {
        switch (type) {
            case 'credit': return <CreditCard size={20} />;
            case 'savings': return <Landmark size={20} />;
            case 'checking': return <Banknote size={20} />;
            case 'investment': return <TrendingUp size={20} />;
            default: return <Banknote size={20} />;
        }
    };

    const getCurrencySymbol = (code: string) => {
        switch (code) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            case 'JPY': return '¥';
            default: return code + ' ';
        }
    };

    return (
        <div className="accounts">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>My Accounts</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your bank accounts, credit cards, and cash.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                    <Plus size={18} />
                    Add Account
                </button>
            </header>

            {isAdding && (
                <div className="card" style={{ marginBottom: '32px', maxWidth: '500px' }}>
                    <h3 style={{ marginBottom: '16px' }}>New Account</h3>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Account Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. HDFC Savings"
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Type</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'inherit',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    <option value="checking">Checking</option>
                                    <option value="savings">Savings</option>
                                    <option value="credit">Credit Card</option>
                                    <option value="investment">Investment</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Currency</label>
                                <select
                                    value={newCurrency}
                                    onChange={(e) => setNewCurrency(e.target.value)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'inherit',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="JPY">JPY (¥)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-primary">Create Account</button>
                            <button type="button" className="btn" onClick={() => setIsAdding(false)} style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="accounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {accounts.map(account => (
                    <div key={account.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            padding: '16px',
                            color: 'var(--text-muted)',
                            opacity: 0.2
                        }}>
                            {getIcon(account.type)}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ textTransform: 'capitalize' }}>{account.type}</span>
                            <span>{account.currency}</span>
                        </div>
                        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>{account.name}</h3>
                        <div style={{ fontSize: '28px', fontWeight: '700' }}>
                            {getCurrencySymbol(account.currency)}{account.balance.toLocaleString()}
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                            <button className="btn" style={{ fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border)' }}>View details</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Accounts;
