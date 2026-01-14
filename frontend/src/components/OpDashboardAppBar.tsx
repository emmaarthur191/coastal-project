import React from 'react';
import './OpDashboardAppBar.css';
import { Button } from './ui/Button';

interface OpDashboardAppBarProps {
  user: { name?: string; id?: number | string; role?: string } | null;
  activeView: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  handleLogout: () => void;
}

const navItems = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'branches', name: 'Branch Activity', icon: '📍' },
  { id: 'reports', name: 'Reports', icon: '🧾' },
  { id: 'alerts', name: 'System Alerts', icon: '🚨' },
  { id: 'charges', name: 'Service Charges', icon: '💸' },
  { id: 'messaging', name: 'Messaging', icon: '💬' }
];

const OpDashboardAppBar: React.FC<OpDashboardAppBarProps> = ({ user, activeView, setActiveView, handleLogout }) => {
  return (
    <header className="op-dashboard-app-bar glass-card transition-all duration-500">
      <div className="op-dashboard-header-container">
        <div>
          <h1 className="op-dashboard-title text-2xl font-black tracking-tight text-white drop-shadow-md">
            Operations Portal
          </h1>
          <p className="op-dashboard-subtitle text-white/70 font-medium">
            System Administrator: <span className="text-white font-bold">{user?.name || 'Administrator'}</span>
          </p>
        </div>
        <div className="op-dashboard-actions">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
              {user?.role || 'OPS_ADMIN'}
            </span>
          </div>
          <Button
            onClick={handleLogout}
            className="op-dashboard-logout-btn bg-red-500/80 hover:bg-red-600 transition-all duration-300 shadow-xl shadow-red-900/20"
          >
            Sign Out 👋
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="op-dashboard-nav mt-6 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
        {navItems.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-500 group relative
              ${activeView === view.id
                ? 'bg-white text-gray-900 shadow-lg scale-105 z-10'
                : 'text-white/60 hover:bg-white/10 hover:text-white'}
            `}
          >
            <span className={`transition-transform duration-500 group-hover:scale-120 ${activeView === view.id ? 'scale-110' : ''}`}>
              {view.icon}
            </span>
            <span className="font-bold text-sm tracking-wide">{view.name}</span>
            {activeView === view.id && (
              <div className="absolute bottom-1 left-1.2 right-1/2 translate-x-1/2 w-1.5 h-1 bg-gray-900 rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default OpDashboardAppBar;
