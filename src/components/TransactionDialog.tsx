import React, { useState, useEffect } from 'react';
import { transactionService, accountService, categoryService } from '../lib/services/context';
import type { Account, Category } from '../lib/core/models';
import { X } from 'lucide-react';

interface Props {
    onClose: () => void;
}

const TransactionDialog: React.FC<Props> = ({ onClose }) => {
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

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
        try {
            await transactionService.addTransaction({
                amount: parseFloat(formData.amount),
                type,
                description: formData.description,
                date: new Date(formData.date).toISOString(),
                account_id: formData.account_id,
                category_id: type !== 'transfer' ? formData.category_id : undefined,
                destination_account_id: type === 'transfer' ? formData.destination_account_id : undefined,
            });
            window.dispatchEvent(new CustomEvent('transaction-added'));
            onClose();
        } catch (err) {
            console.error('Failed to add transaction:', err);
        }
    };

    const filteredCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

    const getCurrencySymbol = (code: string | undefined) => {
        if (!code) return '$';
        switch (code) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'INR': return '₹';
            case 'JPY': return '¥';
            default: return code + ' ';
        }
    };

    const selectedAccount = accounts.find(a => a.id === formData.account_id);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                <button onClick={onClose} style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '24px' }}>Add Transaction</h2>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-main)', padding: '4px', borderRadius: '10px' }}>
                    {(['expense', 'income', 'transfer'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                border: 'none',
                                background: type === t ? 'var(--card-bg)' : 'transparent',
                                color: type === t ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: type === t ? '600' : '500',
                                boxShadow: type === t ? 'var(--shadow)' : 'none',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Amount</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                    pointerEvents: 'none'
                                }}>
                                    {getCurrencySymbol(selectedAccount?.currency)}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    style={{
                                        padding: '12px 12px 12px 32px',
                                        width: '100%',
                                        borderRadius: '10px',
                                        border: '1px solid var(--border)',
                                        background: 'transparent',
                                        color: 'inherit',
                                        fontFamily: 'inherit'
                                    }}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500' }}>Description</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            style={{
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'inherit',
                                fontFamily: 'inherit'
                            }}
                            placeholder="What was it for?"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500' }}>Source Account</label>
                        <select
                            value={formData.account_id}
                            onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                            style={{
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'inherit',
                                fontFamily: 'inherit'
                            }}
                            required
                        >
                            <option value="" disabled>Select account</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {type === 'transfer' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Destination Account</label>
                            <select
                                value={formData.destination_account_id}
                                onChange={e => setFormData({ ...formData, destination_account_id: e.target.value })}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                required
                            >
                                <option value="" disabled>Select destination</option>
                                {accounts.filter(a => a.id !== formData.account_id).map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>Category</label>
                            <select
                                value={formData.category_id}
                                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                required
                            >
                                <option value="" disabled>Select category</option>
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px' }}>
                        Save Transaction
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionDialog;
