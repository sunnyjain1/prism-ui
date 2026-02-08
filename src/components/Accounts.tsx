import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../lib/services/context';
import type { Account } from '../lib/core/models';
import { CreditCard, Landmark, Banknote, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const Accounts: React.FC = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<Account['type']>('checking');
    const [newCurrency, setNewCurrency] = useState('USD');
    const [limit, setLimit] = useState('');
    const { user } = useAuth();


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
            setLimit('');
            setIsAdding(false);
            loadAccounts();
        } catch (e) {
            console.error('Failed to create account', e);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete the account "${name}"? This will also affect associated transactions.`)) {
            try {
                await accountService.deleteAccount(id);
                loadAccounts();
            } catch (e) {
                console.error('Failed to delete account', e);
            }
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
            case 'USD': return '$'; case 'EUR': return '€'; case 'GBP': return '£';
            case 'INR': return '₹'; case 'JPY': return '¥'; default: return code + ' ';
        }
    };

    return (
        <div className="accounts">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>My Accounts</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your bank accounts, credit cards, and cash.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsAdding(true)}
                    disabled={user?.role === 'viewer'}
                    style={{
                        opacity: user?.role === 'viewer' ? 0.6 : 1,
                        cursor: user?.role === 'viewer' ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Plus size={18} />
                    {user?.role === 'viewer' ? 'Read-Only' : 'Add Account'}
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
                                placeholder="e.g. Chase Sapphire"
                                style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Type</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit' }}
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
                                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit' }}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="JPY">JPY (¥)</option>
                                </select>
                            </div>
                        </div>

                        {newType === 'credit' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500' }}>Credit Limit</label>
                                <input
                                    type="number"
                                    value={limit}
                                    onChange={(e) => setLimit(e.target.value)}
                                    placeholder="5000"
                                    style={{ padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={user?.role === 'viewer'}
                            >Create Account</button>

                            <button type="button" className="btn" onClick={() => setIsAdding(false)} style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="accounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {accounts.map(account => {
                    const isCredit = account.type === 'credit';
                    // Mock Credit limit for UI demonstration since backend might not store it yet
                    const mockLimit = 10000;
                    const spentPercent = isCredit ? Math.min(Math.abs(account.balance) / mockLimit * 100, 100) : 0;

                    return (
                        <div
                            key={account.id}
                            className="card"
                            onClick={() => navigate(`/accounts/${account.id}`)}
                            style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--border)' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-main)', color: 'var(--primary)' }}>
                                    {getIcon(account.type)}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {account.type}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, account.id, account.name)}
                                        disabled={user?.role === 'viewer'}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--expense)',
                                            padding: '4px',
                                            cursor: user?.role === 'viewer' ? 'not-allowed' : 'pointer',
                                            opacity: user?.role === 'viewer' ? 0.3 : 0.6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                        title="Delete Account"
                                    >
                                        <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{account.name}</h3>
                                {account.type === 'credit' ? (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>**** **** **** {account.id.slice(-4)}</div>
                                ) : (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{account.currency} Account</div>
                                )}
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Balance</div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: account.balance < 0 && !isCredit ? 'var(--expense)' : 'var(--text-main)' }}>
                                    {getCurrencySymbol(account.currency)}{Math.abs(account.balance).toLocaleString()}
                                    {account.balance < 0 && !isCredit && <span style={{ fontSize: '14px', fontWeight: '500', marginLeft: '4px' }}>(Overdrawn)</span>}
                                </div>
                            </div>

                            {isCredit && (
                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Credit Utilization</span>
                                        <span style={{ fontWeight: '600' }}>{spentPercent.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${spentPercent}%`,
                                            background: spentPercent > 80 ? 'var(--expense)' : 'var(--income)',
                                            borderRadius: '3px',
                                            transition: 'width 0.5s ease-out'
                                        }}></div>
                                    </div>
                                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <span>Billing cycle ends soon</span>
                                    </div>
                                </div>
                            )}

                            {!isCredit && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <div style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'var(--bg-main)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>This Month</div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--income)' }}>
                                            {getCurrencySymbol(account.currency)}0
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'var(--bg-main)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Expenses</div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--expense)' }}>
                                            {getCurrencySymbol(account.currency)}0
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Accounts;
