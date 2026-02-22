import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { accountService, transactionService } from '../lib/services/context';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils/formatters';
import TransactionDialog from './TransactionDialog';

import type { Transaction, Account } from '../lib/core/models';
import {
    ArrowUpRight, ArrowDownRight, ArrowRightLeft,
    BarChart3, TrendingUp, Download, Upload,
    Loader2, ArrowRight, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from './DatePicker';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [fullTxs, setFullTxs] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loader = useRef(null);
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

    const toggleDay = (date: string) => {
        setCollapsedDays(prev => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    };

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const loadInitialData = async () => {
        try {
            const [rawSummary, allTxs, accs] = await Promise.all([
                transactionService.getRawSummary(month, year),
                transactionService.getTransactionsByMonth(month, year),
                accountService.getAccounts()
            ]);

            setFullTxs(allTxs);
            setTransactions(allTxs.slice(0, 20));
            setAccounts(accs);
            setPage(1);
            setHasMore(allTxs.length > 20);

            const newSummary = transactionService.calculateSummaryFromRaw(rawSummary, displayCurrency);
            setSummary(newSummary);
        } catch (e) {
            console.error('Failed to load dashboard data', e);
        }
    };

    const loadMoreTransactions = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextBatch = fullTxs.slice(page * 20, (page + 1) * 20);
            if (nextBatch.length > 0) {
                setTransactions(prev => [...prev, ...nextBatch]);
                setPage(prev => prev + 1);
            }
            if ((page + 1) * 20 >= fullTxs.length) {
                setHasMore(false);
            }
        } catch (e) {
            console.error('Failed to load more transactions', e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [page, hasMore, isLoadingMore, fullTxs]);

    useEffect(() => {
        const option = {
            root: null,
            rootMargin: "20px",
            threshold: 1.0
        };
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMoreTransactions();
            }
        }, option);
        if (loader.current) observer.observe(loader.current);
        return () => observer.disconnect();
    }, [loadMoreTransactions]);

    const handleExport = async () => {
        try {
            await transactionService.exportTransactions();
        } catch (e) {
            console.error('Export failed', e);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await transactionService.importTransactions(file);
            loadInitialData();
        } catch (e) {
            console.error('Import failed', e);
        }
    };

    useEffect(() => {
        const handleCurrencyChange = (e: CustomEvent) => setDisplayCurrency(e.detail);
        window.addEventListener('currency-changed', handleCurrencyChange as EventListener);
        return () => window.removeEventListener('currency-changed', handleCurrencyChange as EventListener);
    }, []);

    useEffect(() => {
        loadInitialData();
        window.addEventListener('transaction-added', loadInitialData);
        return () => window.removeEventListener('transaction-added', loadInitialData);
    }, [month, year, displayCurrency]);

    // Update summary when currency or accounts change, but basis remains the current month's known transactions
    // Actually, summary should be for the WHOLE month, not just first 20.
    // Let's ensure calculateSummary uses the full month's data.
    // Optimization: we could have a specific summary endpoint. For now, it calculates on current visible + any more loaded.
    // But since it's "Month Summary", we should ideally fetch the totals once.
    // But since it's "Month Summary", we should ideally fetch the totals once.
    // Optimization: we could have a specific summary endpoint. For now, it calculates on current visible + any more loaded.


    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    // Group transactions by date and calculate daily aggregates (using FULL mesh data for accuracy)
    const dailyData = fullTxs.reduce((groups: any[], t) => {
        const dateStr = new Date(t.date).toDateString();
        let group = groups.find(g => g.date === dateStr);

        const account = accounts.find(a => a.id === t.account_id);
        const amt = transactionService.convert(t.amount, account?.currency || 'INR', displayCurrency);

        if (!group) {
            group = { date: dateStr, transactions: [], income: 0, expense: 0, other: 0 };
            groups.push(group);
        }

        // Only include in 'transactions' property of group if we want all transactions in group
        // But the Daily Activity list below uses the paginated 'transactions' state for performance.
        // However, the group headers (sticky) should use the full summary.
        group.transactions.push({ ...t, convertedAmount: amt });
        if (t.type === 'income') group.income += amt;
        else if (t.type === 'expense') group.expense += amt;
        else group.other += amt;

        return groups;
    }, []);

    // Calculate Weekly Aggregates
    const weeklyData = dailyData.reduce((weeks: any[], day) => {
        const date = new Date(day.date);
        const dayOfMonth = date.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);

        let week = weeks.find(w => w.weekNum === weekNum);
        if (!week) {
            const startDay = (weekNum - 1) * 7 + 1;
            const endDay = Math.min(new Date(year, month, 0).getDate(), weekNum * 7);
            week = {
                weekNum,
                range: `${month}/${startDay} - ${month}/${endDay}`,
                income: 0,
                expense: 0,
                transactionCount: 0
            };
            weeks.push(week);
        }

        week.income += day.income;
        week.expense += day.expense;
        week.transactionCount += day.transactions.length;

        return weeks;
    }, []).sort((a: any, b: any) => b.weekNum - a.weekNum);

    // Calculate Calendar Data (Monthly)
    const renderCalendar = () => {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const calendarDays = [];

        for (let i = 0; i < firstDay; i++) {
            calendarDays.push({ padding: true });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(year, month - 1, d).toDateString();
            const dayInfo = dailyData.find(g => g.date === dateStr) || { income: 0, expense: 0 };
            calendarDays.push({
                day: d,
                ...dayInfo,
                padding: false
            });
        }

        return calendarDays;
    };

    return (
        <div className="dashboard">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '4px', color: 'var(--text-main)' }}>
                        Dashboard
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Welcome back, <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{user?.full_name?.split(' ')[0]}</span></p>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: '12px',
                        padding: '4px',
                        gap: '2px'
                    }}>
                        {(['daily', 'weekly', 'monthly'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setViewMode(m)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: viewMode === m ? 'var(--primary)' : 'transparent',
                                    color: viewMode === m ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                            onClick={handlePrevMonth}
                            style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <DatePicker
                            month={month}
                            year={year}
                            onChange={(m, y) => { setMonth(m); setYear(y); }}
                        />
                        <button
                            onClick={handleNextMonth}
                            style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-muted)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn" onClick={handleExport} style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)' }} title="Export CSV">
                            <Download size={18} />
                        </button>
                        <label className="btn" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Import CSV">
                            <Upload size={18} />
                            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>
            </header>

            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Total Income', val: summary.income, icon: ArrowUpRight, color: 'var(--income)', bg: 'var(--income-soft)' },
                    { label: 'Total Expenses', val: summary.expense, icon: ArrowDownRight, color: 'var(--expense)', bg: 'var(--expense-soft)' },
                    { label: 'Savings Rate', val: summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' },
                    { label: 'Total Balance', val: summary.balance, icon: BarChart3, color: 'white', bg: 'var(--primary)', isMain: true },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card"
                        style={{
                            background: item.isMain ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)',
                            color: item.isMain ? 'white' : 'inherit',
                            border: item.isMain ? 'none' : '1px solid var(--border-soft)',
                            boxShadow: item.isMain ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : 'var(--shadow-sm)',
                            cursor: 'default'
                        }}
                        whileHover={{ y: -5, boxShadow: item.isMain ? '0 15px 30px -5px rgba(99, 102, 241, 0.5)' : 'var(--shadow)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', opacity: item.isMain ? 0.9 : 1, color: item.isMain ? 'white' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{item.label}</span>
                            <div style={{ background: item.bg, color: item.color, padding: '8px', borderRadius: '10px' }}>
                                <item.icon size={16} />
                            </div>
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                            {typeof item.val === 'number' ? ((item.val < 0 ? '-' : '') + formatCurrency(item.val, displayCurrency)) : item.val}
                        </div>
                    </motion.div>
                ))}
            </div>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                            {viewMode === 'daily' ? 'Recent Activity' : viewMode === 'weekly' ? 'Weekly Summaries' : 'Monthly Highlights'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            {viewMode === 'daily' ? 'Your categorized spending and income history.' :
                                viewMode === 'weekly' ? 'Aggregated financial performance by week.' :
                                    'Daily aggregates visualised on a calendar.'}
                        </p>
                    </div>
                    <Link to="/transactions" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
                        Advanced Search <ArrowRight size={16} />
                    </Link>
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-soft)', padding: '24px', minHeight: '400px' }}>
                    <AnimatePresence mode="wait">
                        {viewMode === 'daily' && (
                            <motion.div
                                key="daily"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >
                                {fullTxs.length > 0 && dailyData.map((group, gIdx) => (
                                    <div key={group.date}>
                                        <div
                                            onClick={() => toggleDay(group.date)}
                                            style={{
                                                padding: '8px 16px',
                                                margin: '0 -16px 12px -16px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid var(--border-soft)',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'background 0.15s ease',
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
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
                                                    {formatDate(group.date)}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                    ({group.transactions.length})
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '600' }}>
                                                {group.income > 0 && <span style={{ color: 'var(--income)' }}>+{formatCurrency(group.income, displayCurrency)}</span>}
                                                {group.expense > 0 && <span style={{ color: 'var(--expense)' }}>-{formatCurrency(group.expense, displayCurrency)}</span>}
                                                {group.other > 0 && <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(group.other, displayCurrency)}</span>}
                                            </div>
                                        </div>
                                        <AnimatePresence initial={false}>
                                            {!collapsedDays.has(group.date) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {transactions.filter(t => new Date(t.date).toDateString() === group.date).map((t: any, idx: number) => {
                                                            const account = accounts.find(a => a.id === t.account_id);
                                                            const convertedAmt = transactionService.convert(t.amount, account?.currency || 'INR', displayCurrency);
                                                            return (
                                                                <motion.div
                                                                    key={t.id}
                                                                    initial={{ opacity: 0, x: -20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    transition={{ duration: 0.2, delay: Math.min((gIdx * 5 + idx) * 0.05, 0.5) }}
                                                                    className="transaction-row"
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '20px',
                                                                        padding: '16px',
                                                                        borderRadius: '16px',
                                                                        background: 'var(--bg-card)',
                                                                        border: '1px solid var(--border-soft)',
                                                                        transition: 'background 0.2s ease',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    whileHover={{ background: 'var(--bg-main)', transform: 'translateZ(0)' }}
                                                                    onClick={() => setEditingTx(t)}
                                                                >
                                                                    <div style={{
                                                                        width: '48px', height: '48px', borderRadius: '14px',
                                                                        background: t.type === 'income' ? 'var(--income-soft)' : t.type === 'expense' ? 'var(--expense-soft)' : 'var(--bg-main)',
                                                                        color: t.type === 'income' ? 'var(--income)' : t.type === 'expense' ? 'var(--expense)' : 'var(--text-muted)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                                    }}>
                                                                        {t.type === 'income' ? <ArrowUpRight size={24} /> : t.type === 'expense' ? <ArrowDownRight size={24} /> : <ArrowRightLeft size={24} />}
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>{t.description}</div>
                                                                        <div style={{ color: 'var(--primary)', fontWeight: '500' }}>{t.category?.name || 'General'}</div>
                                                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                            {account?.name}
                                                                            {t.destination_account_id && (() => { const dest = accounts.find(a => a.id === t.destination_account_id); return dest ? <span> → {dest.name}</span> : null; })()}
                                                                            {t.notes && <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'var(--bg-main)', borderRadius: '4px', fontSize: '11px', fontStyle: 'italic' }}>{t.notes}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: t.type === 'expense' ? 'var(--expense)' : t.type === 'income' ? 'var(--income)' : 'var(--text-muted)' }}>
                                                                            {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}{formatCurrency(convertedAmt, displayCurrency)}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {viewMode === 'weekly' && (
                            <motion.div
                                key="weekly"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                            >
                                {weeklyData.map((week: any) => (
                                    <div key={week.weekNum} style={{
                                        padding: '20px',
                                        borderRadius: '16px',
                                        background: 'var(--bg-main)',
                                        border: '1px solid var(--border-soft)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Week {week.weekNum}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{week.range} • {week.transactionCount} transactions</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--income)', marginBottom: '2px' }}>
                                                +{formatCurrency(week.income, displayCurrency)}
                                            </div>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--expense)' }}>
                                                -{formatCurrency(week.expense, displayCurrency)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {viewMode === 'monthly' && (
                            <motion.div
                                key="monthly"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-soft)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} style={{ background: 'var(--bg-main)', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {d}
                                        </div>
                                    ))}
                                    {renderCalendar().map((day, i) => (
                                        <div key={i} style={{
                                            background: 'var(--bg-card)',
                                            minHeight: '100px',
                                            padding: '8px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            opacity: day.padding ? 0.3 : 1
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{day.day}</div>
                                            {!day.padding && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                                                    {day.income > 0 && <div style={{ color: 'var(--income)', fontSize: '11px', fontWeight: '800' }}>+{formatCurrency(day.income, displayCurrency)}</div>}
                                                    {day.expense > 0 && <div style={{ color: 'var(--expense)', fontSize: '11px', fontWeight: '800' }}>-{formatCurrency(day.expense, displayCurrency)}</div>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loader element for Intersection Observer */}
                    <div ref={loader} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isLoadingMore && <Loader2 className="animate-spin" size={24} color="var(--primary)" />}
                        {!hasMore && transactions.length > 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No more transactions to show for this month.</p>}
                        {!isLoadingMore && hasMore && transactions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No transactions found for this period.</p>}
                    </div>
                </div>
            </section>

            {editingTx && (
                <TransactionDialog
                    transaction={editingTx}
                    onClose={() => {
                        setEditingTx(null);
                        loadInitialData();
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
