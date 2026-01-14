import React, { useState, useEffect } from 'react';
import { api, ServiceRequest, Account } from '../../services/api';
import { AxiosError } from 'axios';
import './RequestServicesTab.css';

interface RequestServicesTabProps {
    serviceRequests?: ServiceRequest[];
    onRequestUpdate?: () => void;
}

const RequestServicesTab: React.FC<RequestServicesTabProps> = ({
    serviceRequests = [],
    onRequestUpdate
}) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
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
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get<{ results: Account[] } | Account[]>('accounts/');
            if (Array.isArray(response.data)) {
                setAccounts(response.data);
            } else {
                setAccounts(response.data?.results || []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
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
            const response = await api.post<{ success: boolean; error?: string }>('operations/statements/request_statement/', {
                account_id: parseInt(statementForm.account_id),
                start_date: statementForm.start_date,
                end_date: statementForm.end_date
            });

            if (response.data?.success) {
                setMessage({ type: 'success', text: 'Statement generated successfully! You can download it from history.' });
                setStatementForm({ account_id: '', start_date: '', end_date: '' });
                onRequestUpdate?.();
                setActiveTab('history');
            } else {
                setMessage({ type: 'error', text: response.data?.error || 'Failed to generate statement' });
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                setMessage({ type: 'error', text: error.message || 'Error requesting statement' });
            } else {
                setMessage({ type: 'error', text: 'Error requesting statement' });
            }
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
            await api.post('services/requests/', {
                request_type: 'checkbook',
                account_id: parseInt(checkbookForm.account_id),
                quantity: parseInt(checkbookForm.quantity),
                notes: checkbookForm.notes,
                delivery_method: 'pickup'
            });

            setMessage({ type: 'success', text: 'Checkbook request submitted! Awaiting Operations Manager approval.' });
            setCheckbookForm({ account_id: '', quantity: '1', notes: '' });
            onRequestUpdate?.();
            setActiveTab('history');
        } catch (error) {
            if (error instanceof AxiosError) {
                setMessage({ type: 'error', text: error.message || 'Error submitting request' });
            } else {
                setMessage({ type: 'error', text: 'Error submitting request' });
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        return (
            <span className={`status-badge ${status}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div>
            <h2 className="request-services-header">
                🏦 Request Services
            </h2>

            {message.text && (
                <div className={`message-box ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-container">
                {(
                    [
                        { id: 'statement', label: '📜 Account Statement' },
                        { id: 'checkbook', label: '📝 Request Checkbook' },
                        { id: 'history', label: '📋 My Requests' }
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Statement Request */}
            {activeTab === 'statement' && (
                <div className="form-card">
                    <h3 className="form-card-title">Request Account Statement</h3>
                    <p className="form-card-description">
                        Generate a PDF statement of your account activity for a specific period.
                        The statement will be generated instantly based on your transaction history.
                    </p>
                    <form onSubmit={handleStatementRequest}>
                        <label className="form-label">
                            Select Account
                        </label>
                        <select
                            title="Select Account"
                            value={statementForm.account_id}
                            onChange={(e) => setStatementForm({ ...statementForm, account_id: e.target.value })}
                            className="request-service-input"
                        >
                            <option value="">-- Select Account --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_number} - {acc.account_type_display || acc.account_type} (GHS {Number(acc.calculated_balance ?? acc.balance ?? 0).toFixed(2)})
                                </option>
                            ))}
                        </select>

                        <div className="date-grid">
                            <div>
                                <label className="form-label">
                                    Start Date
                                </label>
                                <input
                                    title="Start Date"
                                    type="date"
                                    value={statementForm.start_date}
                                    onChange={(e) => setStatementForm({ ...statementForm, start_date: e.target.value })}
                                    className="request-service-input"
                                />
                            </div>
                            <div>
                                <label className="form-label">
                                    End Date
                                </label>
                                <input
                                    title="End Date"
                                    type="date"
                                    value={statementForm.end_date}
                                    onChange={(e) => setStatementForm({ ...statementForm, end_date: e.target.value })}
                                    className="request-service-input"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="request-service-button">
                            {loading ? 'Generating...' : '📥 Generate Statement'}
                        </button>
                    </form>
                </div>
            )}

            {/* Checkbook Request */}
            {activeTab === 'checkbook' && (
                <div className="form-card">
                    <h3 className="form-card-title">Request Checkbook</h3>
                    <p className="form-card-description">
                        Submit a request for a new checkbook. Your request will be reviewed by the Operations Manager.
                    </p>
                    <form onSubmit={handleCheckbookRequest}>
                        <label className="form-label">
                            Select Account
                        </label>
                        <select
                            title="Select Account"
                            value={checkbookForm.account_id}
                            onChange={(e) => setCheckbookForm({ ...checkbookForm, account_id: e.target.value })}
                            className="request-service-input"
                        >
                            <option value="">-- Select Account --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_number} - {acc.account_type}
                                </option>
                            ))}
                        </select>

                        <label className="form-label">
                            Number of Checkbooks
                        </label>
                        <select
                            title="Number of Checkbooks"
                            value={checkbookForm.quantity}
                            onChange={(e) => setCheckbookForm({ ...checkbookForm, quantity: e.target.value })}
                            className="request-service-input"
                        >
                            <option value="1">1 Checkbook (25 leaves)</option>
                            <option value="2">2 Checkbooks (50 leaves)</option>
                            <option value="3">3 Checkbooks (75 leaves)</option>
                        </select>

                        <label className="form-label">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            value={checkbookForm.notes}
                            onChange={(e) => setCheckbookForm({ ...checkbookForm, notes: e.target.value })}
                            placeholder="Any special requirements..."
                            className="request-service-input request-service-textarea"
                        />

                        <button type="submit" disabled={loading} className="request-service-button">
                            {loading ? 'Submitting...' : '📝 Submit Request'}
                        </button>
                    </form>
                </div>
            )}

            {/* Request History */}
            {activeTab === 'history' && (
                <div className="table-container">
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="empty-state">
                                        No service requests yet
                                    </td>
                                </tr>
                            ) : (
                                serviceRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td className="type-cell">
                                            {req.request_type === 'checkbook' ? '📝 Checkbook' :
                                                req.request_type === 'statement' ? '📜 Statement' : req.request_type}
                                        </td>
                                        <td>{getStatusBadge(req.status)}</td>
                                        <td className="meta-cell">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="meta-cell">
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
