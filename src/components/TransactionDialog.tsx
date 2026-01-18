import React, { useState, useEffect } from 'react';
import { transactionService, accountService, categoryService } from '../lib/services/context';
import type { Account, Category } from '../lib/core/models';
import { X, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


interface Props {
    onClose: () => void;
}

const TransactionDialog: React.FC<Props> = ({ onClose }) => {
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { user } = useAuth();


    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        account_id: '',
        category_id: '',
        destination_account_id: ''
    });

    useEffect(() => {
        const loadData = async () => {
            const [accs, cats] = await Promise.all([
                accountService.getAccounts(),
                categoryService.getCategories()
            ]);
            setAccounts(accs);
            setCategories(cats);
            if (accs.length > 0) {
                setFormData(prev => ({ ...prev, account_id: accs[0].id }));
            }
        };
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        const amt = parseFloat(formData.amount);
        if (isNaN(amt) || amt <= 0) {
            alert('Please enter a valid positive amount');
            return;
        }

        if (type === 'transfer' && formData.account_id === formData.destination_account_id) {
            alert('Source and destination accounts must be different');
            return;
        }

        setLoading(true);
        try {
            await transactionService.addTransaction({
                amount: amt,
                type,
                description: formData.description || (type === 'transfer' ? 'Internal Transfer' : ''),
                date: new Date(formData.date).toISOString(),
                account_id: formData.account_id,
                category_id: type !== 'transfer' ? formData.category_id : undefined,
                destination_account_id: type === 'transfer' ? formData.destination_account_id : undefined,
            });

            setSuccess(true);
            window.dispatchEvent(new CustomEvent('transaction-added'));
            setTimeout(() => onClose(), 800);
        } catch (err) {
            console.error('Failed to add transaction:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
            <div className="card" style={{
                width: '100%', maxWidth: '480px', position: 'relative',
                padding: '32px', border: '1px solid var(--glass-border)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {success ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ color: 'var(--income)', marginBottom: '16px' }}><CheckCircle2 size={64} /></div>
                        <h2 style={{ marginBottom: '8px' }}>Transaction Saved!</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Your balances have been updated.</p>
                    </div>
                ) : (
                    <>
                        <button onClick={onClose} style={{
                            position: 'absolute', top: '24px', right: '24px',
                            background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                        }}><X size={20} /></button>

                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>New Transaction</h2>

                        <div className="glass" style={{ display: 'flex', gap: '4px', marginBottom: '28px', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            {(['expense', 'income', 'transfer'] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                                        background: type === t ? 'var(--primary)' : 'transparent',
                                        color: type === t ? 'white' : 'var(--text-muted)',
                                        fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Amount</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: 'var(--text-muted)' }}>$</span>
                                        <input
                                            type="number" step="0.01" value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            style={{ padding: '12px 12px 12px 28px', width: '100%', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'inherit', fontWeight: '700', fontSize: '18px' }}
                                            placeholder="0.00" required
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Date</label>
                                    <input
                                        type="date" value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'inherit', fontSize: '14px' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Description</label>
                                <input
                                    type="text" value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'inherit' }}
                                    placeholder={type === 'transfer' ? 'Internal Transfer' : 'What was this for?'}
                                />
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: type === 'transfer' ? 'column' : 'row',
                                gap: '16px',
                                background: type === 'transfer' ? 'var(--bg-main)' : 'transparent',
                                padding: type === 'transfer' ? '16px' : '0',
                                borderRadius: '16px'
                            }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{type === 'transfer' ? 'From Account' : 'Account'}</label>
                                    <select
                                        value={formData.account_id}
                                        onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit' }}
                                        required
                                    >
                                        <option value="" disabled>Select account</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                    </select>
                                </div>

                                {type === 'transfer' && (
                                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                        <ArrowRightLeft size={20} />
                                    </div>
                                )}

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{type === 'transfer' ? 'To Account' : 'Category'}</label>
                                    {type === 'transfer' ? (
                                        <select
                                            value={formData.destination_account_id}
                                            onChange={e => setFormData({ ...formData, destination_account_id: e.target.value })}
                                            style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit' }}
                                            required
                                        >
                                            <option value="" disabled>Select destination</option>
                                            {accounts.filter(a => a.id !== formData.account_id).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                                        </select>
                                    ) : (
                                        <select
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                            style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit' }}
                                            required
                                        >
                                            <option value="" disabled>Select category</option>
                                            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || user?.role === 'viewer'}
                                className="btn btn-primary"
                                style={{
                                    marginTop: '12px', padding: '16px', fontSize: '16px', borderRadius: '14px',
                                    opacity: user?.role === 'viewer' ? 0.6 : 1,
                                    cursor: user?.role === 'viewer' ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Processing...' : (user?.role === 'viewer' ? 'Read-Only Access' : `Save ${type === 'transfer' ? 'Transfer' : 'Transaction'}`)}
                            </button>

                        </form>
                    </>
                )}
            </div>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default TransactionDialog;
