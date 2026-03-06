import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import TransactionDialog from './components/TransactionDialog';
import BulkUpload from './components/BulkUpload';
import Transactions from './components/Transactions';
import AccountDetails from './components/AccountDetails';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CryptoProvider } from './contexts/CryptoContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { Plus, Loader2 } from 'lucide-react';
import { postGmailCallback } from './lib/services/SyncService';

const AuthController: React.FC = () => {
    const { token, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogProps, setDialogProps] = useState<{ accountId?: string; date?: string; }>({});
    const [isFabHovered, setIsFabHovered] = useState(false);

    useEffect(() => {
        const handleSwitch = (e: any) => setAuthView(e.detail);
        const handleOpenDialog = (e: any) => {
            setDialogProps(e.detail || {});
            setIsDialogOpen(true);
        };

        window.addEventListener('switch-auth', handleSwitch);
        window.addEventListener('open-transaction-dialog', handleOpenDialog);

        return () => {
            window.removeEventListener('switch-auth', handleSwitch);
            window.removeEventListener('open-transaction-dialog', handleOpenDialog);
        };
    }, []);

    // Handle Gmail OAuth callback at root level
    useEffect(() => {
        if (!token) return; // Only handle if logged in
        const code = searchParams.get('code');
        if (code) {
            setSearchParams({}, { replace: true });
            postGmailCallback(code)
                .then(() => {
                    navigate('/accounts?gmail=connected');
                })
                .catch((e) => {
                    alert(`Gmail connection failed: ${e.message}`);
                    navigate('/accounts');
                });
        }
    }, [token, searchParams]);

    if (isLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (!token) {
        if (authView === 'login') return <Login />;
        if (authView === 'register') return <Register />;
        return (
            <LandingPage
                onGetStarted={() => setAuthView('register')}
                onLogin={() => setAuthView('login')}
            />
        );
    }



    return (
        <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, overflowY: 'auto', padding: '32px', position: 'relative' }}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/accounts/:id" element={<AccountDetails />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/bulk-upload" element={<BulkUpload />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {!location.pathname.match(/^\/accounts\/.+$/) && (
                    <button
                        className="btn btn-primary"
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            right: '32px',
                            borderRadius: '28px',
                            height: '56px',
                            minWidth: '56px',
                            width: isFabHovered ? 'auto' : '56px',
                            padding: isFabHovered ? '0 24px' : '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-lg)',
                            border: 'none',
                            zIndex: 100,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={() => setIsFabHovered(true)}
                        onMouseLeave={() => setIsFabHovered(false)}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus size={24} style={{ flexShrink: 0 }} />
                        <span style={{
                            maxWidth: isFabHovered ? '200px' : '0',
                            opacity: isFabHovered ? 1 : 0,
                            marginLeft: isFabHovered ? '12px' : '0',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>Add Transaction</span>
                    </button>
                )}
            </main>

            {isDialogOpen && (
                <TransactionDialog
                    onClose={() => {
                        setIsDialogOpen(false);
                        setDialogProps({});
                    }}
                    initialAccountId={dialogProps.accountId}
                    initialDate={dialogProps.date}
                />
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <CryptoProvider>
                    <PrivacyProvider>
                        <AuthController />
                    </PrivacyProvider>
                </CryptoProvider>
            </AuthProvider>
        </Router>
    );
};

export default App;
