import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import TransactionDialog from './components/TransactionDialog';
import BulkUpload from './components/BulkUpload';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';

const AuthController: React.FC = () => {
    const { token, isLoading } = useAuth();
    const [authView, setAuthView] = useState<'login' | 'register'>('login');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const handleSwitch = (e: any) => setAuthView(e.detail);
        window.addEventListener('switch-auth', handleSwitch);
        return () => window.removeEventListener('switch-auth', handleSwitch);
    }, []);

    if (isLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
        );
    }

    if (!token) {
        return authView === 'login' ? <Login /> : <Register />;
    }

    return (
        <Router>
            <div className="app-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                <Sidebar />
                <main style={{ flex: 1, overflowY: 'auto', padding: '32px', position: 'relative' }}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/bulk-upload" element={<BulkUpload />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>

                    <button
                        className="btn btn-primary"
                        style={{
                            position: 'fixed',
                            bottom: '32px',
                            right: '32px',
                            borderRadius: '50px',
                            padding: '16px 24px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 100
                        }}
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <Plus size={24} />
                        <span>Add Transaction</span>
                    </button>
                </main>

                {isDialogOpen && (
                    <TransactionDialog onClose={() => setIsDialogOpen(false)} />
                )}
            </div>
        </Router>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AuthController />
        </AuthProvider>
    );
};

export default App;

