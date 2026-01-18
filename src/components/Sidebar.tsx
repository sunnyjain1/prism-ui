import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Tag, Settings, BarChart3 } from 'lucide-react';

const Sidebar: React.FC = () => {
    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Accounts', path: '/accounts', icon: Wallet },
        { name: 'Categories', path: '/categories', icon: Tag },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="sidebar" style={{
            width: '280px',
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            position: 'relative',
            zIndex: 10
        }}>
            <div className="logo" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'var(--primary)',
                marginBottom: '48px',
                paddingLeft: '12px',
                fontFamily: 'var(--font-display)'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px'
                }}>P</div>
                Prism
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            background: isActive ? 'var(--income-soft)' : 'transparent',
                            fontWeight: isActive ? '600' : '500',
                            transition: 'all 0.2s'
                        })}
                    >
                        <item.icon size={20} />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', padding: '12px' }}>
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    borderRadius: '20px',
                    color: 'white',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>Pro Plan</p>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '16px' }}>Unlock detailed AI insights</div>
                    <button className="btn" style={{
                        width: '100%',
                        fontSize: '12px',
                        padding: '10px',
                        background: 'white',
                        color: 'var(--primary)',
                        fontWeight: '700'
                    }}>Upgrade Now</button>
                </div>
            </div>
        </div >
    );
};

export default Sidebar;
