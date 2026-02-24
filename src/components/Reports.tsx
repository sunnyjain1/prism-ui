import React, { useState, useEffect, useMemo } from 'react';
import { transactionService, accountService, categoryService } from '../lib/services/context';
import { usePrivacy } from '../contexts/PrivacyContext';
import type { Transaction, Account, Category } from '../lib/core/models';
import { getMonthName, formatCurrency } from '../lib/utils/formatters';
import {
    TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import DatePicker from './DatePicker';

const Reports: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const { isPrivacyMode } = usePrivacy();

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [displayCurrency, setDisplayCurrency] = useState(localStorage.getItem('dashboardCurrency') || 'INR');

    // Filters for charts
    const [trendChartType, setTrendChartType] = useState<'income' | 'expense'>('expense');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [historyChartType, setHistoryChartType] = useState<'bar' | 'line'>('line');
    const [isolatedLine, setIsolatedLine] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const [txs, accs, cats, hist] = await Promise.all([
                transactionService.getTransactionsByMonth(month, year),
                accountService.getAccounts(),
                categoryService.getCategories(),
                transactionService.getHistory(6, month, year)
            ]);
            setTransactions(txs);
            setAccounts(accs);
            setCategories(cats);
            setHistory(hist);
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
    }, [month, year]);

    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        transactions.forEach(t => {
            const account = accounts.find(a => a.id === t.account_id);
            const amt = transactionService.convert(t.amount, account?.currency || 'INR', displayCurrency);
            if (t.type === 'income') income += amt;
            else if (t.type === 'expense') expense += amt;
        });
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        return { income, expense, savings, savingsRate };
    }, [transactions, accounts, displayCurrency]);

    const categorySpending = useMemo(() => {
        const map = new Map<string, { name: string, value: number, color: string }>();
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || { id: 'general', name: 'General', color: '#64748b' };
                const catId = cat.id;
                const existing = map.get(catId) || { name: cat.name, value: 0, color: (cat as any).color || '#64748b' };

                const account = accounts.find(a => a.id === t.account_id);
                const convertedAmount = transactionService.convert(t.amount, account?.currency || 'INR', displayCurrency);

                existing.value += convertedAmount;
                map.set(catId, existing);
            });
        return Array.from(map.values()).sort((a, b) => b.value - a.value);
    }, [transactions, accounts, displayCurrency]);

    // Trend Data for Area Chart (Cash Flow)
    const dailyTrendData = useMemo(() => {
        let filtered = transactions.filter(t => t.type === trendChartType);
        if (selectedCategoryId !== 'all') {
            filtered = filtered.filter(t => t.category?.id === selectedCategoryId);
        }

        const dailyMap = new Map<string, number>();
        filtered.forEach(t => {
            const day = new Date(t.date).getDate().toString();
            const account = accounts.find(a => a.id === t.account_id);
            const amt = transactionService.convert(t.amount, account?.currency || 'INR', displayCurrency);
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
    }, [transactions, trendChartType, selectedCategoryId, displayCurrency, accounts, month, year]);

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

    const historyWithTotal = useMemo(() => {
        return history.map(h => ({
            ...h,
            total: h.income - h.expense
        }));
    }, [history]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    return (
        <div className="reports-page">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>Analysis</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Visual insights and history for <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{getMonthName(month, year)}</span></p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handlePrevMonth}
                        className="btn"
                        style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <DatePicker
                        month={month}
                        year={year}
                        onChange={(m, y) => { setMonth(m); setYear(y); }}
                    />
                    <button
                        onClick={handleNextMonth}
                        className="btn"
                        style={{ padding: '8px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Income</div>
                    <div style={{ fontSize: '26px', fontWeight: '800' }}>{isPrivacyMode ? '••••••' : formatCurrency(stats.income, displayCurrency)}</div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Expenses</div>
                    <div style={{ fontSize: '26px', fontWeight: '800' }}>{isPrivacyMode ? '••••••' : formatCurrency(stats.expense, displayCurrency)}</div>
                </div>
                <div className="card">
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Net Savings</div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: stats.savings >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                        {isPrivacyMode ? '••••••' : `${stats.savings >= 0 ? '+' : ''}${formatCurrency(stats.savings, displayCurrency)}`}
                    </div>
                </div>
                <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Savings Rate</div>
                    <div style={{ fontSize: '26px', fontWeight: '800' }}>{stats.savingsRate.toFixed(1)}%</div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: '16px' }}>
                        <div style={{ height: '100%', width: `${Math.min(stats.savingsRate, 100)}%`, background: 'white', borderRadius: '2px' }}></div>
                    </div>
                </div>
            </div>

            <section className="card" style={{ marginBottom: '32px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart3 size={20} color="var(--primary)" /> Monthly History
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, marginTop: '4px' }}>Comparison of last 6 months relative to selection</p>
                    </div>

                    <div className="glass" style={{ padding: '4px', borderRadius: '10px', display: 'flex', gap: '2px', background: 'var(--bg-main)' }}>
                        <button onClick={() => setHistoryChartType('line')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                background: historyChartType === 'line' ? 'var(--bg-card)' : 'transparent',
                                color: historyChartType === 'line' ? 'var(--text-main)' : 'var(--text-muted)',
                                boxShadow: historyChartType === 'line' ? 'var(--shadow-sm)' : 'none'
                            }}>Line Graph</button>
                        <button onClick={() => setHistoryChartType('bar')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                background: historyChartType === 'bar' ? 'var(--bg-card)' : 'transparent',
                                color: historyChartType === 'bar' ? 'var(--text-main)' : 'var(--text-muted)',
                                boxShadow: historyChartType === 'bar' ? 'var(--shadow-sm)' : 'none'
                            }}>Bar Chart</button>
                    </div>
                </div>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {historyChartType === 'bar' ? (
                            <BarChart data={history}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--income)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--income)" stopOpacity={0.6} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--expense)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--expense)" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                    cursor={{ fill: 'var(--border-soft)', opacity: 0.4 }}
                                    formatter={(val: number | undefined) => isPrivacyMode ? '••••••' : formatCurrency(val || 0, displayCurrency)}
                                />
                                <Legend
                                    iconType="circle"
                                    onClick={(e) => setIsolatedLine(isolatedLine === e.dataKey ? null : String(e.dataKey))}
                                    wrapperStyle={{ cursor: 'pointer', userSelect: 'none' }}
                                />
                                <Bar hide={isolatedLine !== null && isolatedLine !== 'income'} dataKey="income" name="Income" fill="url(#incomeGradient)" radius={[6, 6, 0, 0]} animationBegin={200} animationDuration={1000} />
                                <Bar hide={isolatedLine !== null && isolatedLine !== 'expense'} dataKey="expense" name="Expense" fill="url(#expenseGradient)" radius={[6, 6, 0, 0]} animationBegin={400} animationDuration={1000} />
                            </BarChart>
                        ) : (
                            <LineChart data={historyWithTotal}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                    cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    formatter={(val: number | undefined) => isPrivacyMode ? '••••••' : formatCurrency(val || 0, displayCurrency)}
                                />
                                <Legend
                                    iconType="circle"
                                    onClick={(e) => setIsolatedLine(isolatedLine === e.dataKey ? null : String(e.dataKey))}
                                    wrapperStyle={{ cursor: 'pointer', userSelect: 'none' }}
                                />
                                <Line hide={isolatedLine !== null && isolatedLine !== 'income'} type="monotone" dataKey="income" name="Income" stroke="var(--income)" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} />
                                <Line hide={isolatedLine !== null && isolatedLine !== 'expense'} type="monotone" dataKey="expense" name="Expense" stroke="var(--expense)" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} />
                                <Line hide={isolatedLine !== null && isolatedLine !== 'total'} type="monotone" dataKey="total" name="Total (Net)" stroke="var(--primary)" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <section className="card" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={20} color="var(--primary)" /> Daily Cash Flow
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div className="glass" style={{ padding: '4px', borderRadius: '10px', display: 'flex', gap: '2px', background: 'var(--bg-main)' }}>
                                <button onClick={() => setTrendChartType('expense')}
                                    style={{
                                        padding: '4px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        background: trendChartType === 'expense' ? 'var(--expense)' : 'transparent', color: trendChartType === 'expense' ? 'white' : 'var(--text-muted)'
                                    }}>Expense</button>
                                <button onClick={() => setTrendChartType('income')}
                                    style={{
                                        padding: '4px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        background: trendChartType === 'income' ? 'var(--income)' : 'transparent', color: trendChartType === 'income' ? 'white' : 'var(--text-muted)'
                                    }}>Income</button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    style={{
                                        padding: '6px 32px 6px 12px', borderRadius: '10px', border: '1px solid var(--border-soft)', fontSize: '12px', fontWeight: '600',
                                        background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', appearance: 'none'
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
                            <AreaChart data={dailyTrendData}>
                                <defs>
                                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={trendChartType === 'expense' ? 'var(--expense)' : 'var(--income)'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={trendChartType === 'expense' ? 'var(--expense)' : 'var(--income)'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--shadow-lg)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                                    formatter={(val: any) => [isPrivacyMode ? '••••••' : formatCurrency(val as number, displayCurrency), trendChartType === 'expense' ? 'Expense' : 'Income']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke={trendChartType === 'expense' ? 'var(--expense)' : 'var(--income)'}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorAmt)"
                                    animationDuration={1200}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="card">
                    <h3 style={{ marginBottom: '24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChartIcon size={20} color="var(--primary)" /> Spending Mix
                    </h3>
                    <div style={{ height: '280px' }}>
                        {categorySpending.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categorySpending} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value">
                                        {categorySpending.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(val: any) => isPrivacyMode ? '••••••' : formatCurrency(val, displayCurrency)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No data to display</div>}
                    </div>
                    <div style={{ display: 'grid', gap: '12px', marginTop: '24px' }}>
                        {categorySpending.slice(0, 4).map((item, index) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color || COLORS[index % COLORS.length] }}></div>
                                <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{item.name}</span>
                                <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{isPrivacyMode ? '••••••' : formatCurrency(item.value, displayCurrency)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--income-soft)', color: 'var(--income)' }}><TrendingUp size={20} /></div>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>Top Income</h4>
                    </div>
                    {transactions.filter(t => t.type === 'income').sort((a, b) => b.amount - a.amount).slice(0, 5).map(t => {
                        const account = accounts.find(a => a.id === t.account_id);
                        const amt = transactionService.convert(t.amount, account?.currency || 'USD', displayCurrency);
                        return (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t.description}</span>
                                <span style={{ fontWeight: '700', color: 'var(--income)' }}>{isPrivacyMode ? '••••••' : `+${formatCurrency(amt, displayCurrency)}`}</span>
                            </div>
                        )
                    })}
                </section>

                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--expense-soft)', color: 'var(--expense)' }}><TrendingDown size={20} /></div>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>Top Expenses</h4>
                    </div>
                    {transactions.filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5).map(t => {
                        const account = accounts.find(a => a.id === t.account_id);
                        const amt = transactionService.convert(t.amount, account?.currency || 'USD', displayCurrency);
                        return (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{t.description}</span>
                                <span style={{ fontWeight: '700', color: 'var(--expense)' }}>{isPrivacyMode ? '••••••' : `-${formatCurrency(amt, displayCurrency)}`}</span>
                            </div>
                        )
                    })}
                </section>

                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}><PieChartIcon size={20} /></div>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>Category Breakdown</h4>
                    </div>
                    {categorySpending.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '14px 0' }}>No expenses this month</div>
                    ) : categorySpending.map((item, index) => (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color || COLORS[index % COLORS.length] }}></div>
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontWeight: '700', color: 'var(--expense)' }}>{isPrivacyMode ? '••••••' : `-${formatCurrency(item.value, displayCurrency)}`}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                    {stats.expense > 0 ? ((item.value / stats.expense) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default Reports;
