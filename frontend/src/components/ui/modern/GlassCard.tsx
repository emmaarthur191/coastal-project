import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
    onClick?: () => void; // Added onClick just in case
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                glass-card-global rounded-2xl transition-all duration-300
                ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
};

export default GlassCard;
