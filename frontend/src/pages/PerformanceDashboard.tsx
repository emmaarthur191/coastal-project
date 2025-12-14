import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import { Button } from '../components/ui/Button';
import DashboardLayout from '../components/layout/DashboardLayout';

function PerformanceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Performance data state
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>({});
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [transactionVolume, setTransactionVolume] = useState<any>({});
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeView) {
        case 'dashboard':
          await fetchDashboardData();
          break;
        case 'health':
          await fetchSystemHealth();
          break;
        case 'metrics':
          await fetchMetrics();
          break;
        case 'alerts':
          await fetchAlerts();
          break;
        case 'recommendations':
          await fetchRecommendations();
          break;
        case 'analytics':
          await fetchAnalytics();
          break;
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    const result = await authService.getPerformanceDashboardData();
    if (result.success) {
      setDashboardData(result.data);
    }
  };

  const fetchSystemHealth = async () => {
    const result = await authService.getSystemHealth();
    if (result.success) {
      setSystemHealth(result.data);
    }
  };

  const fetchMetrics = async () => {
    const result = await authService.getPerformanceMetrics();
    if (result.success) {
      setMetrics(result.data);
    }
  };

  const fetchAlerts = async () => {
    const result = await authService.getPerformanceAlerts();
    if (result.success) {
      setAlerts(result.data);
    }
  };

  const fetchRecommendations = async () => {
    const result = await authService.getPerformanceRecommendations();
    if (result.success) {
      setRecommendations(result.data);
    }
  };

  const fetchAnalytics = async () => {
    const [volumeResult, chartResult] = await Promise.all([
      authService.getTransactionVolume({ time_range: '24h' }),
      authService.getPerformanceChartData({ metric_type: 'response_time', time_range: '24h' })
    ]);

    if (volumeResult.success) {
      setTransactionVolume(volumeResult.data);
    }
    if (chartResult.success) {
      setChartData(chartResult.data);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'health', name: 'System Health', icon: '❤️' },
    { id: 'metrics', name: 'Metrics', icon: '📈' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' },
    { id: 'recommendations', name: 'Recommendations', icon: '💡' },
    { id: 'analytics', name: 'Analytics', icon: '📉' }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <GlassCard className="flex flex-col items-center justify-center p-12">
          <div className="text-6xl mb-4 animate-bounce-slow">📊</div>
          <h2 className="text-xl font-bold text-gray-800">Loading Performance Data...</h2>
        </GlassCard>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🚀</span> Performance Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardData.map((item, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-3xl mb-3">{item.icon || '📊'}</div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{item.metric}</h4>
                  <p className="text-3xl font-black text-coastal-primary">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.unit}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'health':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🏥</span> System Health Status
            </h3>

            <div className={`
                p-6 rounded-2xl mb-8 border flex items-center gap-4 shadow-sm
                ${systemHealth.status === 'healthy' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}
            `}>
              <div className="text-5xl">
                {systemHealth.status === 'healthy' ? '✅' : '❌'}
              </div>
              <div>
                <h4 className={`text-xl font-black ${systemHealth.status === 'healthy' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {systemHealth.status === 'healthy' ? 'All Systems Operational' : 'System Issues Detected'}
                </h4>
                <p className="text-sm opacity-70">
                  Last check completed successfully
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemHealth.components && systemHealth.components.map((component: any, index: number) => (
                <div key={index} className={`
                    p-5 rounded-2xl border bg-white
                    ${component.status === 'healthy' ? 'border-gray-100' : 'border-red-100 shadow-red-50'}
                `}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-800">{component.name}</h4>
                    <span className="text-xl">{component.status === 'healthy' ? '✅' : '❌'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{component.message}</p>
                  <p className="text-xs text-gray-400 font-medium">
                    Last checked: {new Date(component.last_check).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'metrics':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Detailed Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 
                       ${metric.status === 'good' ? 'bg-emerald-500' : metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
                   `}></div>

                  <h4 className="font-bold text-gray-800 mb-4 relative z-10">{metric.name}</h4>

                  <div className="flex items-end gap-2 mb-2 relative z-10">
                    <span className="text-3xl font-black text-gray-900">{metric.value}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase mb-1.5">{metric.unit}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className={`
                          w-2 h-2 rounded-full
                          ${metric.status === 'good' ? 'bg-emerald-500' : metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
                      `}></span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{metric.status}</span>
                  </div>

                  <p className="text-sm text-gray-500 relative z-10">
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'alerts':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Performance Alerts</h3>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No active alerts
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className={`
                        p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center
                        ${alert.severity === 'critical' ? 'bg-red-50 border-red-100' :
                      alert.severity === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}
                    `}>
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">
                          {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <h4 className={`font-bold ${alert.severity === 'critical' ? 'text-red-900' :
                            alert.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'
                          }`}>{alert.title}</h4>
                      </div>
                      <p className={`text-sm ml-8 ${alert.severity === 'critical' ? 'text-red-700' :
                          alert.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'
                        }`}>{alert.message}</p>
                      <p className="text-xs opacity-60 ml-8 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className={`
                            bg-white hover:bg-opacity-80 border-transparent shadow-sm
                            ${alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}
                        `}
                      onClick={() => {/* Handle alert action */ }}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        );

      case 'recommendations':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">System Recommendations</h3>
            <div className="space-y-6">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl text-indigo-600">
                    💡
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-800 mb-2">{rec.title}</h4>
                    <p className="text-gray-600 mb-4 leading-relaxed">{rec.description}</p>

                    <div className="flex flex-wrap gap-4">
                      <div className="bg-gray-50 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-100">
                        Category: <span className="text-gray-800">{rec.category}</span>
                      </div>
                      <div className="bg-gray-50 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-100">
                        Impact: <span className="text-gray-800">{rec.impact}</span>
                      </div>
                      <div className="bg-gray-50 px-3 py-1 rounded-lg text-xs font-medium text-gray-500 border border-gray-100">
                        Effort: <span className="text-gray-800">{rec.effort}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="primary">Implement</Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6 text-center">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Total Volume</h4>
                <div className="text-4xl font-black text-coastal-primary">{transactionVolume.total || 0}</div>
                <div className="text-xs text-gray-400 mt-1">transactions (24h)</div>
              </GlassCard>
              <GlassCard className="p-6 text-center">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Success Rate</h4>
                <div className="text-4xl font-black text-emerald-500">{transactionVolume.success_rate || 0}%</div>
                <div className="text-xs text-gray-400 mt-1">completion rate</div>
              </GlassCard>
              <GlassCard className="p-6 text-center">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Avg Response</h4>
                <div className="text-4xl font-black text-blue-500">{transactionVolume.avg_response_time || 0}ms</div>
                <div className="text-xs text-gray-400 mt-1">latency</div>
              </GlassCard>
            </div>

            <GlassCard className="p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Response Time Analysis</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-20">📉</div>
                  <p className="text-gray-400 font-medium">Chart Visualization Placeholder</p>
                  <p className="text-xs text-gray-300 mt-1">{chartData.length} data points available</p>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Performance Monitor"
      user={user}
      menuItems={menuItems}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default PerformanceDashboard;