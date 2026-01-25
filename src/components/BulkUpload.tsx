import React, { useState, useEffect } from 'react';
import { accountService } from '../lib/services/context';
import type { Account } from '../lib/core/models';
import { Upload, FileText, BarChart, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';

const BulkUpload: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [sourceType, setSourceType] = useState('money_manager');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        accountService.getAccounts().then(setAccounts);
    }, []);

    const handleUpload = async () => {
        if (!file || !sourceType) {
            setMessage('Please select a file and source type.');
            return;
        }

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source_type', sourceType);
        formData.append('currency', currency);
        if (selectedAccount) formData.append('account_id', selectedAccount);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/bulk/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setStatus('success');
                setMessage(data.message);
            } else {
                throw new Error(data.detail || 'Upload failed');
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message);
        }
    };

    return (
        <div className="bulk-upload-page">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Bulk Import</h1>
                <p style={{ color: 'var(--text-muted)' }}>Migrate your data from other apps or bank statements effortlessly.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                <section className="card" style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>1. Select Data Source</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {[
                                { id: 'money_manager', name: 'Money Manager', icon: FileText, desc: 'TSV Backup' },
                                { id: 'excel', name: 'Excel / CSV', icon: BarChart, desc: 'Bank Export' },
                                { id: 'pdf', name: 'PDF Statement', icon: Upload, desc: 'Monthly PDF' },
                            ].map(src => (
                                <button
                                    key={src.id}
                                    onClick={() => setSourceType(src.id)}
                                    style={{
                                        padding: '16px', borderRadius: '16px', border: sourceType === src.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        background: sourceType === src.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                    }}
                                >
                                    <src.icon size={24} color={sourceType === src.id ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '12px' }} />
                                    <div style={{ fontWeight: '700', fontSize: '14px', color: sourceType === src.id ? 'var(--text-main)' : 'var(--text-muted)' }}>{src.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{src.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>2. Currency</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit',
                                    appearance: 'none', WebkitAppearance: 'none'
                                }}
                            >
                                {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>3. Target Account (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'inherit',
                                    appearance: 'none', WebkitAppearance: 'none'
                                }}
                            >
                                <option value="">Auto-detect or Ask Later</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                            </select>
                            <ChevronDown size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>4. Upload File</label>
                        <div style={{
                            border: '2px dashed var(--border)', borderRadius: '20px', padding: '40px', textAlign: 'center',
                            cursor: 'pointer', background: file ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            transition: 'all 0.2s'
                        }}
                            onClick={() => document.getElementById('file-input')?.click()}>
                            <input type="file" id="file-input" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <Upload size={40} color="var(--primary)" style={{ marginBottom: '16px' }} />
                            {file ? (
                                <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{file.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontWeight: '600' }}>Click to Browse or Drag & Drop</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PDF, XLSX, or TSV accepted</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={!file || status === 'uploading'}
                        style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                    >
                        {status === 'uploading' ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : 'Start Import'}
                    </button>

                    {status !== 'idle' && (
                        <div style={{
                            marginTop: '20px', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
                            background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : (status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'),
                            color: status === 'success' ? 'var(--income)' : (status === 'error' ? 'var(--expense)' : 'inherit')
                        }}>
                            {status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>{message}</div>
                        </div>
                    )}
                </section>

                <aside>
                    <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-soft)' }}>
                        <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Import Tips</h4>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <li><strong>Money Manager:</strong> Export your data as a TSV file for the best compatibility.</li>
                            <li><strong>Bank Statements:</strong> Ensure the PDF is not password protected before uploading.</li>
                            <li><strong>Excel:</strong> Files should have columns like "Date", "Description", and "Amount" on the first sheet.</li>
                            <li><strong>Mapping:</strong> If you don't select a target account, we will try to match based on the file data.</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BulkUpload;
