import React from 'react';

const Reports: React.FC = () => {
    return (
        <div className="reports-page">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Reports</h1>
                <p style={{ color: 'var(--text-muted)' }}>Analyze your spending patterns and financial health.</p>
            </header>

            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <h3>Advanced Reports coming soon</h3>
                <p style={{ color: 'var(--text-muted)' }}>We are working on detailed analytics and custom reporting tools.</p>
            </div>
        </div>
    );
};

export default Reports;
