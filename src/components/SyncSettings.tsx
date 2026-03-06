import React, { useState, useEffect } from 'react';
import {
    X, Mail, RefreshCw, Check, AlertTriangle, Clock, Loader2,
    Link2, Unlink, Settings, Play, ChevronDown
} from 'lucide-react';
import type { SyncConfig, GmailStatus } from '../lib/services/SyncService';
import {
    getGmailStatus, getGmailAuthUrl, disconnectGmail,
    getSyncConfig, createOrUpdateSyncConfig, deleteSyncConfig,
    triggerSync
} from '../lib/services/SyncService';

// Importer presets for quick setup
const IMPORTER_PRESETS: Record<string, { label: string; query: string; pattern: string; key: string; subjectMatchPattern?: string }> = {
    hdfc_savings: {
        label: 'HDFC Bank (Savings/Current)',
        query: 'from:alerts@hdfcbank.net subject:"Account Statement"',
        pattern: '.*\\.pdf$',
        key: 'hdfc_bank'
    },
    chase_credit: {
        label: 'Chase Credit Card',
        query: 'from:no-reply@alertsp.chase.com subject:"statement"',
        pattern: '.*\\.pdf$',
        key: 'chase_credit'
    },
    amex_credit: {
        label: 'American Express',
        query: 'from:AmericanExpress@welcome.aexp.com subject:"statement"',
        pattern: '.*\\.pdf$',
        key: 'amex'
    },
    citi_credit: {
        label: 'Citi Credit Card',
        query: 'from:citicards@citi.com subject:"statement"',
        pattern: '.*\\.pdf$',
        key: 'citi'
    },
    custom: {
        label: 'Custom Configuration',
        query: '',
        subjectMatchPattern: '',
        pattern: '',
        key: ''
    }
};

const IMPORTERS: Record<string, string> = {
    hdfc_bank: 'HDFC Bank PDF',
    chase: 'Chase Bank CSV',
    bank_of_america: 'Bank of America CSV',
    wells_fargo: 'Wells Fargo CSV',
    chase_credit: 'Chase Credit Card PDF',
    amex: 'Amex Credit Card PDF',
    citi: 'Citi Credit Card PDF',
    capital_one: 'Capital One PDF',
    generic_bank: 'Generic Bank CSV',
    generic_credit_card: 'Generic Credit Card CSV',
    money_manager: 'Money Manager Export'
};

interface SyncSettingsProps {
    accountId: string;
    accountName: string;
    onClose: () => void;
}

