import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, UserPlus, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            await response.json();
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-main)', position: 'relative', overflow: 'hidden'
        }}>
            <div className="card glass" style={{
                width: '100%', maxWidth: '400px', padding: '40px', border: '1px solid var(--glass-border)',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                {isSuccess ? (
                    <div style={{ animation: 'fadeIn 0.5s ease-out', textAlign: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--income-soft)',
                            color: 'var(--income)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <UserPlus size={32} />
                        </div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Success!</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                            Your account for <strong>{email}</strong> has been created successfully.
                        </p>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('switch-auth', { detail: 'login' }))}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '700' }}
                        >
                            Log In Now
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h1 style={{ fontSize: '32px', fontWeight: '800', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>Create Account</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Join Prism to start managing your finances.</p>
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--expense)',
                                borderRadius: '10px', color: 'var(--expense)', fontSize: '14px', marginBottom: '24px', textAlign: 'center'
                            }}>{error}</div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                            border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit'
                                        }}
                                        placeholder="John Doe" required
                                    />
                                </div>
                            </div>

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
                                        placeholder="••••••••" required minLength={8}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px',
                                            border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit'
                                        }}
                                        placeholder="••••••••" required minLength={8}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={isSubmitting}
                                className="btn btn-primary"
                                style={{ padding: '14px', borderRadius: '12px', marginTop: '12px', fontWeight: '700', fontSize: '16px' }}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                                    <><UserPlus size={18} style={{ marginRight: '8px' }} /> Sign Up</>
                                )}
                            </button>
                        </form>

                        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Already have an account? <span
                                onClick={() => window.dispatchEvent(new CustomEvent('switch-auth', { detail: 'login' }))}
                                style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                            >Login</span>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Register;
