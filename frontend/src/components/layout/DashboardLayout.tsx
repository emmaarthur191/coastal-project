import React, { useState, ReactNode } from 'react';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

/* Icons (using generic Material Icons or text fallback if Lucide not installed,
   assuming project uses emojis based on previous code. Replacing emojis with cleaner text/icons later) */

interface DashboardLayoutProps {
    title?: string;
    user: any;
    menuItems: any[];
    activeView: string;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    children?: ReactNode;
}

export default function DashboardLayout({
    title = "Dashboard",
    user,
    menuItems = [],
    activeView,
    onNavigate,
    onLogout,
    children
}: DashboardLayoutProps) {
    const { theme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Update browser tab title with user's name
    React.useEffect(() => {
        const appName = "Coastal Credit Union";
        if (user?.name) {
            document.title = `${user.name} | ${appName}`;
        } else if (user?.first_name) {
            document.title = `${user.first_name} ${user.last_name || ''} | ${appName}`;
        } else {
            document.title = `${title} | ${appName}`;
        }
    }, [user, title]);

    const displayName = user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User');
    const roleDisplay = user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Member';

    return (
        // Global Background is handled by body styles in index.css (gradient)
        <div className="min-h-screen flex bg-transparent">

            {/* Sidebar - Desktop - Glass Effect */}
            <aside className="hidden lg:flex flex-col w-64 glass-card-global fixed h-[96%] left-2 top-[2%] z-10 transition-all duration-300 border-r border-white/10 rounded-2xl shadow-xl">
                <div className="p-6 border-b border-white/10 flex items-center justify-center">
                    <div className="h-10 w-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                        <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
                    </div>
                    <span className="ml-3 text-xl font-bold tracking-tight text-current drop-shadow-sm font-display">Coastal</span>
                </div>

                <div className="flex items-center p-4 bg-white/5 dark:bg-black/20 mx-4 mt-6 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-sm relative">
                        {displayName.charAt(0).toUpperCase()}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-800 rounded-full"></div>
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold truncate text-current">{displayName}</p>
                        <p className="text-xs opacity-70 truncate font-medium">{roleDisplay}</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => item.available !== false && onNavigate(item.id)}
                                disabled={item.available === false}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-blue-500 dark:hover:text-blue-400'
                                    } ${item.available === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className={`text-lg mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>{item.icon}</span>
                                {item.name}
                                {isActive && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-sm animate-pulse-gentle" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <ThemeToggle />
                    <button
                        onClick={onLogout}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium"
                        title="Log Out"
                    >
                        🛑
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content Wrapper */}
            <div className="flex-1 flex flex-col lg:ml-[17rem] transition-all duration-300 min-h-screen">

                {/* Mobile Header - Glass Effect */}
                <header className="lg:hidden glass-card-global m-2 rounded-xl p-4 flex items-center justify-between sticky top-2 z-20">
                    <div className="flex items-center">
                        <div className="h-8 w-8 mr-3 flex items-center justify-center">
                            <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                        <span className="font-bold text-lg">Coastal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 backdrop-blur-sm">
                            ☰
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
                    {/* Dashboard Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black drop-shadow-sm flex items-center gap-2">
                                <span className="text-4xl">{menuItems.find(i => i.id === activeView)?.icon || '📊'}</span>
                                {menuItems.find(i => i.id === activeView)?.name || 'Dashboard'}
                            </h1>
                            <p className="opacity-70 text-sm mt-1 font-medium ml-1">
                                Hello, {displayName} 👋
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="px-4 py-2 glass-card-global rounded-full text-sm font-bold shadow-sm">
                                📅 {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    <div className="animate-fade-in relative z-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Dialog - Glass Effect */}
            <Dialog open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} className="relative z-50 lg:hidden">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex">
                    <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col glass-card-global pt-5 pb-4 border-r border-white/20">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center">
                                <span className="ml-2 font-black text-2xl">Coastal</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-white/10">
                                ❌
                            </button>
                        </div>

                        <div className="mt-8 flex-1 h-0 overflow-y-auto px-2">
                            <nav className="space-y-2">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (item.available !== false) {
                                                onNavigate(item.id);
                                                setMobileMenuOpen(false);
                                            }
                                        }}
                                        disabled={item.available === false} // Prevent clicking unavailable items
                                        className={`w-full flex items-center px-4 py-3 text-lg font-bold rounded-xl ${activeView === item.id
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'hover:bg-white/10'
                                            } ${item.available === false ? 'opacity-50' : ''}`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {item.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-white/10">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center px-4 py-3 bg-red-500/20 text-red-500 rounded-xl font-bold hover:bg-red-500/30 transition-all"
                            >
                                Log Out
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
}
