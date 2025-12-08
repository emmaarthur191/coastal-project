import React from 'react';
import { THEME } from './ManagerTheme';

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface DashboardHeaderProps {
  activeView: string;
  menuItems: MenuItem[];
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeView, menuItems }) => {
  const currentItem = menuItems.find(i => i.id === activeView);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
      <h2 style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.text, margin: 0 }}>
         {currentItem?.icon} {currentItem?.name}
      </h2>
      <div style={{ background: '#FFF', padding: '8px 16px', borderRadius: '20px', border: '2px solid #000', fontWeight: 'bold' }}>
        📅 {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default DashboardHeader;