const SyncSettings: React.FC<SyncSettingsProps> = ({ accountId, accountName, onClose }) => {
    const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
    const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [preset, setPreset] = useState('custom');
    const [gmailQuery, setGmailQuery] = useState('');
    const [subjectMatchPattern, setSubjectMatchPattern] = useState('');
    const [importerKey, setImporterKey] = useState('');
    const [intervalDays, setIntervalDays] = useState(30);
    const [filenamePattern, setFilenamePattern] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);
    const [pdfPassword, setPdfPassword] = useState('');
    const [hasPdfPassword, setHasPdfPassword] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [gmail, config] = await Promise.all([
                getGmailStatus(),
                getSyncConfig(accountId)
            ]);
            setGmailStatus(gmail);
            if (config) {
                setSyncConfig(config);
                setGmailQuery(config.gmail_search_query);
                setSubjectMatchPattern(config.subject_match_pattern || '');
                setImporterKey(config.importer_key);
                setIntervalDays(config.sync_interval_days);
                setFilenamePattern(config.attachment_filename_pattern || '');
                setIsEnabled(config.is_enabled);
                setHasPdfPassword(config.has_pdf_password || false);
                setPdfPassword(''); // Clear password field, we rely on has_pdf_password for UI
                // Try to match a preset
                const matchedPreset = Object.entries(IMPORTER_PRESETS).find(
                    ([, p]) => p.key === config.importer_key && p.query === config.gmail_search_query
                );
                setPreset(matchedPreset ? matchedPreset[0] : 'custom');
            }
        } catch (e) {
            console.error('Failed to load sync settings', e);
        }
        setLoading(false);
    };

    const handleConnectGmail = async () => {
        try {
            const { auth_url } = await getGmailAuthUrl();
            window.location.href = auth_url;
        } catch (e: any) {
            alert(e.message || 'Failed to get auth URL');
        }
    };

    const handleDisconnectGmail = async () => {
        if (!confirm('Disconnect Gmail? Sync will stop for all accounts.')) return;
        try {
            await disconnectGmail();
            setGmailStatus({ is_connected: false, gmail_email: null });
        } catch (e) {
            console.error('Failed to disconnect', e);
        }
    };

    const handlePresetChange = (presetKey: string) => {
        setPreset(presetKey);
        if (presetKey !== 'custom') {
            const p = IMPORTER_PRESETS[presetKey];
            setGmailQuery(p.query);
            setSubjectMatchPattern(p.subjectMatchPattern || '');
            setImporterKey(p.key);
            setFilenamePattern(p.pattern);
        }
    };

    const handleSave = async () => {
        if (!gmailQuery || !importerKey) {
            alert('Gmail search query and importer are required');
            return;
        }
        setSaving(true);
        try {
            const config = await createOrUpdateSyncConfig(accountId, {
                gmail_search_query: gmailQuery,
                subject_match_pattern: subjectMatchPattern || undefined,
                importer_key: importerKey,
                sync_interval_days: intervalDays,
                attachment_filename_pattern: filenamePattern || undefined,
                is_enabled: isEnabled,
                ...(pdfPassword ? { pdf_password: pdfPassword } : {})
            });
            setSyncConfig(config);
            setHasPdfPassword(config.has_pdf_password || false);
            setPdfPassword('');
            setSyncResult({ status: 'saved', message: 'Settings saved!' });
            setTimeout(() => setSyncResult(null), 3000);
        } catch (e: any) {
            alert(e.message || 'Failed to save');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!confirm('Remove sync configuration for this account?')) return;
        try {
            await deleteSyncConfig(accountId);
            setSyncConfig(null);
            setGmailQuery('');
            setSubjectMatchPattern('');
            setImporterKey('');
            setPreset('custom');
            setPdfPassword('');
            setHasPdfPassword(false);
            setSyncResult(null);
        } catch (e) {
            console.error('Failed to delete config', e);
        }
    };

    const handleTriggerSync = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const result = await triggerSync(accountId);
            setSyncResult(result);
            await loadData(); // Refresh status
        } catch (e: any) {
            setSyncResult({ status: 'failed', error: e.message });
        }
        setSyncing(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'success': return <Check size={14} color="#10b981" />;
            case 'failed': return <AlertTriangle size={14} color="#ef4444" />;
            case 'syncing': return <Loader2 size={14} className="animate-spin" color="#6366f1" />;
            default: return <Clock size={14} color="var(--text-muted)" />;
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'success': return '#10b981';
            case 'failed': return '#ef4444';
            case 'syncing': return '#6366f1';
            default: return 'var(--text-muted)';
        }
    };

    if (loading) {
        return (
            <div style={overlayStyle} onClick={onClose}>
                <div style={dialogStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
                        <Loader2 size={24} className="animate-spin" color="var(--primary)" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={dialogStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', display: 'flex' }}>
                            <RefreshCw size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Gmail Sync</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{accountName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
                </div>

                {/* Gmail Connection */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Mail size={18} color={gmailStatus?.is_connected ? '#10b981' : 'var(--text-muted)'} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                    {gmailStatus?.is_connected ? 'Gmail Connected' : 'Gmail Not Connected'}
                                </div>
                                {gmailStatus?.gmail_email && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{gmailStatus.gmail_email}</div>
                                )}
                            </div>
                        </div>
                        {gmailStatus?.is_connected ? (
                            <button onClick={handleDisconnectGmail} style={{
                                ...pillButtonStyle,
                                color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.08)'
                            }}>
                                <Unlink size={13} /> Disconnect
                            </button>
                        ) : (
                            <button onClick={handleConnectGmail} style={{
                                ...pillButtonStyle,
                                color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)',
                                background: 'rgba(99,102,241,0.08)'
                            }}>
                                <Link2 size={13} /> Connect Gmail
                            </button>
                        )}
                    </div>
                </div>

                {/* Sync Config Form */}
                {gmailStatus?.is_connected && (
                    <>
                        <div style={sectionStyle}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={15} /> Sync Configuration
                            </div>

                            {/* Preset selector */}
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Quick Setup</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={preset}
                                        onChange={e => handlePresetChange(e.target.value)}
                                        style={selectStyle}
                                    >
                                        {Object.entries(IMPORTER_PRESETS).map(([key, p]) => (
                                            <option key={key} value={key}>{p.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                </div>
                            </div>

                            {/* Gmail Query */}
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Gmail Search Query</label>
                                <input
                                    type="text"
                                    value={gmailQuery}
                                    onChange={e => setGmailQuery(e.target.value)}
                                    placeholder='from:alerts@hdfcbank.net subject:"Account Statement"'
                                    style={inputStyle}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Gmail search query to find statement emails
                                </span>
                            </div>

                            {/* Subject Match Pattern */}
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Subject Match Pattern (optional regex)</label>
                                <input
                                    type="text"
                                    value={subjectMatchPattern}
                                    onChange={e => setSubjectMatchPattern(e.target.value)}
                                    placeholder='e.g., ^Account Statement.*'
                                    style={inputStyle}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Regex pattern to filter found emails by subject line (useful for dynamic months/years)
                                </span>
                            </div>

                            {/* Importer */}
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Statement Format</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={importerKey}
                                        onChange={e => setImporterKey(e.target.value)}
                                        style={selectStyle}
                                    >
                                        <option value="">Select format...</option>
                                        {Object.entries(IMPORTERS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {/* Interval */}
                                <div style={{ ...fieldStyle, flex: 1 }}>
                                    <label style={labelStyle}>Sync Every</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={intervalDays}
                                            onChange={e => setIntervalDays(Number(e.target.value))}
                                            style={selectStyle}
                                        >
                                            <option value={7}>7 days</option>
                                            <option value={14}>14 days</option>
                                            <option value={30}>30 days</option>
                                            <option value={60}>60 days</option>
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                    </div>
                                </div>

                                {/* Enabled toggle */}
                                <div style={{ ...fieldStyle, flex: 1 }}>
                                    <label style={labelStyle}>Auto-Sync</label>
                                    <button
                                        onClick={() => setIsEnabled(!isEnabled)}
                                        style={{
                                            padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
                                            border: '1px solid var(--border)', cursor: 'pointer',
                                            background: isEnabled ? 'rgba(16,185,129,0.1)' : 'transparent',
                                            color: isEnabled ? '#10b981' : 'var(--text-muted)',
                                            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
                                            transition: 'all 0.2s', width: '100%'
                                        }}
                                    >
                                        <div style={{
                                            width: '36px', height: '20px', borderRadius: '10px',
                                            background: isEnabled ? '#10b981' : 'var(--border)',
                                            position: 'relative', transition: 'all 0.3s', flexShrink: 0
                                        }}>
                                            <div style={{
                                                width: '16px', height: '16px', borderRadius: '50%',
                                                background: 'white', position: 'absolute', top: '2px',
                                                left: isEnabled ? '18px' : '2px', transition: 'all 0.3s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }} />
                                        </div>
                                        {isEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>

                            {/* Filename pattern (advanced) */}
                            <div style={fieldStyle}>
                                <label style={labelStyle}>Attachment Filename Pattern (optional)</label>
                                <input
                                    type="text"
                                    value={filenamePattern}
                                    onChange={e => setFilenamePattern(e.target.value)}
                                    placeholder=".*\.pdf$"
                                    style={inputStyle}
                                />
                            </div>

                            {/* PDF Password */}
                            {importerKey && importerKey.includes('pdf') && (
                                <div style={fieldStyle}>
                                    <label style={labelStyle}>PDF Password (optional)</label>
                                    <input
                                        type="password"
                                        value={pdfPassword}
                                        onChange={e => setPdfPassword(e.target.value)}
                                        placeholder={hasPdfPassword ? "******** (Password is set)" : "Enter password to decrypt statements"}
                                        style={inputStyle}
                                    />
                                    {hasPdfPassword && !pdfPassword && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            A password is already saved. Only enter a new one to change it.
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Save / Delete buttons */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                                {syncConfig && (
                                    <button onClick={handleDelete} style={{
                                        padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
                                        background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '13px',
                                        fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sync Status */}
                        {syncConfig && (
                            <div style={sectionStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {statusIcon(syncConfig.last_sync_status)}
                                        Sync Status
                                    </div>
                                    <button
                                        onClick={handleTriggerSync}
                                        disabled={syncing || !gmailStatus?.is_connected}
                                        style={{
                                            ...pillButtonStyle,
                                            color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)',
                                            background: 'rgba(99,102,241,0.08)',
                                            opacity: syncing ? 0.7 : 1
                                        }}
                                    >
                                        {syncing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                                        {syncing ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={statCardStyle}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: statusColor(syncConfig.last_sync_status), textTransform: 'capitalize' }}>
                                            {syncConfig.last_sync_status}
                                        </div>
                                    </div>
                                    <div style={statCardStyle}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Synced</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{formatDate(syncConfig.last_synced_at)}</div>
                                    </div>
                                    <div style={statCardStyle}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transactions</div>
                                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{syncConfig.last_sync_txn_count}</div>
                                    </div>
                                    <div style={statCardStyle}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interval</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600' }}>Every {syncConfig.sync_interval_days} days</div>
                                    </div>
                                </div>

                                {syncConfig.last_sync_error && (
                                    <div style={{
                                        marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                        fontSize: '12px', color: '#ef4444'
                                    }}>
                                        <strong>Error:</strong> {syncConfig.last_sync_error}
                                    </div>
                                )}

                                {/* Sync Result */}
                                {syncResult && syncResult.status !== 'saved' && (
                                    <div style={{
                                        marginTop: '12px', padding: '12px 14px', borderRadius: '10px',
                                        background: syncResult.status === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                        border: `1px solid ${syncResult.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                        fontSize: '13px'
                                    }}>
                                        {syncResult.status === 'success' ? (
                                            <div style={{ color: '#10b981' }}>
                                                <strong>✅ Sync complete!</strong> {syncResult.transactions_imported} transactions imported
                                                {syncResult.duplicates_skipped > 0 && `, ${syncResult.duplicates_skipped} duplicates skipped`}
                                            </div>
                                        ) : (
                                            <div style={{ color: '#ef4444' }}>
                                                <strong>❌ Sync failed:</strong> {syncResult.error}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {syncResult?.status === 'saved' && (
                                    <div style={{
                                        marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
                                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                        fontSize: '13px', color: '#10b981'
                                    }}>
                                        ✅ {syncResult.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {!gmailStatus?.is_connected && (
                    <div style={{
                        padding: '32px', textAlign: 'center', color: 'var(--text-muted)',
                        borderRadius: '16px', border: '1px dashed var(--border)', marginTop: '4px'
                    }}>
                        <Mail size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Connect Gmail to get started</div>
                        <div style={{ fontSize: '12px' }}>Auto-import bank statements from your email</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Styles ---

const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)'
};

const dialogStyle: React.CSSProperties = {
    width: '520px', maxHeight: '85vh', overflowY: 'auto',
    background: 'var(--bg-card)', borderRadius: '20px', padding: '28px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '1px solid var(--border)'
};

const closeButtonStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', padding: '4px'
};

const sectionStyle: React.CSSProperties = {
    padding: '16px', borderRadius: '14px', border: '1px solid var(--border)',
    marginBottom: '16px', background: 'var(--bg-main)'
};

const fieldStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px'
};

const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em'
};

const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)',
    background: 'transparent', color: 'inherit', fontSize: '14px'
};

const selectStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)',
    background: 'var(--bg-card)', color: 'inherit', fontSize: '14px',
    width: '100%', appearance: 'none', paddingRight: '32px', cursor: 'pointer'
};

const pillButtonStyle: React.CSSProperties = {
    padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center',
    gap: '6px', transition: 'all 0.2s'
};

const statCardStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card)'
};

export default SyncSettings;
