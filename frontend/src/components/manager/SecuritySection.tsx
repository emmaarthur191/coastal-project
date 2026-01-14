import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import './SecuritySection.css';

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

interface SessionUser {
    first_name?: string;
    last_name?: string;
    email?: string;
}

interface ActiveSession {
    id: string;
    user_name?: string;
    user?: SessionUser | string;
    location?: string;
    ip_address?: string;
    device?: string;
    user_agent?: string;
    created_at?: string;
    last_active?: string;
    started_at?: string;
}

const SecuritySection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'audit' | 'logins' | 'fraud' | 'sessions'>('audit');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
    const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchAuditLogs = useCallback(async () => {
        try {
            const response = await api.get<{ audit_logs: AuditLog[] }>('audit/dashboard/');
            setAuditLogs(response.data?.audit_logs || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        }
    }, []);

    const fetchLoginAttempts = useCallback(async () => {
        try {
            const response = await api.get<LoginAttempt[]>('users/auth/login-attempts/');
            setLoginAttempts(response.data || []);
        } catch (error) {
            console.error('Error fetching login attempts:', error);
        }
    }, []);

    const fetchFraudAlerts = useCallback(async () => {
        try {
            const response = await api.get<FraudAlert[] | { results?: FraudAlert[] }>('fraud/alerts/');
            const data = response.data;

            if (Array.isArray(data)) {
                setFraudAlerts(data);
            } else {
                setFraudAlerts(data?.results || []);
            }
        } catch (error) {
            console.error('Error fetching fraud alerts:', error);
        }
    }, []);

    const fetchActiveSessions = useCallback(async () => {
        try {
            const response = await api.get<ActiveSession[]>('users/sessions/');
            setActiveSessions(response.data || []);
        } catch (error) {
            console.error('Error fetching active sessions:', error);
        }
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        await Promise.all([
            fetchAuditLogs(),
            fetchLoginAttempts(),
            fetchFraudAlerts(),
            fetchActiveSessions()
        ]);
        setLoading(false);
    }, [fetchAuditLogs, fetchLoginAttempts, fetchFraudAlerts, fetchActiveSessions]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh every 30 seconds (standard monitor rate)
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, loadData]);

    const getSeverityClass = (severity: string) => {
        const sev = severity.toLowerCase();
        if (['critical', 'high', 'medium', 'low'].includes(sev)) {
            return `severity-${sev}`;
        }
        return 'severity-default';
    };

    const terminateSession = async (sessionId: string) => {
        try {
            await api.post(`users/sessions/${sessionId}/terminate/`);
            fetchActiveSessions();
        } catch (error) {
            console.error('Error terminating session:', error);
        }
    };

    const getSessionDisplayName = (session: ActiveSession): string => {
        if (session.user_name) return session.user_name;

        if (typeof session.user === 'object' && session.user !== null) {
            if (session.user.first_name && session.user.last_name) {
                return `${session.user.first_name} ${session.user.last_name}`;
            }
            return session.user.email || 'Unknown User';
        }

        if (typeof session.user === 'string') {
            return session.user;
        }

        return 'Unknown';
    };

    return (
        <div className="security-section">
            <div className="security-header">
                <h2 className="security-title">🛡️ Security Monitoring</h2>
                <div className="security-controls">
                    <label className="auto-refresh-label">
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
                        className="refresh-button"
                    >
                        {loading ? '⟳ Loading...' : '↻ Refresh'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                {(
                    [
                        { id: 'audit', label: '📋 Audit Logs', count: auditLogs.length },
                        { id: 'logins', label: '🔐 Login Attempts', count: loginAttempts.length },
                        { id: 'fraud', label: '🚨 Fraud Alerts', count: fraudAlerts.length },
                        { id: 'sessions', label: '👥 Active Sessions', count: activeSessions.length }
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                        <span className="tab-count-badge">
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
                <div className="table-container">
                    <table className="security-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header-cell">User</th>
                                <th className="table-header-cell">Action</th>
                                <th className="table-header-cell">Resource</th>
                                <th className="table-header-cell">IP Address</th>
                                <th className="table-header-cell">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state-cell">No audit logs available</td></tr>
                            ) : (
                                auditLogs.slice(0, 50).map((log) => (
                                    <tr key={log.id} className="table-row">
                                        <td className="table-cell">{log.user}</td>
                                        <td className="table-cell">
                                            <span className={`audit-action-badge ${log.action.includes('DELETE') ? 'audit-action-delete' : log.action.includes('CREATE') ? 'audit-action-create' : 'audit-action-default'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="table-cell resource-cell">{log.resource}</td>
                                        <td className="table-cell ip-address-cell">{log.ip_address}</td>
                                        <td className="table-cell timestamp-cell">{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Login Attempts Tab */}
            {activeTab === 'logins' && (
                <div className="table-container">
                    <table className="security-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header-cell">Email</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell">Location/IP</th>
                                <th className="table-header-cell">Device</th>
                                <th className="table-header-cell">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loginAttempts.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state-cell">No login attempts recorded</td></tr>
                            ) : (
                                loginAttempts.slice(0, 50).map((attempt) => (
                                    <tr key={attempt.id} className="table-row">
                                        <td className="table-cell">{attempt.email}</td>
                                        <td className="table-cell">
                                            <span className={`status-badge ${attempt.success ? 'status-success' : 'status-failed'}`}>
                                                {attempt.success ? '✓ Success' : '✗ Failed'}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="location-text">{attempt.location || 'Unknown'}</div>
                                            <div className="ip-subtext">{attempt.ip_address}</div>
                                        </td>
                                        <td className="table-cell timestamp-cell">
                                            <div title={attempt.user_agent}>
                                                {attempt.device || attempt.user_agent.substring(0, 30)}
                                            </div>
                                        </td>
                                        <td className="table-cell timestamp-cell">{new Date(attempt.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fraud Alerts Tab */}
            {activeTab === 'fraud' && (
                <div className="table-container">
                    <table className="security-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header-cell">Type</th>
                                <th className="table-header-cell">Severity</th>
                                <th className="table-header-cell">Description</th>
                                <th className="table-header-cell">Status</th>
                                <th className="table-header-cell">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fraudAlerts.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state-cell">No fraud alerts</td></tr>
                            ) : (
                                fraudAlerts.map((alert) => (
                                    <tr key={alert.id} className="table-row">
                                        <td className="table-cell fraud-alert-type">{alert.alert_type}</td>
                                        <td className="table-cell">
                                            <span className={`severity-badge ${getSeverityClass(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="table-cell alert-description">{alert.description}</td>
                                        <td className="table-cell">
                                            <span className={`fraud-status-badge ${alert.status === 'resolved' ? 'fraud-status-resolved' : 'fraud-status-pending'}`}>
                                                {alert.status}
                                            </span>
                                        </td>
                                        <td className="table-cell timestamp-cell">{new Date(alert.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Active Sessions Tab */}
            {activeTab === 'sessions' && (
                <div className="table-container">
                    <table className="security-table">
                        <thead>
                            <tr className="table-header-row">
                                <th className="table-header-cell">User</th>
                                <th className="table-header-cell">Location/IP</th>
                                <th className="table-header-cell">Device</th>
                                <th className="table-header-cell">Last Active</th>
                                <th className="table-header-cell">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeSessions.length === 0 ? (
                                <tr><td colSpan={5} className="empty-state-cell">No active sessions</td></tr>
                            ) : (
                                activeSessions.filter(session => session != null).map((session) => (
                                    <tr key={session.id} className="table-row">
                                        <td className="table-cell session-user-name">
                                            {getSessionDisplayName(session)}
                                        </td>
                                        <td className="table-cell">
                                            <div className="location-text">{session.location || 'Unknown'}</div>
                                            <div className="ip-subtext">{session.ip_address || 'N/A'}</div>
                                        </td>
                                        <td className="table-cell timestamp-cell">{session.device || session.user_agent || 'Unknown'}</td>
                                        <td className="table-cell timestamp-cell">{session.created_at || session.last_active || session.started_at ? new Date(session.created_at || session.last_active || session.started_at!).toLocaleString() : 'N/A'}</td>
                                        <td className="table-cell">
                                            <button
                                                onClick={() => terminateSession(session.id)}
                                                className="terminate-button"
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
