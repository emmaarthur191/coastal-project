import React from 'react';

interface DashboardDropdownProps {
  showDropdown: boolean;
  setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardDropdown: React.FC<DashboardDropdownProps> = ({
  showDropdown,
  setShowDropdown
}) => {
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-900 py-2.5 px-6 rounded-xl cursor-pointer hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
      >
        <span className="opacity-70">⚙️</span> Options
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-3 bg-white border border-slate-200 rounded-2xl py-3 min-w-[180px] z-[1000] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-6 py-3 cursor-pointer hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-900 transition-colors border-b border-slate-100 last:border-0">
            Settings
          </div>
          <div className="px-6 py-3 cursor-pointer hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-900 transition-colors border-b border-slate-100 last:border-0">
            Reports
          </div>
          <div className="px-6 py-3 cursor-pointer hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest text-slate-900 transition-colors">
            Export Data
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDropdown;
