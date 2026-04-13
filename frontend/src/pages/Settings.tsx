import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, SystemSettingData, ApiUsageData, RateLimitData, HealthCheckData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import { Button } from '../components/ui/Button';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  User, 
  Settings as SettingsIcon, 
  Activity, 
  Clock, 
  Heart, 
  Bell, 
  Mail, 
  Save, 
  CheckCircle, 
  XCircle,
  Zap
} from 'lucide-react';

// Extended interfaces to match backend response structure
interface SystemSetting extends SystemSettingData {
  setting_type?: string;
}

interface ApiUsage extends ApiUsageData {
  request_count?: number;
  endpoint: string;
}

interface RateLimit extends RateLimitData {
  name?: string;
  description?: string;
  requests_per_hour?: number;
}

interface HealthCheck extends HealthCheckData {
  name?: string;
  last_check?: string;
}

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('user-settings');
  const [loading, setLoading] = useState(true);

  // Settings data state
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);

  // Form states
  const [userSettingsForm, setUserSettingsForm] = useState({
    theme: 'light',
    language: 'en',
    notifications: true,
    email_updates: false
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (result.success && result.data) {
      // Update form with current settings
      if (result.data.length > 0) {
        const settings = result.data[0]; // Assuming first settings object
        setUserSettingsForm({
          theme: settings.theme || 'light',
          language: settings.language || 'en',
          notifications: settings.notifications ?? true,
          email_updates: settings.email_updates ?? false
        });
      }
    }
  };

  const fetchSystemSettings = async () => {
    const result = await authService.getSystemSettings();
    if (result.success && result.data) {
      setSystemSettings(result.data);
    }
  };

  const fetchApiUsage = async () => {
    const result = await authService.getApiUsage();
    if (result.success && result.data) {
      setApiUsage(result.data);
    }
  };

  const fetchRateLimits = async () => {
    const result = await authService.getRateLimits();
    if (result.success && result.data) {
      setRateLimits(result.data);
    }
  };

  const fetchHealthChecks = async () => {
    const result = await authService.getHealthChecks();
    if (result.success && result.data) {
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
    { id: 'user-settings', name: 'User Settings', icon: <User className="w-5 h-5" /> },
    { id: 'system-settings', name: 'System Settings', icon: <SettingsIcon className="w-5 h-5" /> },
    { id: 'api-usage', name: 'API Usage', icon: <Activity className="w-5 h-5" /> },
    { id: 'rate-limits', name: 'Rate Limits', icon: <Clock className="w-5 h-5" /> },
    { id: 'health-checks', name: 'Health Checks', icon: <Heart className="w-5 h-5" /> }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <GlassCard className="flex flex-col items-center justify-center p-12">
          <SettingsIcon className="w-16 h-16 mb-4 animate-spin-slow text-slate-900 opacity-20" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Synchronizing Configuration...</h2>
        </GlassCard>
      );
    }

    switch (activeView) {
      case 'user-settings':
        return (
          <GlassCard className="p-8 max-w-3xl border-t-[6px] border-t-coastal-primary">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">Personal Preferences</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label htmlFor="theme-select" className="block text-[10px] font-black uppercase text-slate-900 mb-2 ml-1 tracking-widest">Aesthetic Matrix</label>
                <div className="relative">
                  <select
                    id="theme-select"
                    value={userSettingsForm.theme}
                    onChange={(e) => setUserSettingsForm({ ...userSettingsForm, theme: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none font-medium text-gray-700"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="auto">System Default</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              <div>
                <label htmlFor="language-select" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Language</label>
                <div className="relative">
                  <select
                    id="language-select"
                    value={userSettingsForm.language}
                    onChange={(e) => setUserSettingsForm({ ...userSettingsForm, language: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none font-medium text-gray-700"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setUserSettingsForm({ ...userSettingsForm, notifications: !userSettingsForm.notifications })}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${userSettingsForm.notifications ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight">Push Notifications</h4>
                    <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest opacity-60">System-wide operational alerts</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${userSettingsForm.notifications ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${userSettingsForm.notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => setUserSettingsForm({ ...userSettingsForm, email_updates: !userSettingsForm.email_updates })}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${userSettingsForm.email_updates ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight">Email Updates</h4>
                    <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest opacity-60">Audit logs and diagnostic reports</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${userSettingsForm.email_updates ? 'bg-purple-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${userSettingsForm.email_updates ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveUserSettings} className="w-full md:w-auto px-8 gap-2" variant="primary">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </GlassCard>
        );

      case 'system-settings':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">System Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(systemSettings) && systemSettings.map((setting, index) => (
                <div key={index} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <SettingsIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded uppercase">{setting.setting_type}</span>
                  </div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight mb-1">{setting.key}</h4>
                  <p className="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 break-all font-mono">
                    {setting.value}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'api-usage':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">API Usage Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.isArray(apiUsage) && apiUsage.map((usage, index) => (
                <div key={index} className="p-6 rounded-2xl bg-white border border-gray-100 text-center relative overflow-hidden group">
                  {/* Background decoration */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                  <div className="flex justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Activity className="w-10 h-10 text-blue-500 opacity-80" />
                  </div>

                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 truncate" title={usage.endpoint}>
                    {usage.endpoint}
                  </h4>

                  <div className="text-3xl font-black text-gray-800 group-hover:text-coastal-primary transition-colors">
                    {usage.request_count?.toLocaleString()}
                  </div>

                  <div className="text-xs text-gray-400 mt-1">requests</div>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'rate-limits':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Rate Limiting</h3>
            <div className="space-y-4">
              {Array.isArray(rateLimits) && rateLimits.map((limit, index) => (
                <div key={index} className="flex flex-col md:flex-row justify-between items-center p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="mb-4 md:mb-0 text-center md:text-left">
                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg mb-1">{limit.name}</h4>
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest opacity-60">{limit.description}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-xl border-2 border-slate-300">
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 leading-none">
                        {limit.requests_per_hour?.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">REQ / HOUR</div>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-300"></div>
                    <Zap className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      case 'health-checks':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(healthChecks) && healthChecks.map((check, index) => (
                <div key={index} className={`
                    p-6 rounded-2xl border relative overflow-hidden
                    ${check.status === 'healthy' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}
                `}>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-2 rounded-lg ${check.status === 'healthy' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {check.status === 'healthy' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs font-bold uppercase py-1 px-2 rounded ${check.status === 'healthy' ? 'bg-white/50 text-emerald-700' : 'bg-white/50 text-red-700'}`}>
                      {check.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-800 text-lg mb-2 relative z-10">{check.name}</h4>
                  <p className="text-sm text-gray-600 mb-4 relative z-10">{check.message}</p>

                  <div className="relative z-10 pt-4 border-t border-black/5">
                    <p className="text-xs text-gray-500 font-medium">
                      Last checked: {new Date(check.last_check).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Settings"
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

export default Settings;
