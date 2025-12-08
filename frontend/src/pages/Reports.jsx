import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#FFF0F5', // Lavender Blush
    primary: '#6C5CE7', // Purple
    secondary: '#00CEC9', // Teal
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon
    warning: '#FDCB6E', // Mustard
    sidebar: '#FFFFFF',
    text: '#2D3436',
    border: '#dfe6e9',
  },
  shadows: {
    card: '0 8px 0px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.2)',
    active: '0 2px 0px rgba(0,0,0,0.2)',
  },
  radius: {
    card: '24px',
    button: '50px',
  }
};

// --- STYLED WRAPPERS ---
const PlayfulCard = ({ children, color = '#FFFFFF', style }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.card,
    border: '3px solid #000000',
    boxShadow: THEME.shadows.card,
    padding: '24px',
    marginBottom: '24px',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? '#ccc' : (variant === 'danger' ? THEME.colors.danger : THEME.colors.primary),
      color: 'white',
      border: '3px solid #000000',
      padding: '12px 24px',
      borderRadius: THEME.radius.button,
      fontWeight: '900',
      fontSize: '16px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'all 0.1s',
      ...style
    }}
    onMouseDown={e => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(4px)';
        e.currentTarget.style.boxShadow = THEME.shadows.active;
      }
    }}
    onMouseUp={e => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }
    }}
  >
    {children}
  </button>
);

function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportSchedules, setReportSchedules] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  // Form states
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_type: 'financial',
    config: {}
  });

  const [newSchedule, setNewSchedule] = useState({
    template: '',
    name: '',
    schedule_type: 'daily',
    config: {}
  });

  useEffect(() => {
    fetchData();
  }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeView) {
        case 'templates':
          await fetchTemplates();
          break;
        case 'reports':
          await fetchReports();
          break;
        case 'schedules':
          await fetchSchedules();
          break;
        case 'analytics':
          await fetchAnalytics();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    const result = await authService.getReportTemplates();
    if (result.success) {
      setReportTemplates(result.data);
    }
  };

  const fetchReports = async () => {
    const result = await authService.getReports();
    if (result.success) {
      setReports(result.data);
    }
  };

  const fetchSchedules = async () => {
    const result = await authService.getReportSchedules();
    if (result.success) {
      setReportSchedules(result.data);
    }
  };

  const fetchAnalytics = async () => {
    const result = await authService.getReportAnalytics();
    if (result.success) {
      setAnalytics(result.data);
    }
  };

  const handleCreateTemplate = async () => {
    const result = await authService.createReportTemplate(newTemplate);
    if (result.success) {
      setReportTemplates([...reportTemplates, result.data]);
      setNewTemplate({ name: '', description: '', template_type: 'financial', config: {} });
      alert('Report template created successfully!');
    } else {
      alert('Failed to create template: ' + result.error);
    }
  };

  const handleCreateSchedule = async () => {
    const result = await authService.createReportSchedule(newSchedule);
    if (result.success) {
      setReportSchedules([...reportSchedules, result.data]);
      setNewSchedule({ template: '', name: '', schedule_type: 'daily', config: {} });
      alert('Report schedule created successfully!');
    } else {
      alert('Failed to create schedule: ' + result.error);
    }
  };

  const handleGenerateReport = async (templateId) => {
    const result = await authService.generateReport({ template: templateId });
    if (result.success) {
      alert('Report generated successfully!');
      fetchReports();
    } else {
      alert('Failed to generate report: ' + result.error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'templates', name: 'Templates', icon: '📋', color: THEME.colors.primary },
    { id: 'reports', name: 'Reports', icon: '📊', color: THEME.colors.secondary },
    { id: 'schedules', name: 'Schedules', icon: '⏰', color: THEME.colors.warning },
    { id: 'analytics', name: 'Analytics', icon: '📈', color: THEME.colors.success }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <PlayfulCard>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>📊</div>
            <h2>Loading Reports...</h2>
          </div>
        </PlayfulCard>
      );
    }

    switch (activeView) {
      case 'templates':
        return (
          <div>
            <PlayfulCard color="#E8F5E9">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Create New Template</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Template Name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                />
                <select
                  value={newTemplate.template_type}
                  onChange={(e) => setNewTemplate({...newTemplate, template_type: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                >
                  <option value="financial">Financial</option>
                  <option value="operational">Operational</option>
                  <option value="compliance">Compliance</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <textarea
                placeholder="Description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px', minHeight: '80px', marginTop: '16px' }}
              />
              <PlayfulButton onClick={handleCreateTemplate} style={{ marginTop: '16px' }}>
                Create Template 📋
              </PlayfulButton>
            </PlayfulCard>

            <PlayfulCard color="#FFF3E0">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Report Templates</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {reportTemplates.map((template) => (
                  <div key={template.id} style={{
                    padding: '16px',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    background: '#f9f9f9'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>{template.name}</h4>
                    <p style={{ margin: '0 0 8px 0', color: '#666' }}>{template.description}</p>
                    <span style={{
                      padding: '4px 8px',
                      background: THEME.colors.primary,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {template.template_type}
                    </span>
                  </div>
                ))}
              </div>
            </PlayfulCard>
          </div>
        );

      case 'reports':
        return (
          <PlayfulCard color="#E3F2FD">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Generated Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map((report) => (
                <div key={report.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{report.name}</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                      Generated: {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: report.status === 'completed' ? THEME.colors.success : THEME.colors.warning,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {report.status}
                    </span>
                    <PlayfulButton
                      onClick={() => window.open(report.file_url, '_blank')}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      disabled={report.status !== 'completed'}
                    >
                      Download
                    </PlayfulButton>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'schedules':
        return (
          <div>
            <PlayfulCard color="#FCE4EC">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Create Schedule</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <select
                  value={newSchedule.template}
                  onChange={(e) => setNewSchedule({...newSchedule, template: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                >
                  <option value="">Select Template</option>
                  {reportTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Schedule Name"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                />
                <select
                  value={newSchedule.schedule_type}
                  onChange={(e) => setNewSchedule({...newSchedule, schedule_type: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <PlayfulButton onClick={handleCreateSchedule} style={{ marginTop: '16px' }}>
                Create Schedule ⏰
              </PlayfulButton>
            </PlayfulCard>

            <PlayfulCard color="#E8F5E9">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Scheduled Reports</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reportSchedules.map((schedule) => (
                  <div key={schedule.id} style={{
                    padding: '16px',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    background: '#f9f9f9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{schedule.name}</h4>
                        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                          {schedule.schedule_type} • Next run: {new Date(schedule.next_run).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        background: schedule.is_active ? THEME.colors.success : THEME.colors.danger,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </PlayfulCard>
          </div>
        );

      case 'analytics':
        return (
          <PlayfulCard color="#FFF3E0">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Report Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {analytics.map((item) => (
                <div key={item.id} style={{
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon || '📊'}</div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{item.metric}</h4>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>{item.value}</p>
                </div>
              ))}
            </div>
          </PlayfulCard>
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
          <div style={{ fontSize: '40px', background: THEME.colors.warning, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>
            📊
          </div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Reports Hub</h1>
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

export default Reports;