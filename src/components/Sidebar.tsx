import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Tag, Settings, BarChart3, LogOut, User as UserIcon, Database, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Transactions', path: '/transactions', icon: List },
        { name: 'Accounts', path: '/accounts', icon: Wallet },
        { name: 'Categories', path: '/categories', icon: Tag },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
        { name: 'Bulk Upload', path: '/bulk-upload', icon: Database },
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

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'var(--income-soft)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <UserIcon size={20} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || 'User'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="btn"
                    style={{
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: 'var(--expense)',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: '1px solid transparent',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'var(--expense)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div >
    );
};

export default Sidebar;

