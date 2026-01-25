import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';


const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Login failed');
            }

            const { access_token } = await response.json();

            // Get user info
            const userRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/me`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const userData = await userRes.json();

            login(access_token, userData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });

            if (!response.ok) {
                throw new Error('Google login failed');
            }

            const { access_token } = await response.json();

            // Get user info
            const userRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/me`, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            });
            const userData = await userRes.json();

            login(access_token, userData);
        } catch (err: any) {
            setError(err.message || 'Google login failed');
        }
    };


    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-main)', position: 'relative', overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(80px)'
            }}></div>
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%',
                background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)', opacity: 0.15, filter: 'blur(80px)'
            }}></div>

            <div className="card glass" style={{
                width: '100%', maxWidth: '400px', padding: '40px', border: '1px solid var(--glass-border)',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Prism</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome back. Please login to continue.</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--expense)',
                        borderRadius: '10px', color: 'var(--expense)', fontSize: '14px', marginBottom: '24px', textAlign: 'center'
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit'
                                }}
                                placeholder="name@example.com" required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit'
                                }}
                                placeholder="••••••••" required
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={isSubmitting}
                        className="btn btn-primary"
                        style={{ padding: '14px', borderRadius: '12px', marginTop: '12px', fontWeight: '700', fontSize: '16px' }}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                            <><LogIn size={18} style={{ marginRight: '8px' }} /> Login</>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                        <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>OR</span>
                        <div style={{ height: '1px', flex: 1, background: 'var(--border)' }}></div>
                    </div>

                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                        theme="filled_black"
                        shape="circle"
                    />

                    {/* Developer Mock Auth Button */}
                    {import.meta.env.DEV && (
                        <button
                            onClick={() => handleGoogleSuccess({ credential: 'dev-token-prism' })}
                            style={{
                                marginTop: '8px',
                                background: 'transparent',
                                border: '1px dashed var(--primary)',
                                color: 'var(--primary)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                opacity: 0.6,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
                        >
                            Dev Mock Login
                        </button>
                    )}
                </div>


                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                    Don't have an account? <span
                        onClick={() => window.dispatchEvent(new CustomEvent('switch-auth', { detail: 'register' }))}
                        style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                    >Sign up</span>
                </div>

            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Login;
