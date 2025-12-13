import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Account {
    id: number;
    account_number: string;
    account_type: string;
    account_type_display?: string;
    balance: number;
    calculated_balance?: number;
}

interface ServiceRequest {
    id: number;
    request_type: string;
    status: string;
    created_at: string;
    admin_notes: string;
}

const RequestServicesTab: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'statement' | 'checkbook' | 'history'>('statement');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Statement form
    const [statementForm, setStatementForm] = useState({
        account_id: '',
        start_date: '',
        end_date: ''
    });

    // Checkbook form
    const [checkbookForm, setCheckbookForm] = useState({
        account_id: '',
        quantity: '1',
        notes: ''
    });

    useEffect(() => {
        fetchAccounts();
        fetchRequests();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('accounts/');
            setAccounts(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await api.get('services/requests/');
            setRequests(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleStatementRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statementForm.account_id || !statementForm.start_date || !statementForm.end_date) {
            setMessage({ type: 'error', text: 'Please fill all fields' });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('operations/statements/request_statement/', {
                account_id: parseInt(statementForm.account_id),
                start_date: statementForm.start_date,
                end_date: statementForm.end_date
            });

            if (response.data?.success) {
                setMessage({ type: 'success', text: 'Statement generated successfully! You can download it from history.' });
                setStatementForm({ account_id: '', start_date: '', end_date: '' });
                fetchRequests();
                setActiveTab('history');
            } else {
                setMessage({ type: 'error', text: response.data?.error || 'Failed to generate statement' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error requesting statement' });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckbookRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!checkbookForm.account_id) {
            setMessage({ type: 'error', text: 'Please select an account' });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('services/requests/', {
                request_type: 'checkbook',
                account_id: parseInt(checkbookForm.account_id),
                quantity: parseInt(checkbookForm.quantity),
                notes: checkbookForm.notes,
                delivery_method: 'pickup'
            });

            setMessage({ type: 'success', text: 'Checkbook request submitted! Awaiting Operations Manager approval.' });
            setCheckbookForm({ account_id: '', quantity: '1', notes: '' });
            fetchRequests();
            setActiveTab('history');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error submitting request' });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        marginBottom: '16px'
    };

    const buttonStyle = {
        background: '#1e40af',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600' as const,
        cursor: 'pointer',
        width: '100%'
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            pending: { bg: '#fef9c3', text: '#ca8a04' },
            processing: { bg: '#dbeafe', text: '#1d4ed8' },
            completed: { bg: '#dcfce7', text: '#16a34a' },
            rejected: { bg: '#fee2e2', text: '#dc2626' }
        };
        const style = colors[status] || colors.pending;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                background: style.bg,
                color: style.text,
                fontSize: '12px',
                fontWeight: '600'
            }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>
                🏦 Request Services
            </h2>

            {message.text && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#16a34a' : '#dc2626'
                }}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {[
                    { id: 'statement', label: '📜 Account Statement' },
                    { id: 'checkbook', label: '📝 Request Checkbook' },
                    { id: 'history', label: '📋 My Requests' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === tab.id ? '#1e40af' : '#f1f5f9',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Statement Request */}
            {activeTab === 'statement' && (
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Request Account Statement</h3>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>
                        Generate a PDF statement of your account activity for a specific period.
                        The statement will be generated instantly based on your transaction history.
                    </p>
                    <form onSubmit={handleStatementRequest}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                            Select Account
                        </label>
                        <select
                            value={statementForm.account_id}
                            onChange={(e) => setStatementForm({ ...statementForm, account_id: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">-- Select Account --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_number} - {acc.account_type_display || acc.account_type} (GHS {Number(acc.calculated_balance ?? acc.balance ?? 0).toFixed(2)})
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={statementForm.start_date}
                                    onChange={(e) => setStatementForm({ ...statementForm, start_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={statementForm.end_date}
                                    onChange={(e) => setStatementForm({ ...statementForm, end_date: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={buttonStyle}>
                            {loading ? 'Generating...' : '📥 Generate Statement'}
                        </button>
                    </form>
                </div>
            )}

            {/* Checkbook Request */}
            {activeTab === 'checkbook' && (
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Request Checkbook</h3>
                    <p style={{ color: '#64748b', marginBottom: '20px' }}>
                        Submit a request for a new checkbook. Your request will be reviewed by the Operations Manager.
                    </p>
                    <form onSubmit={handleCheckbookRequest}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                            Select Account
                        </label>
                        <select
                            value={checkbookForm.account_id}
                            onChange={(e) => setCheckbookForm({ ...checkbookForm, account_id: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="">-- Select Account --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_number} - {acc.account_type}
                                </option>
                            ))}
                        </select>

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                            Number of Checkbooks
                        </label>
                        <select
                            value={checkbookForm.quantity}
                            onChange={(e) => setCheckbookForm({ ...checkbookForm, quantity: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="1">1 Checkbook (25 leaves)</option>
                            <option value="2">2 Checkbooks (50 leaves)</option>
                            <option value="3">3 Checkbooks (75 leaves)</option>
                        </select>

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            value={checkbookForm.notes}
                            onChange={(e) => setCheckbookForm({ ...checkbookForm, notes: e.target.value })}
                            placeholder="Any special requirements..."
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        />

                        <button type="submit" disabled={loading} style={buttonStyle}>
                            {loading ? 'Submitting...' : '📝 Submit Request'}
                        </button>
                    </form>
                </div>
            )}

            {/* Request History */}
            {activeTab === 'history' && (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Type</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                        No service requests yet
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                                            {req.request_type === 'checkbook' ? '📝 Checkbook' :
                                                req.request_type === 'statement' ? '📜 Statement' : req.request_type}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{getStatusBadge(req.status)}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                                            {req.admin_notes || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RequestServicesTab;
