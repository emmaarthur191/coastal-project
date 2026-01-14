import React from 'react';
import { Button } from '../ui/Button';

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
  user: {
    name?: string;
    email?: string;
    role?: string;
  };
  menuItems: MenuItem[];
}

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  activeView,
  setActiveView,
  handleLogout,
  user,
  menuItems = []
}) => {
  return (
    <nav className="w-72 glass-card border-r border-white/20 p-6 flex flex-col h-full transition-all duration-300">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-premium-gradient flex items-center justify-center text-4xl shadow-2xl border-4 border-white/30 backdrop-blur-md transition-transform duration-700 hover:rotate-[360deg]">
          🦁
        </div>
        <h1 className="font-black text-white text-xl tracking-tight drop-shadow-md">Manager Portal</h1>
        <p className="text-sm font-medium text-white/70 mt-1">Hello, {user?.name || 'Manager'}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`
              w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group relative overflow-hidden
              ${activeView === item.id
                ? 'bg-white text-gray-900 shadow-xl scale-[1.05] z-10'
                : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.02]'}
            `}
          >
            <span className={`
                text-xl transition-all duration-500 group-hover:rotate-12
                ${activeView === item.id ? 'scale-125' : ''}
            `}>
              {item.icon}
            </span>
            <span className="font-bold text-sm tracking-wide">{item.name}</span>
            {activeView === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-900 animate-pulse" />
            )}

            {/* Hover reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/10">
        <Button
          variant="danger"
          onClick={handleLogout}
          className="w-full shadow-2xl hover:brightness-110 active:scale-95 transition-all duration-300 bg-red-500/80 backdrop-blur-md border border-white/20"
        >
          Log Out 👋
        </Button>
      </div>
    </nav>
  );
};

export default ManagerSidebar;
