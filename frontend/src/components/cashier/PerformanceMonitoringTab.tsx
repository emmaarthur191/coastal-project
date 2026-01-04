import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';

interface PerformanceData {
  performance_summary: {
    total_metrics: number;
    metric_types: Record<string, number>;
    time_range: string;
    average_response_time: number;
    error_rate: number;
    throughput: number;
  };
  system_health: {
    total_components: number;
    healthy_components: number;
    warning_components: number;
    critical_components: number;
    overall_status: string;
    last_updated: string;
  };
  transaction_volume: Array<{
    date: string;
    deposits: number;
    withdrawals: number;
    transfers: number;
    total_amount: number;
    average_transaction_value: number;
  }>;
  active_alerts: Array<{
    id: string;
    title: string;
    description: string;
    alert_level: string;
    status: string;
    triggered_at: string;
  }>;
  recent_recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
}

const PerformanceMonitoringTab: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('performance/dashboard-data/');
      // Ensure we have valid data structure with defaults
      const data = response.data || {};
      setPerformanceData({
        performance_summary: data.performance_summary || {
          total_metrics: 0,
          metric_types: {},
          time_range: '',
          average_response_time: 0,
          error_rate: 0,
          throughput: 0
        },
        system_health: data.system_health || {
          total_components: 0,
          healthy_components: 0,
          warning_components: 0,
          critical_components: 0,
          overall_status: 'unknown',
          last_updated: ''
        },
        transaction_volume: data.transaction_volume || [],
        active_alerts: data.active_alerts || [],
        recent_recommendations: data.recent_recommendations || []
      });
    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      if (error.response?.status === 401) {
        setMessage({ type: 'error', text: 'Authentication required to view performance data' });
      } else if (error.response?.status === 403) {
        setMessage({ type: 'error', text: 'Insufficient permissions to view performance data' });
      } else {
        setMessage({ type: 'error', text: 'Failed to load performance data' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500 bg-emerald-50';
      case 'warning': return 'text-amber-500 bg-amber-50';
      case 'critical': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📈</span> Performance Monitoring
        </h2>
        <p className="text-gray-500">Real-time system health and performance metrics.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {performanceData && (
        <div className="space-y-6">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 text-center">
              <div className="text-3xl font-black text-gray-800 mb-1">{performanceData.performance_summary.total_metrics}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Metrics</div>
            </GlassCard>
            <GlassCard className="p-6 text-center">
              <div className="text-3xl font-black text-blue-600 mb-1">{performanceData.performance_summary.average_response_time.toFixed(2)}ms</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Response Time</div>
            </GlassCard>
            <GlassCard className="p-6 text-center">
              <div className="text-3xl font-black text-violet-600 mb-1">{performanceData.performance_summary.throughput.toFixed(2)}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Throughput (req/sec)</div>
            </GlassCard>
          </div>

          {/* System Health */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">System Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl text-center ${getStatusColor(performanceData.system_health.overall_status)}`}>
                <div className="text-2xl font-bold mb-1 uppercase tracking-wider">{performanceData.system_health.overall_status}</div>
                <div className="text-[10px] opacity-70 uppercase font-bold">Overall Status</div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold mb-1">{performanceData.system_health.healthy_components}</div>
                <div className="text-[10px] opacity-70 uppercase font-bold">Healthy Nodes</div>
              </div>
              <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold mb-1">{performanceData.system_health.warning_components}</div>
                <div className="text-[10px] opacity-70 uppercase font-bold">Warnings</div>
              </div>
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold mb-1">{performanceData.system_health.critical_components}</div>
                <div className="text-[10px] opacity-70 uppercase font-bold">Critical Errors</div>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Alerts */}
            <GlassCard className="p-6 h-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span>Active Alerts</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{performanceData.active_alerts.length}</span>
              </h3>
              {performanceData.active_alerts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">No active alerts. System running smoothly.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {performanceData.active_alerts.map((alert) => (
                    <div key={alert.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{alert.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{alert.description}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${getAlertLevelBadge(alert.alert_level)}`}>
                        {alert.alert_level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Recent Recommendations */}
            <GlassCard className="p-6 h-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span>Recommendations</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{performanceData.recent_recommendations.length}</span>
              </h3>
              {performanceData.recent_recommendations.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">No recommendations at this time.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {performanceData.recent_recommendations.map((rec) => (
                    <div key={rec.id} className="p-3 border border-gray-100 rounded-lg bg-white shadow-sm flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{rec.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{rec.description}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {rec.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitoringTab;
