import React from 'react';

interface MobileSidebarProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  handleLogout: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ activeTab, setActiveTab, handleLogout }) => {
  const navItems = [
    { id: 'client-registration', icon: '👤', label: 'Register' },
    { id: 'clients', icon: '👥', label: 'Clients' },
    { id: 'visits', icon: '📍', label: 'Visits' },
    { id: 'messaging', icon: '💬', label: 'Chat' }
  ];

  return (
    <nav className="w-[100px] bg-white border-r border-gray-200 flex flex-col items-center py-5 z-10 h-full hidden lg:flex shadow-sm">
      <div className="text-4xl mb-10 cursor-pointer animate-pulse" title="Home">🐝</div>

      <div className="flex flex-col gap-5 w-full items-center">
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
                w-[70px] h-[70px] rounded-2xl flex flex-col items-center justify-center transition-all duration-200
                ${activeTab === tab.id ? 'bg-amber-100 text-amber-600 border-2 border-amber-200 shadow-sm' : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-2 border-transparent'}
            `}
          >
            <span className="text-2xl mb-1">{tab.icon}</span>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="text-2xl opacity-50 hover:opacity-100 hover:scale-110 transition-all text-red-500"
          title="Logout"
        >
          🚪
        </button>
      </div>
    </nav>
  );
};

export default MobileSidebar;