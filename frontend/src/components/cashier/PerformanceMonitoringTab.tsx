import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader } from './CashierTheme';
import { api } from '../../services/api.ts';

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
      setPerformanceData(response.data);
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
      case 'healthy': return '#00B894';
      case 'warning': return '#FDCB6E';
      case 'critical': return '#FF7675';
      default: return '#636E72';
    }
  };

  if (loading) {
    return (
      <PlayfulCard>
        <h2>📈 Performance Monitoring</h2>
        <SkeletonLoader />
      </PlayfulCard>
    );
  }

  return (
    <PlayfulCard>
      <h2>📈 Performance Monitoring</h2>
      <p>Monitor system performance and metrics.</p>

      {message.text && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
          color: message.type === 'error' ? '#C62828' : '#2E7D32',
          border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
        }}>
          {message.text}
        </div>
      )}

      {performanceData && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Performance Summary */}
          <div>
            <h3>Performance Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2D3436' }}>
                  {performanceData.performance_summary.total_metrics}
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Total Metrics</div>
              </div>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2D3436' }}>
                  {performanceData.performance_summary.average_response_time.toFixed(2)}ms
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Avg Response Time</div>
              </div>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2D3436' }}>
                  {performanceData.performance_summary.throughput.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Throughput</div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div>
            <h3>System Health</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStatusColor(performanceData.system_health.overall_status) }}>
                  {performanceData.system_health.overall_status.toUpperCase()}
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Overall Status</div>
              </div>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00B894' }}>
                  {performanceData.system_health.healthy_components}
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Healthy</div>
              </div>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FDCB6E' }}>
                  {performanceData.system_health.warning_components}
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Warning</div>
              </div>
              <div style={{ padding: '15px', border: '1px solid #DFE6E9', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF7675' }}>
                  {performanceData.system_health.critical_components}
                </div>
                <div style={{ fontSize: '14px', color: '#636E72' }}>Critical</div>
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          {performanceData.active_alerts.length > 0 && (
            <div>
              <h3>Active Alerts ({performanceData.active_alerts.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #DFE6E9', borderRadius: '8px' }}>
                {performanceData.active_alerts.map((alert) => (
                  <div key={alert.id} style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid #F0F0F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{alert.title}</span>
                      <span style={{ marginLeft: '10px', color: '#636E72', fontSize: '14px' }}>
                        {alert.description}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getStatusColor(alert.alert_level)
                    }}>
                      {alert.alert_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Recommendations */}
          {performanceData.recent_recommendations.length > 0 && (
            <div>
              <h3>Recent Recommendations ({performanceData.recent_recommendations.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #DFE6E9', borderRadius: '8px' }}>
                {performanceData.recent_recommendations.map((rec) => (
                  <div key={rec.id} style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid #F0F0F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{rec.title}</span>
                      <span style={{ marginLeft: '10px', color: '#636E72', fontSize: '14px' }}>
                        {rec.description}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: rec.priority === 'high' ? '#FF7675' : rec.priority === 'medium' ? '#FDCB6E' : '#00B894'
                    }}>
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PlayfulCard>
  );
};

export default PerformanceMonitoringTab;