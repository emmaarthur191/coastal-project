import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

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
      const response = await api.get<any>('fraud/alerts/');
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
      const response = await api.get<any>('fraud/alerts/dashboard-stats/');
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
      await api.patch<any>(`fraud/alerts/${selectedAlert.id}/`, {
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-400 text-amber-900';
      case 'low': return 'bg-blue-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getAlertCardStyle = (severity: string, isResolved: boolean) => {
    if (isResolved) return 'border-gray-100 bg-gray-50 opacity-70';

    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 ring-1 ring-red-100';
      case 'high': return 'border-orange-200 bg-orange-50 ring-1 ring-orange-100';
      case 'medium': return 'border-amber-200 bg-amber-50';
      default: return 'border-blue-100 bg-blue-50';
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
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Security Alerts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🚨</span> Fraud Alerts
          </h2>
          <p className="text-gray-500">Monitor and respond to suspicious activities</p>
        </div>
        <Button variant="primary" onClick={() => { fetchAlerts(); fetchStats(); }}>
          Refresh ↻
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-gray-700">{stats?.total || 0}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Alerts</div>
        </GlassCard>
        <GlassCard className="text-center p-4 border-l-4 border-l-red-500">
          <div className="text-3xl font-black text-red-600">{stats?.unresolved || 0}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unresolved</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-red-600">
            {stats?.by_severity?.find(s => s.severity === 'critical')?.count || 0}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Critical</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-orange-500">
            {stats?.by_severity?.find(s => s.severity === 'high')?.count || 0}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">High</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-emerald-500">
            {(stats?.total || 0) - (stats?.unresolved || 0)}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-end">
        <Input
          as="select"
          label="Severity"
          id="filter-severity"
          title="Filter alerts by severity"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="md:w-48"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Input>

        <Input
          as="select"
          label="Status"
          id="filter-status"
          title="Filter alerts by resolution status"
          value={filterResolved}
          onChange={(e) => setFilterResolved(e.target.value)}
          className="md:w-48"
        >
          <option value="">All</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </Input>

        <Button
          variant="ghost"
          onClick={() => { setFilterSeverity(''); setFilterResolved('false'); }}
          className="md:ml-auto text-gray-500"
        >
          Clear Filters
        </Button>
      </GlassCard>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <GlassCard className="text-center py-16 text-gray-400 italic">
            <div className="text-5xl mb-4 text-emerald-100">✅</div>
            <p>No fraud alerts found matching your criteria</p>
          </GlassCard>
        ) : (
          filteredAlerts.map(alert => (
            <GlassCard
              key={alert.id}
              className={`p-5 pl-6 border-l-4 transition-all ${getAlertCardStyle(alert.severity, alert.is_resolved)} ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'high' ? 'border-l-orange-500' : alert.severity === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="font-bold text-gray-800 uppercase text-sm tracking-wide">
                      {alert.alert_type?.replace(/_/g, ' ') || 'ALERT'}
                    </span>
                    {alert.is_resolved && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                        RESOLVED
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-mono">#{alert.id}</span>
                  </div>

                  <p className="text-gray-800 font-medium mb-3">{alert.description}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 items-center">
                    {alert.user_email && <span className="flex items-center gap-1">👤 <span className="text-gray-700">{alert.user_email}</span></span>}
                    {alert.account_number && <span className="flex items-center gap-1">💳 <span className="font-mono text-gray-700">****{alert.account_number}</span></span>}
                    <span className="flex items-center gap-1">📅 {new Date(alert.created_at).toLocaleString()}</span>
                  </div>

                  {alert.is_resolved && alert.resolution_notes && (
                    <div className="mt-3 p-3 bg-white/60 rounded-lg text-sm text-gray-700 border border-gray-200">
                      <strong className="text-emerald-700 text-xs uppercase block mb-1">Resolution</strong>
                      {alert.resolution_notes}
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
                        className="shadow-md shadow-emerald-50"
                      >
                        ✓ Resolve
                      </Button>
                      <Button variant="secondary" size="sm">
                        Details
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-gray-800">Resolve Fraud Alert</h3>
              <p className="text-gray-500 text-sm mt-1">
                Alert #{selectedAlert.id} - {selectedAlert.alert_type?.replace(/_/g, ' ')}
              </p>
            </div>

            <Input
              as="textarea"
              label="Resolution Notes"
              id="resolution-notes"
              title="Enter notes about how the fraud alert was resolved"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              placeholder="Describe the investigation outcome and actions taken..."
              autoFocus
            />

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
