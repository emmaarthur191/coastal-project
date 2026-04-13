import React from 'react';
import { motion } from 'framer-motion';

/**
 * Props for the StatCard component.
 */
interface StatCardProps {
    /** The label/title of the statistic. */
    label: string,
    /** The main value to display (e.g., balance amount). */
    value: string | number,
    /** Optional icon or emoji to display at the top. */
    icon?: React.ReactNode,
    /** Optional trend text (e.g., '+5.2%'). */
    trend?: string,
    /** The direction of the trend, affecting color and icon. Defaults to 'up'. */
    trendDirection?: 'up' | 'down',
    /** Additional CSS classes to apply to the card. */
    className?: string,
    /** Optional delay for staggered animations */
    delay?: number
}

/**
 * A specialized Card for displaying dashboard metrics with support for icons and trends.
 * Includes luxurious hover animations and glassmorphism styling via Framer Motion.
 */
export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    trend,
    trendDirection = 'up',
    className = "",
    delay = 0
}) => {
    const trendColor = trendDirection === 'up' ? 'text-success-600' : 'text-error-600';
    const trendIcon = trendDirection === 'up' ? '↗' : '↘';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: [0.2, 0, 0, 1] as const }}
            whileHover={{ 
                y: -5, 
                transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as const } 
            }}
            className={`glass-card flex flex-col items-center justify-center text-center p-6 border-white/10 hover:border-primary-400/50 shadow-xl ${className}`}
        >
            {icon && <div className="text-3xl mb-3 drop-shadow-md">{icon}</div>}
            <div className="text-secondary-600 dark:text-slate-400 font-bold uppercase text-xs tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold text-secondary-900 dark:text-white mb-2 drop-shadow-sm">{value}</div>
            {trend && (
                <div className={`font-semibold text-sm flex items-center gap-1 ${trendColor} bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full backdrop-blur-sm`}>
                    {trend} {trendIcon}
                </div>
            )}
        </motion.div>
    );
};
