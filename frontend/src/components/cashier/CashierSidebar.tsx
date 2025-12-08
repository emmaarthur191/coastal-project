import React from 'react';
import { THEME, PlayfulButton } from './CashierTheme';

interface Tab {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CashierSidebarProps {
  activeTab: string;
  handleTabChange: (tabId: string) => void;
  handleLogout: () => void;
  user: any;
  tabs: Tab[];
}

const CashierSidebar: React.FC<CashierSidebarProps> = ({
  activeTab,
  handleTabChange,
  handleLogout,
  user,
  tabs
}) => {
  return (
    <nav style={{
      width: '260px',
      background: THEME.colors.white,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      borderRight: `3px solid ${THEME.colors.border}`,
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{
          width: '60px', height: '60px', background: THEME.colors.primary,
          borderRadius: '50%', margin: '0 auto 10px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '30px'
        }}>🏦</div>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: THEME.colors.primary }}>PiggyBank OS</h1>
        <p style={{ margin: 0, fontSize: '14px', color: THEME.colors.muted }}>Hello, {user?.name || 'Friend'}!</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px',
              border: activeTab === tab.id ? `3px solid ${tab.color || THEME.colors.primary}` : '3px solid transparent',
              background: activeTab === tab.id ? `${tab.color}15` : 'transparent',
              borderRadius: THEME.radius.medium,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: 'bold',
              color: activeTab === tab.id ? (tab.color || THEME.colors.primary) : THEME.colors.muted,
              transition: 'all 0.2s ease',
              transform: activeTab === tab.id ? 'scale(1.02)' : 'none'
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon || '⏺️'}</span>
            {tab.name}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
         <PlayfulButton variant="danger" onClick={handleLogout} style={{ width: '100%' }}>
           Logout 👋
         </PlayfulButton>
      </div>
    </nav>
  );
};

export default CashierSidebar;