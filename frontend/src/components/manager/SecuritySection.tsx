import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface AuditLog {
    id: number;
    user: string;
    action: string;
    resource: string;
    timestamp: string;
    ip_address: string;
    details: string;
}

interface LoginAttempt {
    id: number;
    email: string;
    success: boolean;
    ip_address: string;
    timestamp: string;
    user_agent: string;
    location?: string;
    device?: string;
}

interface FraudAlert {
    id: number;
    alert_type: string;
    severity: string;
    description: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
}

const SecuritySection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'audit' | 'logins' | 'fraud' | 'sessions'>('audit');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
    const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
    const [activeSessions, setActiveSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchAuditLogs = async () => {
        try {
            const response = await api.get('audit/dashboard/');
            setAuditLogs(response.data?.audit_logs || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        }
    };

    const fetchLoginAttempts = async () => {
        try {
            const response = await api.get('users/auth/login-attempts/');
            setLoginAttempts(response.data || []);
        } catch (error) {
            console.error('Error fetching login attempts:', error);
        }
    };

    const fetchFraudAlerts = async () => {
        try {
            const response = await api.get('fraud/alerts/');
            setFraudAlerts(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching fraud alerts:', error);
        }
    };

    const fetchActiveSessions = async () => {
        try {
            const response = await api.get('users/sessions/');
            setActiveSessions(response.data || []);
        } catch (error) {
            console.error('Error fetching active sessions:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([
            fetchAuditLogs(),
            fetchLoginAttempts(),
            fetchFraudAlerts(),
            fetchActiveSessions()
        ]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Auto-refresh every 30 seconds (standard monitor rate)
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#ca8a04';
            case 'low': return '#16a34a';
            default: return '#6b7280';
        }
    };

    const terminateSession = async (sessionId: string) => {
        try {
            await api.post(`users/sessions/${sessionId}/terminate/`);
            fetchActiveSessions();
        } catch (error) {
            console.error('Error terminating session:', error);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>🛡️ Security Monitoring</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh (30s)
                    </label>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            background: loading ? '#94a3b8' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? '⟳ Loading...' : '↻ Refresh'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                {[
                    { id: 'audit', label: '📋 Audit Logs', count: auditLogs.length },
                    { id: 'logins', label: '🔐 Login Attempts', count: loginAttempts.length },
                    { id: 'fraud', label: '🚨 Fraud Alerts', count: fraudAlerts.length },
                    { id: 'sessions', label: '👥 Active Sessions', count: activeSessions.length }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === tab.id ? '#1e40af' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {tab.label}
                        <span style={{
                            background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                        }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>User</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Action</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Resource</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>IP Address</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No audit logs available</td></tr>
                            ) : (
                                auditLogs.slice(0, 50).map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>{log.user}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: log.action.includes('DELETE') ? '#fee2e2' : log.action.includes('CREATE') ? '#dcfce7' : '#e0f2fe',
                                                color: log.action.includes('DELETE') ? '#dc2626' : log.action.includes('CREATE') ? '#16a34a' : '#0284c7',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{log.resource}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{log.ip_address}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Login Attempts Tab */}
            {activeTab === 'logins' && (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Email</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Location/IP</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Device</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loginAttempts.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No login attempts recorded</td></tr>
                            ) : (
                                loginAttempts.slice(0, 50).map((attempt) => (
                                    <tr key={attempt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px' }}>{attempt.email}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                background: attempt.success ? '#dcfce7' : '#fee2e2',
                                                color: attempt.success ? '#16a34a' : '#dc2626',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {attempt.success ? '✓ Success' : '✗ Failed'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: '500', fontSize: '13px' }}>{attempt.location || 'Unknown'}</div>
                                            <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>{attempt.ip_address}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                                            <div title={attempt.user_agent}>
                                                {attempt.device || attempt.user_agent.substring(0, 30)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{new Date(attempt.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fraud Alerts Tab */}
            {activeTab === 'fraud' && (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Type</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Severity</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Description</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fraudAlerts.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No fraud alerts</td></tr>
                            ) : (
                                fraudAlerts.map((alert) => (
                                    <tr key={alert.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{alert.alert_type}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                background: getSeverityColor(alert.severity) + '20',
                                                color: getSeverityColor(alert.severity),
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '300px' }}>{alert.description}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                background: alert.status === 'resolved' ? '#dcfce7' : '#fef9c3',
                                                color: alert.status === 'resolved' ? '#16a34a' : '#ca8a04',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {alert.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{new Date(alert.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Active Sessions Tab */}
            {activeTab === 'sessions' && (
                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>User</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Location/IP</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Device</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Last Active</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeSessions.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No active sessions</td></tr>
                            ) : (
                                activeSessions.filter(session => session != null).map((session) => (
                                    <tr key={session.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                                            {session.user_name ||
                                                (session.user?.first_name && session.user?.last_name
                                                    ? `${session.user.first_name} ${session.user.last_name}`
                                                    : session.user?.email || session.user || 'Unknown')}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: '500', fontSize: '13px' }}>{session.location || 'Unknown'}</div>
                                            <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>{session.ip_address || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{session.device || session.user_agent || 'Unknown'}</td>
                                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{session.created_at || session.last_active || session.started_at ? new Date(session.created_at || session.last_active || session.started_at).toLocaleString() : 'N/A'}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                onClick={() => terminateSession(session.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Terminate
                                            </button>
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

export default SecuritySection;
