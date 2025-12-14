import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-200'
                } ${className}`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            <span className="sr-only">Toggle Dark Mode</span>
            <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ease-in-out flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    }`}
            >
                {theme === 'dark' ? (
                    <span className="text-sm">🌙</span>
                ) : (
                    <span className="text-sm">☀️</span>
                )}
            </span>
        </button>
    );
};
