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
const PlayfulCard = ({ children, color = '#FFFFFF', style = {} }: { children: any; color?: string; style?: any }) => (
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

const PlayfulButton = ({ children, onClick, variant = 'primary', style, disabled = false }: {
  children: any;
  onClick?: () => void;
  variant?: string;
  style?: any;
  disabled?: boolean;
}) => (
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
      if (!disabled && onClick) {
        e.currentTarget.style.transform = 'translateY(4px)';
        e.currentTarget.style.boxShadow = THEME.shadows.active;
      }
    }}
    onMouseUp={e => {
      if (!disabled && onClick) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }
    }}
  >
    {children}
  </button>
);

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('user-settings');
  const [loading, setLoading] = useState(true);

  // Settings data state
  const [userSettings, setUserSettings] = useState({});
  const [systemSettings, setSystemSettings] = useState({});
  const [apiUsage, setApiUsage] = useState([]);
  const [rateLimits, setRateLimits] = useState([]);
  const [healthChecks, setHealthChecks] = useState([]);

  // Form states
  const [userSettingsForm, setUserSettingsForm] = useState({
    theme: 'light',
    language: 'en',
    notifications: true,
    email_updates: false
  });

  useEffect(() => {
    fetchData();
  }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeView) {
        case 'user-settings':
          await fetchUserSettings();
          break;
        case 'system-settings':
          await fetchSystemSettings();
          break;
        case 'api-usage':
          await fetchApiUsage();
          break;
        case 'rate-limits':
          await fetchRateLimits();
          break;
        case 'health-checks':
          await fetchHealthChecks();
          break;
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    const result = await authService.getUserSettings();
    if (result.success) {
      setUserSettings(result.data);
      // Update form with current settings
      if (result.data.length > 0) {
        const settings = result.data[0]; // Assuming first settings object
        setUserSettingsForm({
          theme: settings.theme || 'light',
          language: settings.language || 'en',
          notifications: settings.notifications || true,
          email_updates: settings.email_updates || false
        });
      }
    }
  };

  const fetchSystemSettings = async () => {
    const result = await authService.getSystemSettings();
    if (result.success) {
      setSystemSettings(result.data);
    }
  };

  const fetchApiUsage = async () => {
    const result = await authService.getApiUsage();
    if (result.success) {
      setApiUsage(result.data);
    }
  };

  const fetchRateLimits = async () => {
    const result = await authService.getRateLimits();
    if (result.success) {
      setRateLimits(result.data);
    }
  };

  const fetchHealthChecks = async () => {
    const result = await authService.getHealthChecks();
    if (result.success) {
      setHealthChecks(result.data);
    }
  };

  const handleSaveUserSettings = async () => {
    const result = await authService.updateUserSettings(userSettingsForm);
    if (result.success) {
      alert('User settings saved successfully!');
      fetchUserSettings();
    } else {
      alert('Failed to save settings: ' + result.error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'user-settings', name: 'User Settings', icon: '👤', color: THEME.colors.primary },
    { id: 'system-settings', name: 'System Settings', icon: '⚙️', color: THEME.colors.secondary },
    { id: 'api-usage', name: 'API Usage', icon: '📊', color: THEME.colors.warning },
    { id: 'rate-limits', name: 'Rate Limits', icon: '⏱️', color: THEME.colors.danger },
    { id: 'health-checks', name: 'Health Checks', icon: '❤️', color: THEME.colors.success }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <PlayfulCard>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>⚙️</div>
            <h2>Loading Settings...</h2>
          </div>
        </PlayfulCard>
      );
    }

    switch (activeView) {
      case 'user-settings':
        return (
          <div>
            <PlayfulCard color="#E8F5E9">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Personal Preferences</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Theme</label>
                  <select
                    value={userSettingsForm.theme}
                    onChange={(e) => setUserSettingsForm({...userSettingsForm, theme: e.target.value})}
                    style={{ width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Language</label>
                  <select
                    value={userSettingsForm.language}
                    onChange={(e) => setUserSettingsForm({...userSettingsForm, language: e.target.value})}
                    style={{ width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Notifications</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={userSettingsForm.notifications}
                      onChange={(e) => setUserSettingsForm({...userSettingsForm, notifications: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    Enable push notifications
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email Updates</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={userSettingsForm.email_updates}
                      onChange={(e) => setUserSettingsForm({...userSettingsForm, email_updates: e.target.checked})}
                      style={{ width: '20px', height: '20px' }}
                    />
                    Receive email updates
                  </label>
                </div>
              </div>

              <PlayfulButton onClick={handleSaveUserSettings} style={{ marginTop: '24px' }}>
                Save Settings 💾
              </PlayfulButton>
            </PlayfulCard>
          </div>
        );

      case 'system-settings':
        return (
          <PlayfulCard color="#E3F2FD">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>System Configuration</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {Array.isArray(systemSettings) && systemSettings.map((setting: any, index: number) => (
                <div key={index} style={{
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{setting.key}</h4>
                  <p style={{ margin: '0', color: '#666' }}>{setting.value}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                    Type: {setting.setting_type}
                  </p>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'api-usage':
        return (
          <PlayfulCard color="#FFF3E0">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>API Usage Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {Array.isArray(apiUsage) && apiUsage.map((usage: any, index: number) => (
                <div key={index} style={{
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{usage.endpoint}</h4>
                  <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>
                    {usage.request_count}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>requests</p>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'rate-limits':
        return (
          <PlayfulCard color="#FFEBEE">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Rate Limiting Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.isArray(rateLimits) && rateLimits.map((limit: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{limit.name}</h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{limit.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: THEME.colors.primary }}>
                      {limit.requests_per_hour}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>requests/hour</p>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'health-checks':
        return (
          <PlayfulCard color="#F3E5F5">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>System Health Checks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {Array.isArray(healthChecks) && healthChecks.map((check: any, index: number) => (
                <div key={index} style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: check.status === 'healthy' ? '#D4EDDA' : '#F8D7DA'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>{check.name}</h4>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                    {check.status === 'healthy' ? '✅' : '❌'}
                  </div>
                  <p style={{ margin: '0', fontSize: '14px' }}>{check.message}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                    Last checked: {new Date(check.last_check).toLocaleString()}
                  </p>
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
          <div style={{ fontSize: '40px', background: THEME.colors.secondary, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>
            ⚙️
          </div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Settings</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{user?.email}</p>
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
          <PlayfulButton variant="danger" onClick={handleLogout}>
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

export default Settings;