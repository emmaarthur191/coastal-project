import React from 'react';

interface OpDashboardAppBarProps {
  user: any;
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
    <header className="md-elevated-card md-animate-slide-in-down" style={{
      marginBottom: '24px',
      padding: '20px 24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 className="md-typescale-headline-medium" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
            Operations Management
          </h1>
          <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              Welcome, <strong>{user?.name || 'User'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="md-chip" style={{
            background: 'var(--md-sys-color-tertiary-container)',
            color: 'var(--md-sys-color-on-tertiary-container)',
            border: 'none'
          }}>
            OPERATIONS MANAGER
          </div>
          <button
            onClick={handleLogout}
            className="md-filled-button md-ripple"
            style={{
              background: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px',
        background: 'var(--md-sys-color-surface-container-highest)',
        borderRadius: 'var(--md-sys-shape-corner-large)', position: 'relative', zIndex: 1
      }}>
        {navItems.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className="md-ripple"
            style={{
              padding: '10px 16px',
              background: activeView === view.id ? 'var(--md-sys-color-surface)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              color: activeView === view.id ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
              fontWeight: activeView === view.id ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
              boxShadow: activeView === view.id ? 'var(--md-sys-elevation-1)' : 'none'
            }}
          >
            <span style={{ fontSize: '18px' }}>{view.icon}</span>
            <span className="md-typescale-label-large">{view.name}</span>
          </button>
        ))}
      </nav>
    </header>
  );
};

export default OpDashboardAppBar;
