import React from 'react';
import { THEME, PlayfulButton } from './ManagerTheme';

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ManagerSidebarProps {
  activeView: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  handleLogout: () => void;
  user: any;
  menuItems: MenuItem[];
}

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  activeView,
  setActiveView,
  handleLogout,
  user,
  menuItems
}) => {
  console.log('ManagerSidebar: menuItems:', menuItems);

  // Use the passed menuItems
  const itemsToRender = menuItems;

  return (
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
        <div style={{
          fontSize: '40px',
          background: THEME.colors.warning,
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          margin: '0 auto 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid #000'
        }}>🦁</div>
        <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Boss Mode</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{(user as any)?.name}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {itemsToRender.map(item => (
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
              minHeight: '50px', // Ensure buttons are visible
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
  );
};

export default ManagerSidebar;