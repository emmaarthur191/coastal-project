import React from 'react';
import GlassCard from './GlassCard';

interface ModernStatCardProps {
    label: string;
    value: string | number;
    change?: string | number;
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
        <GlassCard hoverEffect={true} className="p-4 flex flex-col justify-between h-full relative overflow-hidden group">
            {/* Background decoration (Reduced) */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 blur-lg ${isUp ? 'bg-emerald-500' : 'bg-blue-500'}`} />

            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-sm ${colorClass}`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4.5 h-4.5' }) : icon}
                </div>
                {change && (
                    <div className={`flex items-center text-[9px] font-black px-2 py-0.5 rounded-full ${isUp ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-500/20' :
                            isDown ? 'text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-500/20' :
                                'text-slate-900 bg-slate-200 shadow-sm font-black'
                        }`}>
                        {isUp && '↗'} {isDown && '↘'} {change}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-slate-900 dark:text-slate-400 font-black uppercase tracking-widest text-[9px] mb-0.5">{label}</h3>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter font-mono">{value}</div>
            </div>
        </GlassCard>
    );
};

export default ModernStatCard;
