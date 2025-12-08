import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#F0F4F8',
    primary: '#6C5CE7', // Purple
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon Red
    warning: '#FDCB6E', // Mustard
    info: '#74B9FF', // Sky Blue
    white: '#FFFFFF',
    text: '#2D3436',
    muted: '#636E72',
    border: '#DFE6E9',
  },
  shadows: {
    card: '0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.15)', // "Pressed" 3D effect
    buttonActive: '0 2px 0px rgba(0,0,0,0.15)',
  },
  radius: {
    small: '12px',
    medium: '20px',
    large: '35px',
    round: '50px'
  }
};

// --- STYLED SUB-COMPONENTS ---

const PlayfulCard = ({ children, color = THEME.colors.white, style = {} }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.medium,
    boxShadow: THEME.shadows.card,
    padding: '24px',
    border: '3px solid white',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style, disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: string; style?: React.CSSProperties; disabled?: boolean }) => {
  const bg = variant === 'danger' ? THEME.colors.danger :
            variant === 'success' ? THEME.colors.success :
            THEME.colors.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#ccc' : bg,
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: THEME.radius.round,
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: THEME.shadows.button,
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(4px)';
          e.currentTarget.style.boxShadow = THEME.shadows.buttonActive;
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = THEME.shadows.button;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = THEME.shadows.button;
        }
      }}
    >
      {children}
    </button>
  );
};

function PerformanceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Performance data state
  const [dashboardData, setDashboardData] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [transactionVolume, setTransactionVolume] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchData();
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
    // Fetch transaction volume and chart data
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
    { id: 'dashboard', name: 'Dashboard', icon: '📊', color: THEME.colors.primary },
    { id: 'health', name: 'System Health', icon: '❤️', color: THEME.colors.success },
    { id: 'metrics', name: 'Metrics', icon: '📈', color: THEME.colors.secondary },
    { id: 'alerts', name: 'Alerts', icon: '🚨', color: THEME.colors.danger },
    { id: 'recommendations', name: 'Recommendations', icon: '💡', color: THEME.colors.warning },
    { id: 'analytics', name: 'Analytics', icon: '📊', color: THEME.colors.primary }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <PlayfulCard>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>📊</div>
            <h2>Loading Performance Data...</h2>
          </div>
        </PlayfulCard>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <div>
            <PlayfulCard color="#E8F5E9">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Performance Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {dashboardData.map((item, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    background: '#f9f9f9',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon || '📊'}</div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{item.metric}</h4>
                    <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>{item.value}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{item.unit}</p>
                  </div>
                ))}
              </div>
            </PlayfulCard>
          </div>
        );

      case 'health':
        return (
          <PlayfulCard color="#E3F2FD">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>System Health Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div style={{
                padding: '20px',
                border: '2px solid #000',
                borderRadius: '12px',
                background: systemHealth.status === 'healthy' ? '#D4EDDA' : '#F8D7DA'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>Overall Status</h4>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {systemHealth.status === 'healthy' ? '✅' : '❌'}
                </div>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                  {systemHealth.status === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
                </p>
              </div>

              {systemHealth.components && systemHealth.components.map((component, index) => (
                <div key={index} style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: component.status === 'healthy' ? '#D4EDDA' : '#F8D7DA'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>{component.name}</h4>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                    {component.status === 'healthy' ? '✅' : '❌'}
                  </div>
                  <p style={{ margin: '0', fontSize: '14px' }}>{component.message}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Last checked: {new Date(component.last_check).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'metrics':
        return (
          <PlayfulCard color="#FFF3E0">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Performance Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {metrics.map((metric, index) => (
                <div key={index} style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>{metric.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>
                        {metric.value}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{metric.unit}</p>
                    </div>
                    <div style={{
                      padding: '8px',
                      borderRadius: '50%',
                      background: metric.status === 'good' ? THEME.colors.success :
                                 metric.status === 'warning' ? THEME.colors.warning : THEME.colors.danger
                    }}>
                      {metric.status === 'good' ? '✅' : metric.status === 'warning' ? '⚠️' : '❌'}
                    </div>
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                    {metric.description}
                  </p>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'alerts':
        return (
          <PlayfulCard color="#FFEBEE">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Performance Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alert, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: alert.severity === 'critical' ? '#F8D7DA' :
                             alert.severity === 'warning' ? '#FFF3CD' : '#D1ECF1'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{alert.title}</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{alert.message}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: alert.severity === 'critical' ? THEME.colors.danger :
                                 alert.severity === 'warning' ? THEME.colors.warning : THEME.colors.secondary,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <PlayfulButton
                      onClick={() => {/* Handle alert action */}}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Acknowledge
                    </PlayfulButton>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'recommendations':
        return (
          <PlayfulCard color="#E8F5E9">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Performance Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{rec.title}</h4>
                      <p style={{ margin: '0 0 8px 0', color: '#666' }}>{rec.description}</p>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                        <span>💡 {rec.category}</span>
                        <span>📊 Impact: {rec.impact}</span>
                        <span>⏱️ Effort: {rec.effort}</span>
                      </div>
                    </div>
                    <PlayfulButton
                      onClick={() => {/* Handle recommendation action */}}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Implement
                    </PlayfulButton>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'analytics':
        return (
          <div>
            <PlayfulCard color="#F3E5F5">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Transaction Volume (24h)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Total Transactions</h4>
                  <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: THEME.colors.primary }}>
                    {transactionVolume.total || 0}
                  </p>
                </div>
                <div style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Success Rate</h4>
                  <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: THEME.colors.success }}>
                    {transactionVolume.success_rate || 0}%
                  </p>
                </div>
                <div style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Average Response Time</h4>
                  <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: THEME.colors.secondary }}>
                    {transactionVolume.avg_response_time || 0}ms
                  </p>
                </div>
              </div>
            </PlayfulCard>

            <PlayfulCard color="#E3F2FD">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Response Time Chart</h3>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', borderRadius: '12px' }}>
                <p style={{ color: '#666', fontSize: '18px' }}>📊 Chart visualization would go here</p>
              </div>
              <p style={{ margin: '16px 0 0 0', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                Chart data points: {chartData.length}
              </p>
            </PlayfulCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: THEME.colors.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: #fff; }
          ::-webkit-scrollbar-thumb { background: ${THEME.colors.primary}; border-radius: 5px; }
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}
      </style>

      {/* Sidebar */}
      <nav style={{
        width: '280px',
        background: '#fff',
        borderRight: '3px solid #000',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '40px', background: THEME.colors.secondary, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>
            📊
          </div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Performance</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{user?.name}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                border: activeView === item.id ? `3px solid ${item.color}` : '3px solid transparent',
                background: activeView === item.id ? `${item.color}20` : 'transparent',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '800',
                color: activeView === item.id ? item.color : '#888',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <PlayfulButton variant="danger" onClick={handleLogout} style={{ width: '100%' }}>
            Log Out 👋
          </PlayfulButton>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.text, margin: 0 }}>
            {menuItems.find(i => i.id === activeView)?.icon} {menuItems.find(i => i.id === activeView)?.name}
          </h2>
          <div style={{ background: '#FFF', padding: '8px 16px', borderRadius: '20px', border: '2px solid #000', fontWeight: 'bold' }}>
            📅 {new Date().toLocaleDateString()}
          </div>
        </header>

        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default PerformanceDashboard;