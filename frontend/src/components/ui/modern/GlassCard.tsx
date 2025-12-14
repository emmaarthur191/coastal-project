import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
    return (
        <div
            className={`
        bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl 
        ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-2xl transition-all duration-300' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default GlassCard;
