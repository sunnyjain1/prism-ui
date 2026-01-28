import React, { useState, useEffect } from 'react';
import { accountService } from '../lib/services/context';
import type { Account } from '../lib/core/models';
import { Upload, FileText, BarChart, CheckCircle2, AlertCircle, Loader2, ChevronDown, Building2, CreditCard, X } from 'lucide-react';

interface SupportedFormat {
    name: string;
    supported_formats: string[];
    description: string;
}

const BulkUpload: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [sourceType, setSourceType] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [autoDetect, setAutoDetect] = useState(true);
    const [supportedFormats, setSupportedFormats] = useState<Record<string, SupportedFormat>>({});
    const [importResult, setImportResult] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        accountService.getAccounts().then(setAccounts);
        fetchSupportedFormats();
    }, []);

    const fetchSupportedFormats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/bulk/formats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const formats = await response.json();
                setSupportedFormats(formats);
            }
        } catch (e) {
            console.error('Failed to fetch supported formats:', e);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file.');
            return;
        }

        setStatus('uploading');
        setMessage('');
        setImportResult(null);
        setShowDetails(false);

        const formData = new FormData();
        formData.append('file', file);
        if (sourceType) formData.append('source_type', sourceType);
        if (selectedAccount) formData.append('account_id', selectedAccount);
        formData.append('currency', currency);
        formData.append('skip_duplicates', skipDuplicates.toString());
        formData.append('auto_detect', autoDetect.toString());

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
                setMessage(data.message || `Successfully imported ${data.count} transactions`);
                setImportResult(data);
            } else {
                throw new Error(data.detail || 'Upload failed');
            }
        } catch (e: any) {
            setStatus('error');
            setMessage(e.message || 'Upload failed. Please try again.');
        }
    };

    const getSourceTypeCategory = (key: string): 'bank' | 'credit' | 'other' => {
        if (key.includes('credit') || ['amex', 'citi', 'capital_one'].includes(key)) return 'credit';
        if (['chase', 'bank_of_america', 'wells_fargo', 'generic_bank'].includes(key)) return 'bank';
        return 'other';
    };

    const bankFormats = Object.entries(supportedFormats).filter(([key]) => getSourceTypeCategory(key) === 'bank');
    const creditFormats = Object.entries(supportedFormats).filter(([key]) => getSourceTypeCategory(key) === 'credit');
    const otherFormats = Object.entries(supportedFormats).filter(([key]) => getSourceTypeCategory(key) === 'other');

    return (
        <div className="bulk-upload-page">
            <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Bulk Import</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Import transactions from bank statements, credit card PDFs, or Money Manager exports.
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                <section className="card" style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
                            1. Select Data Source {autoDetect && <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '14px' }}>(Auto-detect enabled)</span>}
                        </label>
                        
                        {!autoDetect && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
                                    <input
                                        type="checkbox"
                                        checked={autoDetect}
                                        onChange={(e) => setAutoDetect(e.target.checked)}
                                    />
                                    Auto-detect file format
                                </label>
                            </div>
                        )}

                        {!autoDetect && (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {bankFormats.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            <Building2 size={16} />
                                            <strong>Bank Statements (CSV/Excel)</strong>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                            {bankFormats.map(([key, format]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setSourceType(key)}
                                                    style={{
                                                        padding: '12px', borderRadius: '12px',
                                                        border: sourceType === key ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                        background: sourceType === key ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                        cursor: 'pointer', textAlign: 'left', fontSize: '13px'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600' }}>{format.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {creditFormats.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            <CreditCard size={16} />
                                            <strong>Credit Card PDFs</strong>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                            {creditFormats.map(([key, format]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setSourceType(key)}
                                                    style={{
                                                        padding: '12px', borderRadius: '12px',
                                                        border: sourceType === key ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                        background: sourceType === key ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                        cursor: 'pointer', textAlign: 'left', fontSize: '13px'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600' }}>{format.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {otherFormats.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            <FileText size={16} />
                                            <strong>Other Formats</strong>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                            {otherFormats.map(([key, format]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setSourceType(key)}
                                                    style={{
                                                        padding: '12px', borderRadius: '12px',
                                                        border: sourceType === key ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                        background: sourceType === key ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                                                        cursor: 'pointer', textAlign: 'left', fontSize: '13px'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: '600' }}>{format.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                                {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
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
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={20} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: '600' }}>
                            <input
                                type="checkbox"
                                checked={skipDuplicates}
                                onChange={(e) => setSkipDuplicates(e.target.checked)}
                            />
                            Skip duplicate transactions
                        </label>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '24px' }}>
                            Automatically skip transactions that already exist in your account
                        </p>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>4. Upload File</label>
                        <div style={{
                            border: '2px dashed var(--border)', borderRadius: '20px', padding: '40px', textAlign: 'center',
                            cursor: 'pointer', background: file ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                            transition: 'all 0.2s', position: 'relative'
                        }}
                            onClick={() => document.getElementById('file-input')?.click()}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const droppedFile = e.dataTransfer.files[0];
                                if (droppedFile) setFile(droppedFile);
                            }}
                        >
                            <input
                                type="file"
                                id="file-input"
                                style={{ display: 'none' }}
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept=".csv,.xlsx,.xls,.pdf,.tsv,.txt"
                            />
                            <Upload size={40} color="var(--primary)" style={{ marginBottom: '16px' }} />
                            {file ? (
                                <div>
                                    <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {(file.size / 1024).toFixed(1)} KB
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        style={{
                                            marginTop: '8px', padding: '4px 8px', fontSize: '12px',
                                            background: 'var(--bg-main)', border: '1px solid var(--border)',
                                            borderRadius: '6px', cursor: 'pointer'
                                        }}
                                    >
                                        <X size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Remove
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontWeight: '600' }}>Click to Browse or Drag & Drop</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        CSV, XLSX, PDF, or TSV accepted
                                    </div>
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
                        {status === 'uploading' ? (
                            <>
                                <Loader2 className="animate-spin" size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                Processing...
                            </>
                        ) : (
                            'Start Import'
                        )}
                    </button>

                    {status !== 'idle' && (
                        <div style={{
                            marginTop: '20px', padding: '16px', borderRadius: '12px',
                            background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : (status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)'),
                            color: status === 'success' ? 'var(--income)' : (status === 'error' ? 'var(--expense)' : 'inherit')
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: importResult ? '12px' : '0' }}>
                                {status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                <div style={{ fontSize: '14px', fontWeight: '500', flex: 1 }}>{message}</div>
                            </div>

                            {importResult && (
                                <div>
                                    <button
                                        onClick={() => setShowDetails(!showDetails)}
                                        style={{
                                            marginTop: '12px', padding: '8px 12px', fontSize: '12px',
                                            background: 'transparent', border: '1px solid var(--border)',
                                            borderRadius: '8px', cursor: 'pointer', width: '100%'
                                        }}
                                    >
                                        {showDetails ? 'Hide' : 'Show'} Details
                                    </button>

                                    {showDetails && (
                                        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <div style={{ marginBottom: '8px' }}>
                                                <strong>Parsed:</strong> {importResult.total_parsed || 0} transactions
                                            </div>
                                            <div style={{ marginBottom: '8px' }}>
                                                <strong>Imported:</strong> {importResult.count || 0} transactions
                                            </div>
                                            {importResult.duplicates_skipped > 0 && (
                                                <div style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
                                                    <strong>Skipped duplicates:</strong> {importResult.duplicates_skipped}
                                                </div>
                                            )}
                                            {importResult.failed > 0 && (
                                                <div style={{ marginBottom: '8px', color: 'var(--expense)' }}>
                                                    <strong>Failed:</strong> {importResult.failed}
                                                </div>
                                            )}
                                            {importResult.parse_errors && importResult.parse_errors.length > 0 && (
                                                <div style={{ marginTop: '12px' }}>
                                                    <strong>Parse Errors:</strong>
                                                    <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                                                        {importResult.parse_errors.slice(0, 5).map((error: any, idx: number) => (
                                                            <li key={idx} style={{ fontSize: '11px' }}>
                                                                Row {error.row}: {error.message}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <aside>
                    <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-soft)', marginBottom: '16px' }}>
                        <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Import Tips</h4>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <li><strong>Auto-detect:</strong> Leave source type blank to automatically detect the file format.</li>
                            <li><strong>Bank Statements:</strong> Export as CSV or Excel from your bank's website for best results.</li>
                            <li><strong>Credit Card PDFs:</strong> Ensure PDFs are not password protected and contain transaction tables.</li>
                            <li><strong>Money Manager:</strong> Export as XLS or TSV format for compatibility.</li>
                            <li><strong>Duplicates:</strong> Enable duplicate detection to avoid importing the same transaction twice.</li>
                        </ul>
                    </div>

                    <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-soft)' }}>
                        <h4 style={{ marginBottom: '16px', fontSize: '16px' }}>Supported Formats</h4>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Banks:</strong> Chase, Bank of America, Wells Fargo, Generic CSV/Excel
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Credit Cards:</strong> Chase, Amex, Citi, Capital One PDFs
                            </div>
                            <div>
                                <strong>Other:</strong> Money Manager XLS/TSV
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BulkUpload;
