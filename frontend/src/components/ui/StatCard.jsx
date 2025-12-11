import React from 'react';
import { Card } from './Card';

export const StatCard = ({ label, value, icon, trend, trendDirection = 'up', className = "" }) => {
    const trendColor = trendDirection === 'up' ? 'text-success-600' : 'text-error-600';
    const trendIcon = trendDirection === 'up' ? '↗' : '↘';

    return (
        <Card variant="glass" className={`flex flex-col items-center justify-center text-center p-6 hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
            {icon && <div className="text-3xl mb-3 drop-shadow-sm">{icon}</div>}
            <div className="text-secondary-600 font-bold uppercase text-xs tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold text-secondary-900 mb-2 drop-shadow-sm">{value}</div>
            {trend && (
                <div className={`font-semibold text-sm flex items-center gap-1 ${trendColor} bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm`}>
                    {trend} {trendIcon}
                </div>
            )}
        </Card>
    );
};
