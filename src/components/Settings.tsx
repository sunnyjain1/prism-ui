import React, { useState } from 'react';
import { Sun, Moon, Globe, Shield } from 'lucide-react';

const Settings: React.FC = () => {
    const [darkMode, setDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    const toggleTheme = () => {
        const newTheme = !darkMode ? 'dark' : 'light';
        setDarkMode(!darkMode);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <div className="settings-page">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage your preferences and account settings.</p>
            </header>

            <div style={{ display: 'grid', gap: '24px' }}>
                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sun size={20} /> Appearance
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Dark Mode</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Adjust the app theme preference.</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`btn ${darkMode ? 'btn-primary' : ''}`}
                            style={{ background: darkMode ? 'var(--primary)' : 'var(--border-soft)', padding: '8px 20px' }}
                        >
                            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                            {darkMode ? 'Dark' : 'Light'}
                        </button>
                    </div>
                </section>

                <section className="card">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Globe size={20} /> Localization
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Default Currency</span>
                            <span style={{ fontWeight: '600' }}>USD ($)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Language</span>
                            <span style={{ fontWeight: '600' }}>English</span>
                        </div>
                    </div>
                </section>

                <section className="card" style={{ opacity: 0.5 }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={20} /> Security & Privacy
                    </h3>
                    <p>Security options coming soon...</p>
                </section>
            </div>
        </div>
    );
};

export default Settings;
