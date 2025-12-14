import React from 'react';

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
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-black text-gray-800 m-0 flex items-center gap-3">
        <span className="text-4xl">{currentItem?.icon}</span>
        {currentItem?.name}
      </h2>
      <div className="bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm font-bold text-gray-600 flex items-center gap-2">
        <span>📅</span> {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default DashboardHeader;