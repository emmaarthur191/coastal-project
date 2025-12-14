import React from 'react';
import GlassCard from './GlassCard';

interface ModernStatCardProps {
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    colorClass?: string; // Expecting tailwind color classes like 'text-blue-500'
    subtext?: string;
}

const ModernStatCard: React.FC<ModernStatCardProps> = ({
    label, value, change, trend = 'neutral', icon, colorClass = 'text-blue-600 dark:text-blue-400'
}) => {
    const isUp = trend === 'up';
    const isDown = trend === 'down';

    return (
        <GlassCard hoverEffect={true} className="p-6 flex flex-col justify-between h-full relative overflow-hidden group">
            {/* Background decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-xl ${isUp ? 'bg-emerald-500' : 'bg-blue-500'}`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-sm ${colorClass}`}>
                    {icon}
                </div>
                {change && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isUp ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-500/20' :
                            isDown ? 'text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-500/20' :
                                'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700'
                        }`}>
                        {isUp && '↗'} {isDown && '↘'} {change}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1 opacity-80">{label}</h3>
                <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</div>
            </div>
        </GlassCard>
    );
};

export default ModernStatCard;
