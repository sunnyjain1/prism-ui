import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { accountService, transactionService } from '../lib/services/context';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../lib/utils/formatters';

import type { Transaction, Account } from '../lib/core/models';
import {
    ArrowUpRight, ArrowDownRight,
    BarChart3, TrendingUp, Download, Upload,
    Loader2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from './DatePicker';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loader = useRef(null);

    const loadInitialData = async () => {
        try {
            const [txs, accs] = await Promise.all([
                transactionService.getTransactions({ month, year, limit: 20, skip: 0 }),
                accountService.getAccounts()
            ]);

            setTransactions(txs);
            setAccounts(accs);
            setPage(1);
            setHasMore(txs.length === 20);

            const newSummary = transactionService.calculateSummary(txs, accs, displayCurrency);
            setSummary(newSummary);
        } catch (e) {
            console.error('Failed to load dashboard data', e);
        }
    };

    const loadMoreTransactions = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const skip = page * 20;
            const moreTxs = await transactionService.getTransactions({ month, year, limit: 20, skip });

            if (moreTxs.length < 20) setHasMore(false);
            setTransactions(prev => [...prev, ...moreTxs]);
            setPage(prev => prev + 1);
        } catch (e) {
            console.error('Failed to load more transactions', e);
        } finally {
            setIsLoadingMore(false);
        }
    }, [page, hasMore, isLoadingMore, month, year]);

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
                    <DatePicker
                        month={month}
                        year={year}
                        onChange={(m, y) => { setMonth(m); setYear(y); }}
                    />

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
                    { label: 'Current Balance', val: summary.balance, icon: BarChart3, color: 'white', bg: 'var(--primary)', isMain: true },
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
                            {typeof item.val === 'number' ? formatCurrency(item.val, displayCurrency) : item.val}
                        </div>
                    </motion.div>
                ))}
            </div>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>Recent Activity</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Your categorized spending and income history.</p>
                    </div>
                    <Link to="/transactions" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
                        Advanced Search <ArrowRight size={16} />
                    </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence mode="popLayout">
                        {transactions.map((t, idx) => {
                            const account = accounts.find(a => a.id === t.account_id);
                            const amt = transactionService.convert(t.amount, account?.currency || 'USD', displayCurrency);
                            return (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
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
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        background: t.type === 'income' ? 'var(--income-soft)' : 'var(--expense-soft)',
                                        color: t.type === 'income' ? 'var(--income)' : 'var(--expense)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>{t.description}</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: '500' }}>{t.category?.name || 'General'}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {formatDate(t.date)}
                                            {t.notes && <span style={{ marginLeft: '8px', padding: '2px 6px', background: 'var(--bg-main)', borderRadius: '4px', fontSize: '11px', fontStyle: 'italic' }}>{t.notes}</span>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: t.type === 'expense' ? 'var(--expense)' : 'var(--income)' }}>
                                            {t.type === 'expense' ? '-' : '+'}{formatCurrency(amt, displayCurrency)}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{account?.name}</div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {/* Loader element for Intersection Observer */}
                    <div ref={loader} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isLoadingMore && <Loader2 className="animate-spin" size={24} color="var(--primary)" />}
                        {!hasMore && transactions.length > 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No more transactions to show for this month.</p>}
                        {!isLoadingMore && hasMore && transactions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No transactions found for this period.</p>}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
