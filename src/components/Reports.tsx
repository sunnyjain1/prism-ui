import React, { useState, useEffect, useMemo } from 'react';
import { transactionService, accountService } from '../lib/services/context';
import type { Transaction, Account } from '../lib/core/models';
import {
    TrendingUp, TrendingDown, Wallet
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const Reports: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
    const [month] = useState(new Date().getMonth() + 1);
    const [year] = useState(new Date().getFullYear());
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'USD');

    const loadData = async () => {
        try {
            const limit = timeRange === 'month' ? 200 : 1000;
            const [txs, accs] = await Promise.all([
                timeRange === 'month'
                    ? transactionService.getTransactionsByMonth(month, year)
                    : transactionService.getRecentTransactions(limit),
                accountService.getAccounts()
            ]);
            setTransactions(txs);
            setAccounts(accs);
        } catch (e) {
            console.error('Failed to load reports data', e);
        }
    };

    useEffect(() => {
        loadData();
        const handleCurrency = (e: any) => setDisplayCurrency(e.detail);
        window.addEventListener('currency-changed', handleCurrency);
        window.addEventListener('transaction-added', loadData);
        return () => {
            window.removeEventListener('currency-changed', handleCurrency);
            window.removeEventListener('transaction-added', loadData);
        };
    }, [month, year, timeRange]);

    const stats = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        return { income, expense, savings, savingsRate };
    }, [transactions]);

    const categorySpending = useMemo(() => {
        const map = new Map<string, { name: string, value: number, color: string }>();
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = (t as any).category || { name: 'General', color: '#64748b' };
                const catId = cat.id || 'general';
                const existing = map.get(catId) || { name: cat.name, value: 0, color: cat.color || '#64748b' };
                existing.value += t.amount;
                map.set(catId, existing);
            });
        return Array.from(map.values()).sort((a, b) => b.value - a.value);
    }, [transactions]);

    const netWorthTrend = useMemo(() => {
        if (transactions.length === 0) return [];
        const daily = new Map<string, number>();
        transactions.forEach(t => {
            const date = t.date.split('T')[0];
            const change = t.type === 'income' ? t.amount : (t.type === 'expense' ? -t.amount : 0);
            daily.set(date, (daily.get(date) || 0) + change);
        });
        const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);
        const sortedDates = Array.from(daily.keys()).sort().reverse();
        let runningBalance = currentBalance;
        const history = [{ date: 'Today', balance: runningBalance }];
        sortedDates.forEach(date => {
            const change = daily.get(date) || 0;
            runningBalance -= change;
            history.push({ date, balance: runningBalance });
        });
        return history.reverse();
    }, [transactions, accounts]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    const getCurrencySymbol = (code: string = 'USD') => {
        switch (code) {
            case 'USD': return '$'; case 'EUR': return '€'; case 'GBP': return '£';
            case 'INR': return '₹'; case 'JPY': return '¥'; default: return '$';
        }
    };

    return (
        <div className="reports-page">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>Financial Insights</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Deep dive into your spending habits and net worth growth.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="glass" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                        {(['month', 'year', 'all'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                style={{
                                    padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600',
                                    background: timeRange === r ? 'var(--primary)' : 'transparent',
                                    color: timeRange === r ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                    <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Total Period Income</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getCurrencySymbol(displayCurrency)}{stats.income.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                        <TrendingUp size={14} /> Performance
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
                    <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Total Period Expenses</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{getCurrencySymbol(displayCurrency)}{stats.expense.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                        <TrendingDown size={14} /> Efficiency
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Net Savings</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: stats.savings >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                        {stats.savings >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{stats.savings.toLocaleString()}
                    </div>
                </div>
                <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
                    <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Savings Rate</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{stats.savingsRate.toFixed(1)}%</div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: '16px' }}>
                        <div style={{ height: '100%', width: `${Math.min(stats.savingsRate, 100)}%`, background: 'white', borderRadius: '2px' }}></div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <section className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px' }}>Net Worth Evolution</h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Historical Balance Trend</div>
                    </div>
                    <div style={{ height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netWorthTrend}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                    formatter={(val: any) => [getCurrencySymbol(displayCurrency) + val.toLocaleString(), 'Total Balance']}
                                />
                                <Area type="monotone" dataKey="balance" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="card">
                    <h3 style={{ fontSize: '18px', marginBottom: '24px' }}>Spending by Category</h3>
                    <div style={{ height: '280px' }}>
                        {categorySpending.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categorySpending} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                        {categorySpending.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => getCurrencySymbol(displayCurrency) + val.toLocaleString()}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data to display</div>}
                    </div>
                </section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--income-soft)', color: 'var(--income)' }}><TrendingUp size={20} /></div>
                        <h4 style={{ margin: 0 }}>Top Income Sources</h4>
                    </div>
                    {transactions.filter(t => t.type === 'income').slice(0, 4).map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                            <span style={{ fontSize: '14px' }}>{t.description}</span>
                            <span style={{ fontWeight: '600', color: 'var(--income)' }}>+{getCurrencySymbol(displayCurrency)}{t.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </section>

                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--expense-soft)', color: 'var(--expense)' }}><TrendingDown size={20} /></div>
                        <h4 style={{ margin: 0 }}>Largest Expenses</h4>
                    </div>
                    {transactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 4).map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                            <span style={{ fontSize: '14px' }}>{t.description}</span>
                            <span style={{ fontWeight: '600', color: 'var(--expense)' }}>-{getCurrencySymbol(displayCurrency)}{t.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </section>

                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}><Wallet size={20} /></div>
                        <h4 style={{ margin: 0 }}>Account Distribution</h4>
                    </div>
                    {accounts.map(acc => (
                        <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                            <span style={{ fontSize: '14px' }}>{acc.name}</span>
                            <span style={{ fontWeight: '600' }}>{getCurrencySymbol(acc.currency)}{acc.balance.toLocaleString()}</span>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default Reports;
