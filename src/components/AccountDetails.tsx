import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionService, accountService } from '../lib/services/context';
import type { Transaction, Account } from '../lib/core/models';
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils/formatters';
import DatePicker from './DatePicker';
import TransactionDialog from './TransactionDialog';

const AccountDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const toggleDay = (date: string) => {
        setCollapsedDays(prev => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    };

    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const allAccounts = await accountService.getAccounts();
                setAccounts(allAccounts);
                const acc = allAccounts.find(a => a.id === id);
                setAccount(acc || null);

                const txs = await transactionService.getTransactions({
                    account_id: id,
                    month: startDate || endDate ? undefined : month,
                    year: startDate || endDate ? undefined : year,
                    start_date: startDate || undefined,
                    end_date: endDate || undefined
                });

                // Determine the start boundary of the viewed period
                let periodStartDate: string;
                if (startDate) {
                    periodStartDate = startDate;
                } else {
                    // Month/year view — first day of the month
                    periodStartDate = `${year}-${String(month).padStart(2, '0')}-01`;
                }

                // Fetch all transactions BEFORE the viewed period to compute opening balance
                // We use end_date = day before period start
                const dayBefore = new Date(periodStartDate);
                dayBefore.setDate(dayBefore.getDate() - 1);
                const dayBeforeStr = dayBefore.toISOString().split('T')[0];

                const priorTxs = await transactionService.getTransactions({
                    account_id: id,
                    end_date: dayBeforeStr,
                    limit: 100000
                });

                // Start from 0 and accumulate all prior transactions to get opening balance
                let openingBalance = 0;
                for (const ptx of priorTxs) {
                    if (ptx.type === 'income') {
                        openingBalance += ptx.amount;
                    } else if (ptx.type === 'expense') {
                        openingBalance -= ptx.amount;
                    } else if (ptx.type === 'transfer') {
                        if (ptx.account_id === id) openingBalance -= ptx.amount; // money left
                        else if (ptx.destination_account_id === id) openingBalance += ptx.amount; // money came in
                    }
                }

                // Walk through displayed transactions (oldest first) to compute running balance
                // API returns newest first, so reverse for forward accumulation, then reverse back
                const sorted = [...txs].reverse(); // oldest first
                let runBal = openingBalance;
                const balanceMap = new Map<string, number>();
                for (const tx of sorted) {
                    if (tx.type === 'income') {
                        runBal += tx.amount;
                    } else if (tx.type === 'expense') {
                        runBal -= tx.amount;
                    } else if (tx.type === 'transfer') {
                        if (tx.account_id === id) runBal -= tx.amount;
                        else if (tx.destination_account_id === id) runBal += tx.amount;
                    }
                    balanceMap.set(tx.id, runBal);
                }

                const txsWithBalance = txs.map(tx => ({
                    ...tx,
                    runningBalance: balanceMap.get(tx.id) || 0
                }));

                setTransactions(txsWithBalance as any);
            } catch (e) {
                console.error('Failed to load account details', e);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        const handleUpdate = () => loadData();
        const handleCurrency = (e: any) => setDisplayCurrency(e.detail);
        window.addEventListener('transaction-added', handleUpdate);
        window.addEventListener('currency-changed', handleCurrency);
        return () => {
            window.removeEventListener('transaction-added', handleUpdate);
            window.removeEventListener('currency-changed', handleCurrency);
        };
    }, [id, month, year, startDate, endDate, displayCurrency]); // re-fetch when date or currency changes

    const handleAddTransaction = () => {
        window.dispatchEvent(new CustomEvent('open-transaction-dialog', {
            detail: { accountId: id }
        }));
    };

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(y => y - 1);
        } else {
            setMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(y => y + 1);
        } else {
            setMonth(m => m + 1);
        }
    };

    const currentMonthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

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
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: '600', color: account.balance < 0 ? 'var(--expense)' : 'var(--text-main)' }}>
                                {formatCurrency(account.balance, account.currency)}
                            </div>
                            {account.currency !== displayCurrency && (
                                <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
                                    ≈ {formatCurrency(transactionService.convert(account.balance, account.currency, displayCurrency), displayCurrency)}
                                </div>
                            )}
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

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Transactions</h3>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Date Range Filter */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ padding: '6px 12px', border: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ padding: '6px 12px', border: 'none', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}
                        />
                        {(startDate || endDate) && (
                            <button
                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', cursor: 'pointer' }}
                                title="Clear date range"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border)' }}></div>

                    {/* Month/Year Picker with Quick Nav */}
                    <div style={{ opacity: (startDate || endDate) ? 0.4 : 1, pointerEvents: (startDate || endDate) ? 'none' : 'auto', transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <ChevronLeft size={20} />
                        </button>
                        <DatePicker
                            month={month}
                            year={year}
                            onChange={(m, y) => {
                                setMonth(m);
                                setYear(y);
                            }}
                        />
                        <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Monthly Summary & Grouped Transactions */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        No transactions found for {currentMonthLabel}.
                    </div>
                ) : (() => {
                    // Compute daily groups
                    const isIncoming = (tx: Transaction) => tx.type === 'income' || (tx.type === 'transfer' && tx.destination_account_id === id);
                    const isOutgoing = (tx: Transaction) => tx.type === 'expense' || (tx.type === 'transfer' && tx.account_id === id);

                    const dayMap = new Map<string, Transaction[]>();
                    for (const tx of transactions) {
                        const dayKey = new Date(tx.date).toDateString();
                        if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
                        dayMap.get(dayKey)!.push(tx);
                    }
                    const dailyGroups = Array.from(dayMap.entries()).map(([date, txs]) => {
                        let income = 0, expense = 0;
                        for (const tx of txs) {
                            if (isIncoming(tx)) income += tx.amount;
                            else if (isOutgoing(tx)) expense += tx.amount;
                        }
                        return { date, transactions: txs, income, expense };
                    });

                    // Monthly totals
                    const monthlyIncome = dailyGroups.reduce((s, g) => s + g.income, 0);
                    const monthlyExpense = dailyGroups.reduce((s, g) => s + g.expense, 0);
                    const monthlyNet = monthlyIncome - monthlyExpense;

                    return (
                        <>
                            {/* Monthly Summary Bar */}
                            <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                    {currentMonthLabel} • <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{transactions.length}</span> transactions
                                </div>
                                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: '700' }}>
                                    <span style={{ color: 'var(--income)' }}>+{formatCurrency(monthlyIncome, account.currency)}</span>
                                    <span style={{ color: 'var(--expense)' }}>-{formatCurrency(monthlyExpense, account.currency)}</span>
                                    <span style={{
                                        color: monthlyNet >= 0 ? 'var(--income)' : 'var(--expense)',
                                        borderLeft: '1px solid var(--border)', paddingLeft: '16px'
                                    }}>
                                        Net: {monthlyNet < 0 ? '-' : ''}{formatCurrency(Math.abs(monthlyNet), account.currency)}
                                    </span>
                                </div>
                            </div>

                            {/* Daily Groups */}
                            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {dailyGroups.map(group => (
                                    <div key={group.date}>
                                        {/* Day Header */}
                                        <div
                                            onClick={() => toggleDay(group.date)}
                                            style={{
                                                padding: '8px 12px',
                                                margin: '0 -12px 12px -12px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid var(--border-soft)',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.15s ease',
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <ChevronDown
                                                    size={16}
                                                    style={{
                                                        color: 'var(--text-muted)',
                                                        transition: 'transform 0.2s ease',
                                                        transform: collapsedDays.has(group.date) ? 'rotate(-90deg)' : 'rotate(0deg)'
                                                    }}
                                                />
                                                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                                                    {formatDate(group.transactions[0].date)}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                    ({group.transactions.length})
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '600' }}>
                                                {group.income > 0 && <span style={{ color: 'var(--income)' }}>+{formatCurrency(group.income, account.currency)}</span>}
                                                {group.expense > 0 && <span style={{ color: 'var(--expense)' }}>-{formatCurrency(group.expense, account.currency)}</span>}
                                            </div>
                                        </div>

                                        {/* Transaction Rows (collapsible) */}
                                        {!collapsedDays.has(group.date) && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {group.transactions.map(tx => {
                                                    const incoming = isIncoming(tx);
                                                    const srcAccount = accounts.find(a => a.id === tx.account_id);
                                                    const dstAccount = accounts.find(a => a.id === tx.destination_account_id);
                                                    return (
                                                        <div
                                                            key={tx.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '16px',
                                                                padding: '12px 16px',
                                                                borderRadius: '14px',
                                                                background: 'var(--bg-card)',
                                                                border: '1px solid var(--border-soft)',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s ease'
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-main)'}
                                                            onMouseOut={e => e.currentTarget.style.background = 'var(--bg-card)'}
                                                            onClick={() => setEditingTx(tx)}
                                                        >
                                                            {/* Icon */}
                                                            <div style={{
                                                                width: '44px', height: '44px', borderRadius: '12px',
                                                                background: tx.type === 'transfer' ? 'var(--bg-main)' : incoming ? 'var(--income-soft)' : 'var(--expense-soft)',
                                                                color: tx.type === 'transfer' ? (incoming ? 'var(--income)' : 'var(--expense)') : incoming ? 'var(--income)' : 'var(--expense)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                            }}>
                                                                {tx.type === 'transfer' ? <ArrowRightLeft size={22} /> : incoming ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                                                            </div>

                                                            {/* Details */}
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>{tx.description || 'Untitled'}</div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                    {tx.category?.name && (
                                                                        <span style={{ background: (tx.category.color || '#888') + '20', color: tx.category.color || '#888', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>
                                                                            {tx.category.name}
                                                                        </span>
                                                                    )}
                                                                    {tx.type === 'transfer' && (
                                                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                                                            {srcAccount?.name || '?'} → {dstAccount?.name || '?'}
                                                                        </span>
                                                                    )}
                                                                    {tx.notes && <span style={{ fontStyle: 'italic', fontSize: '11px', background: 'var(--bg-main)', padding: '1px 6px', borderRadius: '4px' }}>{tx.notes}</span>}
                                                                </div>
                                                            </div>

                                                            {/* Amount & Balance */}
                                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                <div style={{ fontSize: '16px', fontWeight: '700', color: incoming ? 'var(--income)' : 'var(--expense)' }}>
                                                                    {incoming ? '+' : '-'}{formatCurrency(tx.amount, account.currency)}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: (tx as any).runningBalance < 0 ? 'var(--expense)' : 'var(--text-muted)', marginTop: '2px' }}>
                                                                    Bal: {(tx as any).runningBalance < 0 ? '-' : ''}{formatCurrency(Math.abs((tx as any).runningBalance), account.currency)}
                                                                </div>
                                                                {account.currency !== displayCurrency && (
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                                        {incoming ? '+' : '-'}{formatCurrency(transactionService.convert(tx.amount, account.currency, displayCurrency), displayCurrency)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Edit Transaction Dialog */}
            {editingTx && (
                <TransactionDialog
                    transaction={editingTx}
                    onClose={() => {
                        setEditingTx(null);
                        // Trigger reload
                        window.dispatchEvent(new Event('transaction-added'));
                    }}
                />
            )}
        </div>
    );
};

export default AccountDetails;
