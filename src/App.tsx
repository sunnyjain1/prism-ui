import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Settings from './components/Settings';
import TransactionDialog from './components/TransactionDialog';
import { Plus } from 'lucide-react';

const App: React.FC = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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

export default App;
