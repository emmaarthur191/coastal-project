import React from 'react';

export const Card = ({ children, className = '', padding = 'p-6', variant = 'glass' }) => {
    const baseClasses = variant === 'glass'
        ? 'glass-card'
        : 'bg-white rounded-xl shadow-sm border border-secondary-200';

    return (
        <div className={`${baseClasses} ${padding} ${className}`}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, action }) => (
    <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-secondary-900">{title}</h3>
        {action && <div>{action}</div>}
    </div>
);
