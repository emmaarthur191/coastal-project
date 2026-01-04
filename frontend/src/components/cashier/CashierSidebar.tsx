import React from 'react';
import { Button } from '../ui/Button';
import GlassCard from '../ui/modern/GlassCard';

interface Tab {
  id: string;
  name: string;
  icon: string;
  color?: string;
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
    <div className="w-[260px] bg-white border-r border-gray-200 h-screen overflow-y-auto flex flex-col p-4 fixed left-0 top-0 z-20 shadow-xl shadow-gray-200/50">
      <div className="mb-8 text-center pt-4">
        <div className="w-16 h-16 bg-coastal-primary rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg shadow-coastal-primary/30">
          🏦
        </div>
        <h1 className="text-xl font-black text-coastal-primary mb-1 tracking-tight">PiggyBank OS</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coastal Banking</p>

        {user && (
          <div className="mt-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600 truncate max-w-[150px]">{user.name || user.email}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-coastal-primary to-blue-600 text-white shadow-lg shadow-blue-200 scale-105 font-bold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'
              }
            `}
          >
            <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
              {tab.icon || '⏺️'}
            </span>
            <span className="text-sm tracking-wide">{tab.name}</span>
            {activeTab === tab.id && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <Button
          variant="danger"
          onClick={handleLogout}
          className="w-full justify-center shadow-lg shadow-red-50 hover:shadow-red-100"
        >
          Logout 👋
        </Button>
        <p className="text-[10px] text-center text-gray-300 mt-4 font-mono">v2.5.0 • Secure</p>
      </div>
    </div>
  );
};

export default CashierSidebar;
