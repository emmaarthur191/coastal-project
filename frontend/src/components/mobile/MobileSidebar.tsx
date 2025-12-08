import React from 'react';
import { THEME } from './MobileTheme';

interface MobileSidebarProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  handleLogout: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ activeTab, setActiveTab, handleLogout }) => {
  const navItems = [
    { id: 'client-registration', icon: '👤', label: 'Register' },
    { id: 'clients', icon: '', label: 'Clients' },
    { id: 'visits', icon: '📍', label: 'Visits' },
    { id: 'messaging', icon: '💬', label: 'Chat' }
  ];

  return (
    <nav style={{
      width: '100px',
      background: '#fff',
      borderRight: '3px solid #000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      zIndex: 10
    }}>
      <div style={{ fontSize: '40px', marginBottom: '40px', cursor: 'pointer' }} title="Home">🐝</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              border: activeTab === tab.id ? '3px solid #000' : '3px solid transparent',
              background: activeTab === tab.id ? THEME.colors.warning : 'transparent',
              fontSize: '30px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button onClick={handleLogout} style={{ fontSize: '30px', background: 'none', border: 'none', cursor: 'pointer' }} title="Logout">🚪</button>
      </div>
    </nav>
  );
};

export default MobileSidebar;