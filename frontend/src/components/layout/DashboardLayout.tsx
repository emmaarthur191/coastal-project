import React, { useState, ReactNode } from 'react';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

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
        // Added background gradient to make glass effects visible
        <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50/50 flex">

            {/* Sidebar - Desktop - Glass Effect Applied */}
            <aside className="hidden lg:flex flex-col w-64 glass-sidebar fixed h-full z-10 transition-all duration-300">
                <div className="p-6 border-b border-white/10 flex items-center justify-center">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <span className="ml-3 text-xl font-bold tracking-tight text-white drop-shadow-md">Coastal</span>
                </div>

                <div className="flex items-center p-4 bg-white/10 mx-4 mt-6 rounded-xl border border-white/20 backdrop-blur-md">
                    <div className="h-10 w-10 rounded-full bg-primary-500/80 flex items-center justify-center text-white font-bold border-2 border-primary-200/50">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                        <p className="text-xs text-primary-200 truncate">{roleDisplay}</p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => item.available !== false && onNavigate(item.id)}
                                disabled={item.available === false}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-white/20 text-white shadow-inner border border-white/20 backdrop-blur-sm'
                                    : 'text-primary-100 hover:bg-white/10 hover:text-white'
                                    } ${item.available === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="text-lg mr-3 drop-shadow-sm">{item.icon}</span>
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center px-4 py-2 bg-error-500/20 border border-error-500/50 text-error-100 rounded-lg hover:bg-error-500/40 transition-colors text-sm font-medium backdrop-blur-sm"
                    >
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Content Wrapper */}
            <div className="flex-1 flex flex-col lg:ml-64 transition-all duration-300">

                {/* Mobile Header - Glass Effect */}
                <header className="lg:hidden glass-header p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center">
                        <div className="h-8 w-8 mr-3 flex items-center justify-center">
                            <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                        <span className="font-bold text-secondary-900">{title}</span>
                    </div>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-md bg-secondary-100/50 text-secondary-600 hover:bg-secondary-200/50 backdrop-blur-sm">
                        Menu
                    </button>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {/* Dashboard Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-900 drop-shadow-sm">
                                {menuItems.find(i => i.id === activeView)?.name || 'Dashboard'}
                            </h1>
                            <p className="text-secondary-500 text-sm mt-1">
                                Welcome back, {displayName}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 bg-white/60 border border-secondary-200/50 rounded-full text-xs font-medium text-secondary-600 shadow-sm backdrop-blur-sm">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
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
                <div className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex">
                    <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-white/90 backdrop-blur-xl pt-5 pb-4 border-r border-white/20">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-lg flex items-center justify-center mr-2">
                                    <img src={logo} alt="Logo" className="h-full w-full object-contain" />
                                </div>
                                <span className="ml-2 font-bold text-lg text-secondary-900">Coastal</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md text-secondary-400 hover:text-secondary-500">
                                Close
                            </button>
                        </div>

                        <div className="mt-5 flex-1 h-0 overflow-y-auto px-2">
                            <nav className="space-y-1">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (item.available !== false) {
                                                onNavigate(item.id);
                                                setMobileMenuOpen(false);
                                            }
                                        }}
                                        disabled={item.available === false}
                                        className={`w-full flex items-center px-4 py-3 text-base font-medium rounded-lg ${activeView === item.id
                                            ? 'bg-primary-50/80 text-primary-700 border border-primary-100/50'
                                            : 'text-secondary-600 hover:bg-secondary-50/50'
                                            }`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {item.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-secondary-200/50">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center px-4 py-2 bg-error-50 text-error-700 rounded-lg font-medium"
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
