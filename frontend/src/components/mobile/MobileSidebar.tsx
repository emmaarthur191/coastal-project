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
    <nav className="w-24 glass-card border-r border-white/20 flex flex-col items-center py-6 z-10 h-full hidden lg:flex shadow-2xl transition-all duration-500">
      <div className="w-14 h-14 bg-premium-gradient rounded-full flex items-center justify-center text-3xl mb-12 shadow-lg shadow-purple-900/20 cursor-pointer animate-pulse border-2 border-white/30 backdrop-blur-md hover:rotate-12 transition-transform duration-300" title="Home">
        🐝
      </div>

      <div className="flex flex-col gap-6 w-full items-center">
        {navItems.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
                w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group relative
                ${activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-xl scale-110'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:scale-105 border border-white/10'}
            `}
          >
            <span className={`text-2xl mb-0.5 transition-transform duration-500 group-hover:scale-110 ${activeTab === tab.id ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute -left-1 w-1.5 h-6 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto pb-6">
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white hover:scale-110 transition-all duration-300 shadow-lg group"
          title="Logout"
        >
          <span className="text-xl group-hover:rotate-12 transition-transform">🚪</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileSidebar;
