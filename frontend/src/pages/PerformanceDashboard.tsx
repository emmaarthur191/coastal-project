import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, PerformanceDashboardData, SystemHealthData, SystemHealthComponent, PerformanceMetric, PerformanceAlert, PerformanceRecommendation, TransactionVolumeSummary, PerformanceChartData, MLModelStatus } from '../services/api';
import MLStatusCard from '../components/operational/MLStatusCard';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import ModernStatCard from '../components/ui/modern/ModernStatCard';
import { Button } from '../components/ui/Button';
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  AlertOctagon, 
  Lightbulb, 
  TrendingDown, 
  BrainCircuit,
  Rocket,
  CheckCircle2,
  XCircle,
  Info,
  Shield,
  Loader2
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

function PerformanceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Performance data state
  const [dashboardData, setDashboardData] = useState<PerformanceDashboardData[]>([]);
  const [systemHealth, setSystemHealth] = useState<Partial<SystemHealthData>>({});
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [transactionVolume, setTransactionVolume] = useState<Partial<TransactionVolumeSummary>>({});
  const [chartData, setChartData] = useState<Partial<PerformanceChartData>>({});
  const [mlStatus, setMlStatus] = useState<MLModelStatus | null>(null);
  const [mlLoading, setMlLoading] = useState(false);

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
        case 'ml':
          await fetchMLStatus();
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
    if (result.success && result.data) {
      setDashboardData(result.data);
    }
  };

  const fetchSystemHealth = async () => {
    const result = await authService.getSystemHealth();
    if (result.success && result.data) {
      setSystemHealth(result.data);
    }
  };

  const fetchMetrics = async () => {
    const result = await authService.getPerformanceMetrics();
    if (result.success && result.data) {
      setMetrics(result.data);
    }
  };

  const fetchAlerts = async () => {
    const result = await authService.getPerformanceAlerts();
    if (result.success && result.data) {
      setAlerts(result.data);
    }
  };

  const fetchRecommendations = async () => {
    const result = await authService.getPerformanceRecommendations();
    if (result.success && result.data) {
      setRecommendations(result.data);
    }
  };

  const fetchAnalytics = async () => {
    const safeFetch = async <T,>(p: Promise<T>) => p.catch(_e => ({ success: false, data: undefined } as unknown as T));
    const [volumeResult, chartResult] = await Promise.all([
      safeFetch(authService.getTransactionVolume({ time_range: '24h' })),
      safeFetch(authService.getPerformanceChartData({ metric_type: 'response_time', time_range: '24h' }))
    ]);

    if (volumeResult.success && volumeResult.data) {
      setTransactionVolume(volumeResult.data as unknown as TransactionVolumeSummary);
    }
    if (chartResult.success && chartResult.data) {
      setChartData(chartResult.data);
    }
  };
  
  const fetchMLStatus = async () => {
    setMlLoading(true);
    const result = await authService.getMLModelStatus();
    if (result.success && result.data) {
      setMlStatus(result.data);
    }
    setMlLoading(false);
  };

  const handleTrainModel = async () => {
    setMlLoading(true);
    const result = await authService.trainMLModel();
    if (result.success) {
      // Refresh status after starting training
      setTimeout(fetchMLStatus, 2000);
    }
    setMlLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', name: 'Overview', icon: <BarChart3 className="w-full h-full text-indigo-500" /> },
    { id: 'health', name: 'Health', icon: <Activity className="w-full h-full text-emerald-500" /> },
    { id: 'metrics', name: 'Metrics', icon: <TrendingUp className="w-full h-full text-blue-500" /> },
    { id: 'alerts', name: 'Alerts', icon: <AlertOctagon className="w-full h-full text-rose-500" /> },
    { id: 'recommendations', name: 'Strategic', icon: <Lightbulb className="w-full h-full text-amber-500" /> },
    { id: 'analytics', name: 'History', icon: <TrendingDown className="w-full h-full text-slate-400" /> },
    { id: 'ml', name: 'AI Core', icon: <BrainCircuit className="w-full h-full text-violet-500" /> }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <GlassCard className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Loading Performance Data...</h2>
        </GlassCard>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tighter">
              <Rocket className="w-6 h-6 text-indigo-600" /> Performance Console
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardData.map((item, index) => (
                <ModernStatCard
                  key={index}
                  label={item.metric}
                  value={item.value}
                  icon={item.icon || <BarChart3 className="w-6 h-6" />}
                  subtext={item.unit}
                  trend="neutral"
                />
              ))}
            </div>
          </div>
        );

      case 'health':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary-500" /> System Health Status
            </h3>

            <div className={`
                p-6 rounded-2xl mb-8 border flex items-center gap-4 shadow-sm
                ${systemHealth.status === 'healthy' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}
            `}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full">
                {systemHealth.status === 'healthy' ? <CheckCircle2 className="w-full h-full text-emerald-500" /> : <XCircle className="w-full h-full text-red-500" />}
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
              {systemHealth.components && systemHealth.components.map((component: SystemHealthComponent, index: number) => (
                <div key={index} className={`
                    p-5 rounded-2xl border bg-white
                    ${component.status === 'healthy' ? 'border-gray-100' : 'border-red-100 shadow-red-50'}
                `}>
                  <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-900 mb-3">{component.name}</h4>
                    {component.status === 'healthy' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                  <p className="text-sm text-slate-900 font-medium mb-3">{component.message}</p>
                  <p className="text-xs text-black font-bold">
                    Last checked: <span className="font-mono">{new Date(component.last_check).toLocaleTimeString()}</span>
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
                    <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{metric.value}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase mb-1.5 tracking-widest">{metric.unit}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className={`
                          w-2 h-2 rounded-full
                          ${metric.status === 'good' ? 'bg-emerald-500' : metric.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
                      `}></span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{metric.status}</span>
                  </div>

                  <p className="text-sm text-slate-900 font-medium relative z-10">
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
                      <div className="flex items-center gap-3 mb-1">
                        {alert.severity === 'critical' ? <AlertOctagon className="w-6 h-6 text-red-500" /> : alert.severity === 'warning' ? <AlertOctagon className="w-6 h-6 text-amber-500" /> : <Info className="w-6 h-6 text-blue-500" />}
                        <h4 className={`font-bold ${alert.severity === 'critical' ? 'text-red-900' :
                          alert.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'
                          }`}>{alert.title}</h4>
                      </div>
                      <p className={`text-sm ml-8 font-medium ${alert.severity === 'critical' ? 'text-red-900' :
                        alert.severity === 'warning' ? 'text-amber-900' : 'text-blue-900'
                        }`}>{alert.message}</p>
                      <p className="text-xs text-black font-bold ml-8 mt-1">
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
                  <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{rec.title}</h4>
                    <p className="text-slate-900 font-medium mb-4 leading-relaxed">{rec.description}</p>

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
              <ModernStatCard 
                label="Aggregate Volume" 
                value={transactionVolume.total || 0} 
                icon={<BarChart3 className="w-6 h-6" />}
                subtext="Transactions (24h)"
              />
              <ModernStatCard 
                label="Success Rate" 
                value={`${transactionVolume.success_rate || 0}%`} 
                icon={<CheckCircle2 className="w-6 h-6" />}
                trend="up"
                colorClass="text-emerald-500"
              />
              <ModernStatCard 
                label="Latency" 
                value={`${transactionVolume.avg_response_time || 0}ms`} 
                icon={<Activity className="w-6 h-6" />}
                colorClass="text-blue-500"
              />
            </div>

            <GlassCard className="p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Response Time Analysis</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">Chart Visualization Placeholder</p>
                  <p className="text-xs text-gray-300 mt-1">{(chartData.datasets?.length || 0)} data points available</p>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      case 'ml':
        return (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-primary-600" /> Machine Learning Core
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MLStatusCard 
                status={mlStatus} 
                onRetrain={handleTrainModel} 
                loading={mlLoading}
              />
              
              <div className="space-y-6">
                <GlassCard className="p-6 border-blue-100 bg-blue-50/30">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" /> Fraud Protection Strategy
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    The AI engine uses an <strong>Isolation Forest</strong> algorithm to detect anomalous transaction patterns. It learns from:
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-blue-700 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      Temporal Velocity (Frequency of spends)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      Geospatial Drift (IP & Location changes)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      Contextual Sizing (Deviation from mean)
                    </li>
                  </ul>
                </GlassCard>

                <GlassCard className="p-6">
                  <h4 className="font-bold text-gray-800 mb-3">Model Parameters</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-bold uppercase">Algorithm</span>
                      <span className="text-xs font-black text-coastal-primary">ISOLATION FOREST</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-bold uppercase">Contamination</span>
                      <span className="text-xs font-black text-gray-800">0.05 (AUTO)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500 font-bold uppercase">Features</span>
                      <span className="text-xs font-black text-gray-800">14-DIMENSIONAL</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
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
