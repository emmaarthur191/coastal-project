import React, { useState, useEffect, useCallback } from 'react';
import { api, PaginatedResponse } from '../services/api';
import { FraudAlert } from '../api/models/FraudAlert';
import './FraudAlerts.css';

interface FraudStats {
  total?: number;
  unresolved?: number;
  by_severity?: { severity: string; count: number }[];
  critical_alerts?: number;
}

const FraudAlerts = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats>({});
  const [loading, setLoading] = useState(true);
  const [_selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<FraudAlert>>('/api/fraud/alerts/', {
        params: filterStatus !== 'all' ? { status: filterStatus } : {}
      });
      setAlerts(response.data.results || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<FraudStats>('/api/fraud/alerts/dashboard-stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [fetchAlerts, fetchStats]);

  const handleAssignToMe = async (alertId: number) => {
    try {
      await api.post(`/api/fraud/alerts/${alertId}/assign_to_me/`);
      fetchAlerts();
    } catch (error) {
      console.error('Error assigning alert:', error);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await api.post(`/api/fraud/alerts/${alertId}/resolve/`, {
        resolution_notes: resolutionNotes,
        action_taken: actionTaken
      });
      setSelectedAlert(null);
      setResolutionNotes('');
      setActionTaken('');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const _handleEscalate = async (alertId: number, escalatedTo: string, reason: string) => {
    try {
      await api.post(`/api/fraud/alerts/${alertId}/escalate/`, {
        escalated_to: escalatedTo,
        escalation_reason: reason
      });
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error escalating alert:', error);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'fraud-alert-badge fraud-alert-badge--critical';
      case 'high': return 'fraud-alert-badge fraud-alert-badge--high';
      case 'medium': return 'fraud-alert-badge fraud-alert-badge--medium';
      case 'low': return 'fraud-alert-badge fraud-alert-badge--low';
      default: return 'fraud-alert-badge fraud-alert-badge--medium';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'resolved') return alert.is_resolved;
    if (filterStatus === 'unresolved') return !alert.is_resolved;
    return true;
  });

  if (loading) {
    return <div className="fraud-loading">Loading...</div>;
  }

  return (
    <div className="fraud-alerts-container">
      <div className="fraud-alerts-header">
        <h1 className="fraud-alerts-title">Fraud Detection Dashboard</h1>
        <p className="fraud-alerts-subtitle">Monitor and manage suspicious transaction alerts</p>
      </div>

      {/* Statistics Cards */}
      <div className="fraud-stats-grid">
        <div className="fraud-stat-card">
          <div className="fraud-stat-content">
            <div className="fraud-stat-icon fraud-stat-icon--danger">
              ⚠️
            </div>
            <div>
              <p className="fraud-stat-value">{stats.total || 0}</p>
              <p className="fraud-stat-label">Total Alerts</p>
            </div>
          </div>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-content">
            <div className="fraud-stat-icon fraud-stat-icon--warning">
              🕐
            </div>
            <div>
              <p className="fraud-stat-value">{stats.unresolved || 0}</p>
              <p className="fraud-stat-label">Unresolved</p>
            </div>
          </div>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-content">
            <div className="fraud-stat-icon fraud-stat-icon--success">
              ✅
            </div>
            <div>
              <p className="fraud-stat-value">{(stats.total || 0) - (stats.unresolved || 0)}</p>
              <p className="fraud-stat-label">Resolved</p>
            </div>
          </div>
        </div>

        <div className="fraud-stat-card">
          <div className="fraud-stat-content">
            <div className="fraud-stat-icon fraud-stat-icon--info">
              👁️
            </div>
            <div>
              <p className="fraud-stat-value">{stats.critical_alerts || 0}</p>
              <p className="fraud-stat-label">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="fraud-filter-tabs">
        {[
          { value: 'all', label: `All (${stats.total || 0})` },
          { value: 'unresolved', label: `Unresolved (${stats.unresolved || 0})` },
          { value: 'resolved', label: `Resolved (${(stats.total || 0) - (stats.unresolved || 0)})` }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`fraud-filter-tab ${filterStatus === tab.value ? 'fraud-filter-tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="fraud-alerts-list">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="fraud-alert-card">
            <div className="fraud-alert-header">
              <div className="fraud-alert-info">
                <div className="fraud-alert-badges">
                  <span className={getSeverityBadgeClass(alert.severity || 'medium')}>
                    {(alert.severity || 'medium').toUpperCase()}
                  </span>
                  <span className={`fraud-alert-badge ${alert.is_resolved ? 'fraud-alert-badge--resolved' : 'fraud-alert-badge--pending'}`}>
                    {alert.is_resolved ? 'Resolved' : 'Pending'}
                  </span>
                </div>
                <h3 className="fraud-alert-title">
                  {alert.message.split('\n')[0]}
                </h3>
                <p className="fraud-alert-message">{alert.message}</p>
                <div className="fraud-alert-meta">
                  <span className="fraud-alert-meta-item">
                    👤 User ID: {alert.user}
                  </span>
                  <span className="fraud-alert-meta-item">
                    📅 {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="fraud-alert-actions">
                {!alert.is_resolved && (
                  <>
                    <button
                      onClick={() => handleAssignToMe(alert.id)}
                      className="fraud-btn fraud-btn--primary"
                    >
                      Assign to Me
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="fraud-btn fraud-btn--secondary"
                    >
                      Mark as Resolved
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Alert Details Simplified */}
            <div className="fraud-alert-details">
              <div className="fraud-alert-details-grid">
                <div><strong>Alert ID:</strong> {alert.id}</div>
                <div><strong>Resolution:</strong> {alert.is_resolved ? 'Resolved' : 'Pending Action'}</div>
                {alert.resolved_at && <div><strong>Resolved At:</strong> {new Date(alert.resolved_at).toLocaleString()}</div>}
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="fraud-empty-state">
            <div className="fraud-empty-icon">⚠️</div>
            <h3 className="fraud-empty-title">No alerts found</h3>
            <p className="fraud-empty-message">
              {filterStatus === 'all'
                ? 'There are currently no fraud alerts to review.'
                : `No ${filterStatus} alerts found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudAlerts;
