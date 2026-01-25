import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionService, accountService } from '../lib/services/context';
import type { Transaction, Account } from '../lib/core/models';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils/formatters';

const AccountDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Account Info (only if not loaded or just refresh)
                const accounts = await accountService.getAccounts();
                const acc = accounts.find(a => a.id === id);
                setAccount(acc || null);

                // Fetch Transactions for current month
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();

                const txs = await transactionService.getTransactions({
                    account_id: id,
                    month,
                    year
                });
                setTransactions(txs);
            } catch (e) {
                console.error('Failed to load account details', e);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const handleUpdate = () => loadData();
        window.addEventListener('transaction-added', handleUpdate);
        return () => window.removeEventListener('transaction-added', handleUpdate);
    }, [id, currentDate]); // re-fetch when date changes

    const handleAddTransaction = () => {
        window.dispatchEvent(new CustomEvent('open-transaction-dialog', {
            detail: { accountId: id }
        }));
    };

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const currentMonthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (loading && !account) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Loading...</div>;
    }

    if (!account) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Account not found</div>;
    }

    return (
        <div className="account-details" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ marginBottom: '24px', flexShrink: 0 }}>
                <button
                    onClick={() => navigate('/accounts')}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}
                >
                    <ArrowLeft size={16} /> Back to Accounts
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            {account.type} Account
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                            {account.name}
                        </h1>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: account.balance < 0 ? 'var(--expense)' : 'var(--text-main)' }}>
                            {formatCurrency(account.balance, account.currency)}
                        </div>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleAddTransaction}
                        style={{ padding: '10px 20px', borderRadius: '10px', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> Add Transaction
                    </button>
                </div>
            </header>

            {/* Month Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Transactions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-main)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ fontWeight: '600', minWidth: '120px', textAlign: 'center' }}>
                        {currentMonthLabel}
                    </span>
                    <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-main)' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Transactions List (Flat for Month) */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        No transactions found for {currentMonthLabel}.
                    </div>
                ) : (
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        {transactions.map((tx, index) => (
                            <div
                                key={tx.id}
                                style={{
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    borderBottom: index < transactions.length - 1 ? '1px solid var(--border)' : 'none'
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: tx.type === 'income' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{tx.description || 'Untitled Transaction'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {tx.category?.name && (
                                            <span style={{
                                                background: tx.category.color + '20', color: tx.category.color,
                                                padding: '2px 6px', borderRadius: '4px'
                                            }}>
                                                {tx.category.name}
                                            </span>
                                        )}
                                        <span>{formatDate(tx.date)}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '600', color: tx.type === 'income' ? 'var(--income)' : 'var(--text-main)' }}>
                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount, account.currency)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountDetails;
