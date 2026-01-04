import React from 'react';

/**
 * Props for the Card component.
 */
interface CardProps {
    /** The content to be rendered inside the card. */
    children: React.ReactNode;
    /** Additional CSS classes to apply to the card container. */
    className?: string;
    /** Tailind padding classes. Defaults to 'p-6'. */
    padding?: string;
    /** The visual variant of the card. 'glass' applies a backdrop-blur effect. Defaults to 'default'. */
    variant?: 'default' | 'glass';
}

/**
 * A container component with optional glassmorphism effects.
 * Used as the base for most dashboard sections.
 */
export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-6', variant = 'default' }) => {
    const baseClasses = variant === 'glass'
        ? 'glass-card'
        : 'bg-white rounded-2xl shadow-card border border-gray-100 hover:shadow-lg transition-shadow duration-200';

    return (
        <div className={`${baseClasses} ${padding} ${className}`}>
            {children}
        </div>
    );
};

/**
 * Props for the CardHeader component.
 */
interface CardHeaderProps {
    /** The title text of the card section. */
    title: string;
    /** Optional element (like a button or link) to render on the right side of the header. */
    action?: React.ReactNode;
}

/**
 * A standard header for Card components, providing a title and optional action element.
 */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, action }) => (
    <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-secondary-900">{title}</h3>
        {action && <div>{action}</div>}
    </div>
);
