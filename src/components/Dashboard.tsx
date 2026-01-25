import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { accountService, transactionService, categoryService } from '../lib/services/context';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getMonthName, formatDate } from '../lib/utils/formatters';

import type { Transaction, Account, Category } from '../lib/core/models';
import {
    ArrowUpRight, ArrowDownRight,
    BarChart3, TrendingUp, Filter, Download, Upload, ChevronDown,
    Search
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, Legend
} from 'recharts';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');

    // Filters (Charts)
    const [chartType, setChartType] = useState<'income' | 'expense'>('expense');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

    const loadData = async () => {
        try {
            const [txs, accs, cats, hist] = await Promise.all([
                transactionService.getTransactionsByMonth(month, year),
                accountService.getAccounts(),
                categoryService.getCategories(),
                transactionService.getHistory(6)
            ]);

            setTransactions(txs);
            setAccounts(accs);
            setCategories(cats);
            setHistory(hist);

            const newSummary = transactionService.calculateSummary(txs, accs, displayCurrency);
            setSummary(newSummary);
        } catch (e) {
            console.error('Failed to load dashboard data', e);
        }
    };

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
            loadData();
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
        loadData();
        window.addEventListener('transaction-added', loadData);
        return () => window.removeEventListener('transaction-added', loadData);
    }, [month, year]);

    useEffect(() => {
        const newSummary = transactionService.calculateSummary(transactions, accounts, displayCurrency);
        setSummary(newSummary);
    }, [displayCurrency, transactions, accounts]);

    // Chart Data Processing
    const trendData = useMemo(() => {
        let filtered = transactions.filter(t => t.type === chartType);
        if (selectedCategoryId !== 'all') {
            filtered = filtered.filter(t => t.category?.id === selectedCategoryId);
        }

        const dailyMap = new Map<string, number>();
        filtered.forEach(t => {
            const day = new Date(t.date).getDate().toString();
            const account = accounts.find(a => a.id === t.account_id);
            const amt = transactionService.convert(t.amount, account?.currency || 'USD', displayCurrency);
            dailyMap.set(day, (dailyMap.get(day) || 0) + amt);
        });

        const lastDay = new Date(year, month, 0).getDate();
        const result = [];
        for (let i = 1; i <= lastDay; i++) {
            const dayStr = i.toString();
            result.push({
                day: dayStr,
                amount: dailyMap.get(dayStr) || 0
            });
        }
        return result;
    }, [transactions, chartType, selectedCategoryId, displayCurrency, accounts, month, year]);

    const categoryData = useMemo(() => {
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((acc: any[], t) => {
                const catName = t.category?.name || 'General';
                const account = accounts.find(a => a.id === t.account_id);
                const convertedAmount = transactionService.convert(t.amount, account?.currency || 'USD', displayCurrency);

                const existing = acc.find(i => i.name === catName);
                if (existing) existing.value += convertedAmount;
                else acc.push({ name: catName, value: convertedAmount });
                return acc;
            }, [])
            .sort((a, b) => b.value - a.value);
    }, [transactions, displayCurrency, accounts]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="dashboard">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                        Hello, {user?.full_name?.split(' ')[0] || 'User'}!
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Here's your financial pulse for this month.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Link to="/transactions" style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                    }} title="Search Transactions">
                        <Search size={20} />
                    </Link>

                    <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px' }}>
                        <button onClick={() => { setMonth(month === 1 ? 12 : month - 1); if (month === 1) setYear(year - 1); }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>&lt;</button>
                        <span style={{ fontWeight: '600', minWidth: '140px', textAlign: 'center', fontSize: '14px' }}>
                            {getMonthName(month, year)}
                        </span>
                        <button onClick={() => { setMonth(month === 12 ? 1 : month + 1); if (month === 12) setYear(year + 1); }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>&gt;</button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn" onClick={handleExport} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }} title="Export CSV">
                            <Download size={18} />
                        </button>
                        <label className="btn" style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer' }} title="Import CSV">
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
                    { label: 'Net Balance', val: summary.balance, icon: BarChart3, color: 'white', bg: 'var(--primary)', isMain: true },
                ].map((item, i) => (
                    <div key={i} className="card" style={{
                        background: item.isMain ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : 'var(--bg-card)',
                        color: item.isMain ? 'white' : 'inherit',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', opacity: item.isMain ? 0.8 : 1, color: item.isMain ? 'white' : 'var(--text-muted)' }}>{item.label}</span>
                            <div style={{ background: item.bg, color: item.color, padding: '8px', borderRadius: '12px' }}>
                                <item.icon size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700' }}>
                            {typeof item.val === 'number' ? formatCurrency(item.val, displayCurrency) : item.val}
                        </div>
                    </div>
                ))}
            </div>

            <section className="card" style={{ marginBottom: '24px', padding: '24px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Monthly Trends (Last 6 Months)</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                formatter={(val: number) => formatCurrency(val, displayCurrency)}
                            />
                            <Legend />
                            <Bar dataKey="income" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Expense" fill="var(--expense)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <section className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={20} /> Cash Flow Trend
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="glass" style={{ padding: '4px', borderRadius: '10px', display: 'flex', gap: '2px' }}>
                                <button onClick={() => setChartType('expense')}
                                    style={{
                                        padding: '4px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        background: chartType === 'expense' ? 'var(--expense)' : 'transparent', color: chartType === 'expense' ? 'white' : 'var(--text-muted)'
                                    }}>Expense</button>
                                <button onClick={() => setChartType('income')}
                                    style={{
                                        padding: '4px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        background: chartType === 'income' ? 'var(--income)' : 'transparent', color: chartType === 'income' ? 'white' : 'var(--text-muted)'
                                    }}>Income</button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    style={{
                                        padding: '6px 32px 6px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '12px', fontWeight: '500',
                                        background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none'
                                    }}
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ height: '350px', padding: '24px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartType === 'expense' ? 'var(--expense)' : 'var(--income)'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={chartType === 'expense' ? 'var(--expense)' : 'var(--income)'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                    formatter={(val: any) => [formatCurrency(val as number, displayCurrency), chartType === 'expense' ? 'Expense' : 'Income']}
                                />
                                <Area type="monotone" dataKey="amount" stroke={chartType === 'expense' ? 'var(--expense)' : 'var(--income)'} strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="card">
                    <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Spending Mix</h3>
                    <div style={{ height: '240px' }}>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                        {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No data yet.</div>}
                    </div>
                    <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
                        {categoryData.slice(0, 4).map((item, index) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[index % COLORS.length] }}></div>
                                <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{item.name}</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{formatCurrency(item.value, displayCurrency)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>Recent Activity</h3>
                    <Link to="/transactions" className="btn" style={{ fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text-main)' }}>View All</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {transactions.slice(0, 5).map(t => {
                        const account = accounts.find(a => a.id === t.account_id);
                        const amt = transactionService.convert(t.amount, account?.currency || 'USD', displayCurrency);
                        return (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px', borderRadius: '16px', background: 'var(--bg-main)', transition: 'transform 0.2s' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '14px', background: t.type === 'income' ? 'var(--income-soft)' : 'var(--expense-soft)',
                                    color: t.type === 'income' ? 'var(--income)' : 'var(--expense)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {t.type === 'income' ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{t.description}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.category?.name || 'General'} • {formatDate(t.date)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', color: t.type === 'expense' ? 'var(--expense)' : 'var(--income)' }}>
                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(amt, displayCurrency)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{account?.name}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
