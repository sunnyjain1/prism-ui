import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService, transactionService } from '../lib/services/context';
import type { Account } from '../lib/core/models';
import { CreditCard, Landmark, Banknote, TrendingUp, Plus, Pencil, X, Trash2, RotateCcw, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePrivacy } from '../contexts/PrivacyContext';
import { formatCurrency } from '../lib/utils/formatters';


const Accounts: React.FC = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [deletedAccounts, setDeletedAccounts] = useState<Account[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<Account['type']>('checking');
    const [newCurrency, setNewCurrency] = useState('INR');
    const [limit, setLimit] = useState('');
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');
    const { user } = useAuth();

    // Edit dialog state
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<Account['type']>('checking');
    const [editCurrency, setEditCurrency] = useState('INR');
    const { isPrivacyMode } = usePrivacy();


    const loadAccounts = async () => {
        try {
            const [data, deleted] = await Promise.all([
                accountService.getAccounts(),
                accountService.getDeletedAccounts()
            ]);
            setAccounts(data);
            setDeletedAccounts(deleted);
        } catch (e) {
            console.error('Failed to load accounts', e);
        }
    };

    useEffect(() => {
        loadAccounts();
        const handleCurrency = (e: any) => setDisplayCurrency(e.detail);
        window.addEventListener('currency-changed', handleCurrency);
        return () => window.removeEventListener('currency-changed', handleCurrency);
    }, []);

    // Calculate Portfolio Stats
    const portfolioStats = React.useMemo(() => {
        let assets = 0;
        let liabilities = 0;

        accounts.forEach(acc => {
            const convertedBalance = transactionService.convert(acc.balance, acc.currency, displayCurrency);
            if (convertedBalance >= 0) {
                assets += convertedBalance;
            } else {
                liabilities += Math.abs(convertedBalance);
            }
        });

        return {
            netWorth: assets - liabilities,
            assets,
            liabilities,
            ratio: assets + liabilities === 0 ? 50 : (assets / (assets + liabilities)) * 100
        };
    }, [accounts, displayCurrency]);

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

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? (It will be moved to the deleted section)`)) return;
        try {
            await accountService.deleteAccount(id);
            setEditingAccount(null); // close edit dialog if open
            loadAccounts();
        } catch (e) {
            console.error('Failed to delete account', e);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await accountService.restoreAccount(id);
            loadAccounts();
        } catch (e) {
            console.error('Failed to restore account', e);
        }
    };

    const openEditDialog = (e: React.MouseEvent, account: Account) => {
        e.stopPropagation();
        setEditingAccount(account);
        setEditName(account.name);
        setEditType(account.type);
        setEditCurrency(account.currency);
    };

    const handleEditSave = async () => {
        if (!editingAccount || !editName) return;
        try {
            await accountService.updateAccount(editingAccount.id, { name: editName, type: editType, currency: editCurrency });
            setEditingAccount(null);
            loadAccounts();
        } catch (e) {
            console.error('Failed to update account', e);
        }
    };



    return (
        <div className="accounts">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>My Accounts</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your bank accounts, credit cards, and cash.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsAdding(true)}
                        disabled={user?.role === 'viewer'}
                        style={{
                            opacity: user?.role === 'viewer' ? 0.6 : 1,
                            cursor: user?.role === 'viewer' ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Plus size={18} />
                        {user?.role === 'viewer' ? 'Read-Only' : 'Add Account'}
                    </button>
                </div>

            </header>

            {/* Premium Portfolio Overview Card */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e1e2d 0%, #151521 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    marginBottom: '40px',
                    color: 'white',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'default'
                }}
            >
                {/* Decorative background elements */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '8px', fontWeight: '600' }}>
                        Total Net Worth
                    </div>
                    <div style={{ fontSize: '56px', fontWeight: '800', marginBottom: '32px', letterSpacing: '-0.02em', textShadow: portfolioStats.netWorth >= 0 ? '0 0 40px rgba(16,185,129,0.3)' : '0 0 40px rgba(239,68,68,0.3)' }}>
                        {isPrivacyMode ? '••••••' : formatCurrency(portfolioStats.netWorth, displayCurrency)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                                <Landmark size={16} color="#10b981" /> Assets
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                                {isPrivacyMode ? '••••••' : formatCurrency(portfolioStats.assets, displayCurrency)}
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                                <CreditCard size={16} color="#ef4444" /> Liabilities
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                                {isPrivacyMode ? '••••••' : formatCurrency(portfolioStats.liabilities, displayCurrency)}
                            </div>
                        </div>
                    </div>

                    {/* Visual Ratio Bar */}
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ height: '100%', width: `${portfolioStats.ratio}%`, background: '#10b981', transition: 'width 1s ease-in-out' }} />
                        <div style={{ height: '100%', width: `${100 - portfolioStats.ratio}%`, background: '#ef4444', transition: 'width 1s ease-in-out' }} />
                    </div>
                </div>
            </div>

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

            {(() => {
                // Group accounts by category
                const groups = [
                    { label: 'Bank Accounts', types: ['checking', 'savings'], icon: <Landmark size={20} />, color: '#6366f1' },
                    { label: 'Credit Cards', types: ['credit'], icon: <CreditCard size={20} />, color: '#f59e0b' },
                    { label: 'Investments', types: ['investment'], icon: <TrendingUp size={20} />, color: '#10b981' },
                    { label: 'Cash', types: ['cash'], icon: <Banknote size={20} />, color: '#8b5cf6' },
                ];

                return groups.map(group => {
                    const groupAccounts = accounts.filter(a => group.types.includes(a.type));
                    if (groupAccounts.length === 0) return null;

                    // Calculate group total in display currency
                    const groupTotal = groupAccounts.reduce((sum, a) =>
                        sum + transactionService.convert(a.balance, a.currency, displayCurrency), 0
                    );

                    return (
                        <div key={group.label} style={{ marginBottom: '32px' }}>
                            {/* Section Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', borderRadius: '10px', background: group.color + '15', color: group.color, display: 'flex' }}>
                                        {group.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{group.label}</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{groupAccounts.length} account{groupAccounts.length > 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: groupTotal < 0 ? 'var(--expense)' : 'var(--text-main)' }}>
                                        {isPrivacyMode ? '••••••' : `${groupTotal < 0 ? '-' : ''}${formatCurrency(Math.abs(groupTotal), displayCurrency)}`}
                                    </div>
                                </div>
                            </div>

                            {/* Account Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                                {groupAccounts.map(account => {
                                    const isCredit = account.type === 'credit';
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
                                                <div>
                                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '2px' }}>{account.name}</h3>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {isCredit ? `**** **** **** ${account.id.slice(-4)}` : `${account.currency} • ${account.type}`}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => openEditDialog(e, account)}
                                                    disabled={user?.role === 'viewer'}
                                                    style={{
                                                        background: 'var(--bg-main)', border: 'none', color: 'var(--text-muted)',
                                                        padding: '6px', cursor: user?.role === 'viewer' ? 'not-allowed' : 'pointer',
                                                        opacity: user?.role === 'viewer' ? 0.3 : 0.6, display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                                        borderRadius: '8px'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--border-soft)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'var(--bg-main)'; }}
                                                    title="Edit Account"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>

                                            <div style={{ marginTop: 'auto' }}>
                                                <div style={{ fontSize: '22px', fontWeight: '800', color: account.balance < 0 && !isCredit ? 'var(--expense)' : 'var(--text-main)' }}>
                                                    {isPrivacyMode ? '••••••' : formatCurrency(account.balance, account.currency)}
                                                    {!isPrivacyMode && account.balance < 0 && !isCredit && <span style={{ fontSize: '12px', fontWeight: '500', marginLeft: '4px' }}>(Overdrawn)</span>}
                                                </div>
                                                {account.currency !== displayCurrency && (
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {isPrivacyMode ? '≈ ••••••' : `≈ ${formatCurrency(transactionService.convert(account.balance, account.currency, displayCurrency), displayCurrency)}`}
                                                    </div>
                                                )}
                                            </div>

                                            {isCredit && (
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Credit Utilization</span>
                                                        <span style={{ fontWeight: '600' }}>{spentPercent.toFixed(0)}%</span>
                                                    </div>
                                                    <div style={{ height: '5px', background: 'var(--border-soft)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', width: `${spentPercent}%`,
                                                            background: spentPercent > 80 ? 'var(--expense)' : 'var(--income)',
                                                            borderRadius: '3px', transition: 'width 0.5s ease-out'
                                                        }}></div>
                                                    </div>
                                                </div>
                                            )}

                                            {!isCredit && (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'var(--bg-main)', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>This Month</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--income)' }}>
                                                            {isPrivacyMode ? '••••••' : formatCurrency(account.monthly_income, account.currency)}
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, padding: '8px', borderRadius: '10px', background: 'var(--bg-main)', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>Expenses</div>
                                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--expense)' }}>
                                                            {isPrivacyMode ? '••••••' : formatCurrency(account.monthly_expense, account.currency)}
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
                });
            })()}
            {/* Edit Account Dialog */}
            {editingAccount && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setEditingAccount(null)}
                >
                    <div
                        className="card"
                        onClick={e => e.stopPropagation()}
                        style={{ width: '420px', padding: '28px', borderRadius: '20px', boxShadow: 'var(--shadow-lg)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Edit Account</h3>
                            <button
                                onClick={() => setEditingAccount(null)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Account Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', fontSize: '14px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Type</label>
                                    <select
                                        value={editType}
                                        onChange={e => setEditType(e.target.value as any)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit', fontSize: '14px' }}
                                    >
                                        <option value="checking">Checking</option>
                                        <option value="savings">Savings</option>
                                        <option value="credit">Credit Card</option>
                                        <option value="investment">Investment</option>
                                        <option value="cash">Cash</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Currency</label>
                                    <select
                                        value={editCurrency}
                                        onChange={e => setEditCurrency(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit', fontSize: '14px' }}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="JPY">JPY (¥)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleEditSave}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}
                            >
                                Save Changes
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--expense)' }}>Delete Account</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>This action cannot be undone</div>
                                </div>
                                <button
                                    onClick={() => handleDelete(editingAccount.id, editingAccount.name)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--expense)',
                                        background: 'transparent', color: 'var(--expense)', fontSize: '13px', fontWeight: '600',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--expense)'; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--expense)'; }}
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deleted Accounts Section */}
            {deletedAccounts.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <button
                        onClick={() => setShowDeleted(!showDeleted)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none',
                            cursor: 'pointer', padding: '12px 0', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '600', width: '100%'
                        }}
                    >
                        <Trash2 size={18} />
                        Deleted Accounts ({deletedAccounts.length})
                        <ChevronDown size={16} style={{ transform: showDeleted ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', marginLeft: 'auto' }} />
                    </button>

                    {showDeleted && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '12px' }}>
                            {deletedAccounts.map(account => (
                                <div
                                    key={account.id}
                                    className="card"
                                    onClick={() => navigate(`/accounts/${account.id}`)}
                                    style={{
                                        opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '12px',
                                        cursor: 'pointer', border: '1px dashed var(--border)', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{account.name}</h3>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {account.currency} • {account.type}
                                                {(account as any).deleted_at && (
                                                    <span> • Deleted {new Date((account as any).deleted_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRestore(account.id); }}
                                            style={{
                                                background: 'var(--income-soft)', border: 'none', color: 'var(--income)',
                                                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--income)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--income-soft)'; e.currentTarget.style.color = 'var(--income)'; }}
                                            title="Restore Account"
                                        >
                                            <RotateCcw size={12} /> Restore
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-muted)' }}>
                                        {isPrivacyMode ? '••••••' : formatCurrency(account.balance, account.currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Accounts;
