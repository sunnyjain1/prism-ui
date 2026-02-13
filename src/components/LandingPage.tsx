import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import {
    Shield, BarChart3, Wallet, ArrowRight, Lock, Eye, TrendingUp,
    PieChart, Zap, ChevronRight, Globe,
    ArrowUpRight, ArrowDownRight, Sparkles, Check, Star, Users
} from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

/* ── Google icon SVG (inline) ── */
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    const [scrollY, setScrollY] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);
    const { login } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-rotate featured highlight
    useEffect(() => {
        const timer = setInterval(() => setActiveFeature(p => (p + 1) % 6), 4000);
        return () => clearInterval(timer);
    }, []);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Exchange Google access token for our JWT
                // First get user info from Google
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                await userInfoRes.json();

                // Then call our backend's google auth endpoint
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });

                if (!response.ok) throw new Error('Google login failed');

                const { access_token } = await response.json();
                const userRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${access_token}` }
                });
                const userData = await userRes.json();
                login(access_token, userData);
            } catch (err) {
                console.error('Google login failed:', err);
            }
        },
        onError: () => console.error('Google Login Failed'),
    });

    const features = [
        { icon: Shield, title: 'Privacy First', desc: 'Client-side encryption keeps your financial data truly private. Not even the server can read your PII.', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
        { icon: BarChart3, title: 'Rich Analytics', desc: 'Interactive charts, spending breakdowns, and income vs expense trends at a glance.', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
        { icon: Wallet, title: 'Multi-Account', desc: 'Track checking, savings, credit cards, and investments—all in one beautiful dashboard.', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
        { icon: Globe, title: 'Multi-Currency', desc: 'Seamlessly convert and track expenses across USD, EUR, GBP, INR, and more.', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        { icon: PieChart, title: 'Smart Categories', desc: 'Automatic categorization with custom categories for income and expenses.', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
        { icon: Lock, title: 'Encrypted Storage', desc: 'AES-256-GCM encryption with a Master Key only you control. Zero-knowledge architecture.', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    ];

    const stats = [
        { value: '256-bit', label: 'AES Encryption', icon: Lock },
        { value: '100%', label: 'Client-Side Privacy', icon: Shield },
        { value: '5+', label: 'Currencies Supported', icon: Globe },
        { value: '∞', label: 'Transactions', icon: Zap },
    ];

    const testimonials = [
        { name: 'Alex D.', role: 'Freelancer', quote: 'Finally a finance app that actually respects my privacy. The encryption is seamless.', stars: 5 },
        { name: 'Priya S.', role: 'Small Business Owner', quote: 'Multi-currency support is a game changer for tracking international payments.', stars: 5 },
        { name: 'Marcus W.', role: 'Developer', quote: 'Beautiful UI, zero-knowledge architecture. This is how finance apps should be built.', stars: 5 },
    ];

    return (
        <div className="landing-page" style={{ background: 'var(--bg-main)' }}>
            {/* ── Navigation ── */}
            <nav className="landing-nav" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                padding: '12px 32px',
                background: scrollY > 50 ? 'rgba(255,255,255,0.9)' : 'transparent',
                backdropFilter: scrollY > 50 ? 'blur(20px) saturate(180%)' : 'none',
                WebkitBackdropFilter: scrollY > 50 ? 'blur(20px) saturate(180%)' : 'none',
                borderBottom: scrollY > 50 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '800', fontSize: '18px', fontFamily: 'var(--font-display)',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                    }}>P</div>
                    <span style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Prism</span>
                </div>
                <div className="landing-nav-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Google SSO button in nav */}
                    <button
                        onClick={() => handleGoogleLogin()}
                        className="btn"
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            color: 'var(--text-main)', fontWeight: '600', fontSize: '13px',
                            cursor: 'pointer', padding: '8px 16px', borderRadius: '24px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <GoogleIcon /> Sign in with Google
                    </button>
                    <button onClick={onLogin} className="btn" style={{
                        background: 'transparent', color: 'var(--text-main)', fontWeight: '600', fontSize: '14px',
                        border: 'none', cursor: 'pointer', padding: '8px 16px'
                    }}>Log in</button>
                    <button onClick={onGetStarted} className="btn btn-primary" style={{
                        borderRadius: '24px', padding: '8px 20px', fontSize: '14px'
                    }}>Get Started</button>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="landing-hero" style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Animated gradient mesh */}
                <div className="hero-orb hero-orb-1" />
                <div className="hero-orb hero-orb-2" />
                <div className="hero-orb hero-orb-3" />

                {/* Grid pattern overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.04) 1px, transparent 0)',
                    backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 1
                }} />

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 16px 6px 8px', borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                            border: '1px solid rgba(99,102,241,0.15)',
                            marginBottom: '28px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)'
                        }}
                    >
                        <span style={{
                            background: 'var(--primary)', color: 'white', borderRadius: '12px',
                            padding: '2px 8px', fontSize: '11px', fontWeight: '700'
                        }}>NEW</span>
                        <Sparkles size={14} />
                        Privacy-First Personal Finance
                    </motion.div>

                    <h1 style={{
                        fontSize: 'clamp(42px, 6vw, 76px)', fontWeight: '800',
                        lineHeight: '1.04', letterSpacing: '-0.045em',
                        marginBottom: '24px', fontFamily: 'var(--font-display)',
                        color: 'var(--text-main)'
                    }}>
                        Your finances,<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundSize: '200% 200%',
                            animation: 'gradientShift 6s ease-in-out infinite'
                        }}>your privacy.</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-muted)',
                        lineHeight: '1.65', maxWidth: '560px', margin: '0 auto 44px'
                    }}>
                        Track expenses, manage accounts, and analyze spending—with client-side encryption
                        that keeps your data invisible to everyone, including us.
                    </p>

                    <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={onGetStarted} className="btn btn-primary" style={{
                            padding: '14px 28px', fontSize: '15px', borderRadius: '14px',
                            gap: '10px', boxShadow: '0 4px 16px rgba(99,102,241,0.35)'
                        }}>
                            Start for Free <ArrowRight size={17} />
                        </button>
                        <button
                            onClick={() => handleGoogleLogin()}
                            className="btn"
                            style={{
                                padding: '14px 28px', fontSize: '15px', borderRadius: '14px',
                                background: 'white', border: '1px solid var(--border)',
                                color: 'var(--text-main)', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                        >
                            <GoogleIcon /> Continue with Google
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div style={{
                        marginTop: '32px', display: 'flex', gap: '24px',
                        justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap'
                    }}>
                        {['End-to-end encrypted', 'Zero-knowledge', 'Open analytics'].map((badge, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500'
                            }}>
                                <Check size={14} color="var(--income)" /> {badge}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Dashboard preview mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 80, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'relative', zIndex: 2,
                        marginTop: '56px', width: '100%', maxWidth: '960px',
                        padding: '0 16px'
                    }}
                >
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '24px',
                        padding: '20px', border: '1px solid var(--border)',
                        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Subtle shimmer effect at top */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)'
                        }} />

                        {/* Browser chrome */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-soft)' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                    background: 'var(--bg-main)', borderRadius: '8px', padding: '4px 40px',
                                    fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border-soft)'
                                }}>
                                    app.prismfinance.io
                                </div>
                            </div>
                        </div>

                        {/* Dashboard cards */}
                        <div className="mockup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                            {[
                                { label: 'Income', value: '$12,450', change: '+12.5%', icon: ArrowUpRight, color: 'var(--income)', bg: 'var(--income-soft)' },
                                { label: 'Expenses', value: '$8,320', change: '-3.2%', icon: ArrowDownRight, color: 'var(--expense)', bg: 'var(--expense-soft)' },
                                { label: 'Net Savings', value: '$4,130', change: '+24.8%', icon: TrendingUp, color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)' },
                            ].map((item, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 0.15 }}
                                    style={{
                                        padding: '16px', borderRadius: '16px',
                                        background: 'var(--bg-main)', border: '1px solid var(--border-soft)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
                                        <div style={{ background: item.bg, color: item.color, padding: '3px', borderRadius: '6px' }}>
                                            <item.icon size={13} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>{item.value}</div>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: item.color }}>{item.change}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Mini chart placeholder */}
                        <div style={{
                            height: '80px', borderRadius: '12px', background: 'var(--bg-main)',
                            border: '1px solid var(--border-soft)', marginBottom: '12px',
                            display: 'flex', alignItems: 'flex-end', padding: '12px 16px', gap: '4px',
                            overflow: 'hidden'
                        }}>
                            {[40, 55, 35, 65, 50, 70, 45, 80, 60, 75, 55, 90, 65, 85, 70, 95, 80, 68, 72, 88, 76, 92].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: 0.8 + i * 0.03, duration: 0.5, ease: 'easeOut' }}
                                    style={{
                                        flex: 1, borderRadius: '3px 3px 0 0',
                                        background: i >= 18 ? 'var(--primary)' : 'rgba(99,102,241,0.15)',
                                        minWidth: '4px'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Transaction rows */}
                        {[
                            { name: 'Grocery Store', cat: 'Groceries', amount: '-$156.40', type: 'expense' },
                            { name: 'Salary Deposit', cat: 'Income', amount: '+$5,400.00', type: 'income' },
                            { name: 'Electric Bill', cat: 'Utilities', amount: '-$89.20', type: 'expense' },
                        ].map((t, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: '10px',
                                background: i % 2 === 0 ? 'var(--bg-main)' : 'transparent'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: t.type === 'income' ? 'var(--income-soft)' : 'var(--expense-soft)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {t.type === 'income'
                                            ? <ArrowUpRight size={15} color="var(--income)" />
                                            : <ArrowDownRight size={15} color="var(--expense)" />
                                        }
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{t.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.cat}</div>
                                    </div>
                                </div>
                                <span style={{
                                    fontWeight: '700', fontSize: '13px',
                                    color: t.type === 'income' ? 'var(--income)' : 'var(--expense)'
                                }}>{t.amount}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── Stats Bar ── */}
            <section style={{
                padding: '56px 24px', borderTop: '1px solid var(--border-soft)',
                borderBottom: '1px solid var(--border-soft)',
                background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-main) 100%)'
            }}>
                <div className="stats-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px',
                    maxWidth: '900px', margin: '0 auto'
                }}>
                    {stats.map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: '24px 16px', borderRadius: '20px',
                                background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                background: 'rgba(99,102,241,0.1)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '12px'
                            }}>
                                <s.icon size={20} />
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{s.value}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', marginTop: '4px' }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Features Grid ── */}
            <section style={{ padding: '100px 24px', maxWidth: '1100px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '64px' }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '6px 14px', borderRadius: '24px',
                        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)',
                        marginBottom: '20px', fontSize: '12px', fontWeight: '600', color: '#8b5cf6',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        Features
                    </div>
                    <h2 style={{
                        fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800',
                        letterSpacing: '-0.03em', marginBottom: '16px',
                        fontFamily: 'var(--font-display)'
                    }}>
                        Everything you need.<br />
                        <span style={{ color: 'var(--text-muted)' }}>Nothing you don't.</span>
                    </h2>
                    <p style={{ fontSize: '17px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
                        A complete financial toolkit with privacy baked in, not bolted on.
                    </p>
                </motion.div>

                <div className="features-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'
                }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            style={{
                                padding: '28px', cursor: 'default', borderRadius: '20px',
                                background: activeFeature === i ? 'var(--bg-card)' : 'var(--bg-card)',
                                border: activeFeature === i ? `1px solid ${f.color}30` : '1px solid var(--border-soft)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: activeFeature === i ? `0 8px 30px ${f.color}15` : 'none',
                                position: 'relative', overflow: 'hidden'
                            }}
                            onMouseEnter={() => setActiveFeature(i)}
                            whileHover={{ y: -5 }}
                        >
                            {/* Gradient accent line at top */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                                background: activeFeature === i ? f.gradient : 'transparent',
                                transition: 'background 0.4s ease'
                            }} />
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: `${f.color}12`, color: f.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px'
                            }}>
                                <f.icon size={22} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{f.title}</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.55' }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── How It Works ── */}
            <section style={{
                padding: '80px 24px',
                background: 'var(--bg-card)', borderTop: '1px solid var(--border-soft)',
                borderBottom: '1px solid var(--border-soft)'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '56px' }}
                    >
                        <h2 style={{
                            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '800',
                            letterSpacing: '-0.03em', marginBottom: '12px',
                            fontFamily: 'var(--font-display)'
                        }}>Get started in seconds</h2>
                        <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Three simple steps to financial clarity</p>
                    </motion.div>

                    <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                        {[
                            { step: '01', title: 'Create your account', desc: 'Sign up with email or Google SSO in under 30 seconds.', color: '#6366f1' },
                            { step: '02', title: 'Add your accounts', desc: 'Set up bank accounts, credit cards, and investment portfolios.', color: '#ec4899' },
                            { step: '03', title: 'Track & analyze', desc: 'Import transactions, view analytics, and enable encryption.', color: '#10b981' },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                style={{ textAlign: 'center' }}
                            >
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: `${s.color}10`, color: s.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)'
                                }}>{s.step}</div>
                                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{s.title}</h4>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Privacy Section ── */}
            <section style={{ padding: '100px 24px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px', borderRadius: '24px',
                            background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)',
                            marginBottom: '20px', fontSize: '12px', fontWeight: '600', color: '#10b981',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            <Shield size={13} />
                            Security
                        </div>

                        <h2 style={{
                            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800',
                            letterSpacing: '-0.03em', marginBottom: '16px',
                            fontFamily: 'var(--font-display)'
                        }}>
                            Your data stays{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #10b981, #6366f1)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>yours.</span>
                        </h2>

                        <p style={{
                            fontSize: '17px', color: 'var(--text-muted)',
                            maxWidth: '560px', margin: '0 auto 48px', lineHeight: '1.6'
                        }}>
                            AES-256-GCM encryption happens in your browser before data ever leaves.
                            Even with full database access, your identity stays invisible.
                        </p>
                    </motion.div>

                    <div className="privacy-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'left' }}>
                        {[
                            { icon: Eye, title: 'Pseudonymous IDs', desc: 'Your identity is decoupled from your records using random UUIDs.', color: '#6366f1' },
                            { icon: Lock, title: 'Client-Side Encryption', desc: 'Names, descriptions, and notes are encrypted in your browser.', color: '#10b981' },
                            { icon: Zap, title: 'Analytics Preserved', desc: 'Amounts, categories, and dates stay readable for your charts.', color: '#f59e0b' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: '24px', borderRadius: '20px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: `${item.color}10`, color: item.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '14px'
                                }}>
                                    <item.icon size={20} />
                                </div>
                                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>{item.title}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section style={{
                padding: '80px 24px',
                background: 'var(--bg-card)', borderTop: '1px solid var(--border-soft)',
                borderBottom: '1px solid var(--border-soft)'
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '48px' }}
                    >
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px', borderRadius: '24px',
                            background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.12)',
                            marginBottom: '20px', fontSize: '12px', fontWeight: '600', color: '#ec4899',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            <Users size={13} />
                            Testimonials
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '800',
                            letterSpacing: '-0.03em', fontFamily: 'var(--font-display)'
                        }}>Loved by users</h2>
                    </motion.div>

                    <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: '24px', borderRadius: '20px',
                                    background: 'var(--bg-main)', border: '1px solid var(--border-soft)'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '2px', marginBottom: '14px' }}>
                                    {Array.from({ length: t.stars }).map((_, si) => (
                                        <Star key={si} size={14} fill="#f59e0b" color="#f59e0b" />
                                    ))}
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.55', marginBottom: '16px', fontStyle: 'italic' }}>"{t.quote}"</p>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{t.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.role}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section style={{
                padding: '100px 24px', textAlign: 'center',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute', top: '-30%', right: '-10%', width: '400px', height: '400px',
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '-5%', width: '300px', height: '300px',
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none'
                }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <h2 style={{
                        fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800',
                        color: 'white', letterSpacing: '-0.03em', marginBottom: '16px',
                        fontFamily: 'var(--font-display)'
                    }}>
                        Ready to take control?
                    </h2>
                    <p style={{
                        fontSize: '17px', color: 'rgba(255,255,255,0.8)',
                        maxWidth: '460px', margin: '0 auto 36px', lineHeight: '1.6'
                    }}>
                        Join Prism and manage your finances with complete privacy and beautiful analytics.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={onGetStarted} className="btn" style={{
                            padding: '14px 32px', fontSize: '15px', borderRadius: '14px',
                            background: 'white', color: '#6366f1', fontWeight: '700',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                            border: 'none', cursor: 'pointer'
                        }}>
                            Create Free Account <ChevronRight size={17} style={{ marginLeft: '6px' }} />
                        </button>
                        <button
                            onClick={() => handleGoogleLogin()}
                            className="btn"
                            style={{
                                padding: '14px 32px', fontSize: '15px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600',
                                border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <GoogleIcon /> Sign in with Google
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                padding: '40px 24px', textAlign: 'center',
                borderTop: '1px solid var(--border-soft)',
                background: 'var(--bg-main)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                        width: '28px', height: '28px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '800', fontSize: '14px', fontFamily: 'var(--font-display)'
                    }}>P</div>
                    <span style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>Prism</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    © 2025 Prism Finance. Built with privacy in mind.
                </p>
            </footer>

            <style>{`
                .hero-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(120px);
                    pointer-events: none;
                    animation: float 20s ease-in-out infinite;
                    opacity: 0.7;
                }
                .hero-orb-1 {
                    width: 600px; height: 600px;
                    background: rgba(99, 102, 241, 0.12);
                    top: -15%; left: -10%;
                    animation-delay: 0s;
                }
                .hero-orb-2 {
                    width: 500px; height: 500px;
                    background: rgba(236, 72, 153, 0.08);
                    top: 15%; right: -10%;
                    animation-delay: -7s;
                }
                .hero-orb-3 {
                    width: 400px; height: 400px;
                    background: rgba(245, 158, 11, 0.06);
                    bottom: 5%; left: 25%;
                    animation-delay: -14s;
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -25px) scale(1.05); }
                    66% { transform: translate(-25px, 20px) scale(0.95); }
                }
                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @media (max-width: 768px) {
                    .landing-nav-actions .btn:first-child {
                        display: none !important;
                    }
                    .steps-grid {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                    .testimonials-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .hero-cta-group {
                        flex-direction: column !important;
                        align-items: stretch !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
