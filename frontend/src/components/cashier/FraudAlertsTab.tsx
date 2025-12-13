import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrencyGHS } from '../../utils/formatters';

interface FraudAlert {
  id: number;
  user?: number;
  user_email?: string;
  account?: number;
  account_number?: string;
  transaction?: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

interface FraudStats {
  total: number;
  unresolved: number;
  by_severity: { severity: string; count: number }[];
  recent_alerts: FraudAlert[];
}

const FraudAlertsTab: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterResolved, setFilterResolved] = useState<string>('false');

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('fraud/alerts/');
      const data = response.data?.results || response.data || [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('fraud/alerts/dashboard_stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching fraud stats:', error);
      setStats(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;

    setProcessing(true);
    try {
      await api.patch(`fraud/alerts/${selectedAlert.id}/`, {
        is_resolved: true,
        resolution_notes: resolutionNotes
      });
      setMessage({ type: 'success', text: 'Alert resolved successfully' });
      setShowResolveModal(false);
      setSelectedAlert(null);
      setResolutionNotes('');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error resolving alert:', error);
      setMessage({ type: 'error', text: 'Failed to resolve alert' });
    } finally {
      setProcessing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = !filterSeverity || alert.severity === filterSeverity;
    const matchesResolved = filterResolved === '' ||
      (filterResolved === 'true' && alert.is_resolved) ||
      (filterResolved === 'false' && !alert.is_resolved);
    return matchesSeverity && matchesResolved;
  });

  if (loading) {
    return (
      <Card className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-secondary-600">Loading fraud alerts...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">🚨 Fraud Alerts</h2>
          <p className="text-secondary-600">Monitor and respond to suspicious activities</p>
        </div>
        <Button variant="primary" onClick={() => { fetchAlerts(); fetchStats(); }}>
          ↻ Refresh
        </Button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-secondary-700">{stats?.total || 0}</div>
          <div className="text-secondary-500 text-sm">Total Alerts</div>
        </Card>
        <Card className="text-center p-4 border-l-4 border-l-red-500">
          <div className="text-3xl font-bold text-red-600">{stats?.unresolved || 0}</div>
          <div className="text-secondary-500 text-sm">Unresolved</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-red-600">
            {stats?.by_severity?.find(s => s.severity === 'critical')?.count || 0}
          </div>
          <div className="text-secondary-500 text-sm">Critical</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-orange-600">
            {stats?.by_severity?.find(s => s.severity === 'high')?.count || 0}
          </div>
          <div className="text-secondary-500 text-sm">High</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-green-600">
            {(stats?.total || 0) - (stats?.unresolved || 0)}
          </div>
          <div className="text-secondary-500 text-sm">Resolved</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-secondary-600 mb-1">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="p-2 border border-secondary-300 rounded-lg"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-600 mb-1">Status</label>
            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="p-2 border border-secondary-300 rounded-lg"
            >
              <option value="">All</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
          </div>
          <div className="flex-1" />
          <Button
            variant="secondary"
            onClick={() => { setFilterSeverity(''); setFilterResolved('false'); }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Alerts List */}
      <Card>
        <h3 className="text-lg font-bold text-secondary-900 mb-4">
          Fraud Alerts ({filteredAlerts.length})
        </h3>

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <div className="text-4xl mb-2">✅</div>
            <p>No fraud alerts found</p>
            <p className="text-sm">All clear!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${getSeverityBgColor(alert.severity)} ${alert.is_resolved ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="font-bold text-secondary-800">
                        {alert.alert_type?.replace(/_/g, ' ')?.toUpperCase() || 'ALERT'}
                      </span>
                      {alert.is_resolved && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-green-500 text-white">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <p className="text-secondary-700 mb-2">{alert.description}</p>
                    <div className="text-sm text-secondary-500 flex flex-wrap gap-4">
                      <span>🆔 Alert #{alert.id}</span>
                      {alert.user_email && <span>👤 {alert.user_email}</span>}
                      {alert.account_number && <span>💳 ****{alert.account_number}</span>}
                      <span>📅 {new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                    {alert.is_resolved && alert.resolution_notes && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                        <strong>Resolution:</strong> {alert.resolution_notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!alert.is_resolved && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowResolveModal(true);
                          }}
                        >
                          ✓ Resolve
                        </Button>
                        <Button variant="primary" size="sm">
                          🔍 Investigate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resolve Modal */}
      {showResolveModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-secondary-900 mb-4">Resolve Fraud Alert</h3>
            <p className="text-secondary-600 mb-4">
              Alert #{selectedAlert.id} - {selectedAlert.alert_type?.replace(/_/g, ' ')}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-3 border border-secondary-300 rounded-lg"
                rows={4}
                placeholder="Describe the investigation outcome and actions taken..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedAlert(null);
                  setResolutionNotes('');
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleResolve}
                disabled={processing}
              >
                {processing ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudAlertsTab;