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
  user: any;
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
    <nav className="w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200 p-6 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl shadow-xl shadow-amber-100 border-4 border-white">
          🦁
        </div>
        <h1 className="font-black text-gray-800 text-xl tracking-tight">Manager Portal</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">Hello, {user?.name || 'Manager'}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`
              w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
              ${activeView === item.id
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-100'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]'}
            `}
          >
            <span className={`
                text-xl transition-transform duration-300 group-hover:scale-110
                ${activeView === item.id ? 'scale-110' : ''}
            `}>
              {item.icon}
            </span>
            <span className="font-bold text-sm tracking-wide">{item.name}</span>
            {activeView === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <Button variant="danger" onClick={handleLogout} className="w-full shadow-lg shadow-red-100 dark:shadow-none">
          Log Out 👋
        </Button>
      </div>
    </nav>
  );
};

export default ManagerSidebar;