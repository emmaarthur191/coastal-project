import React from 'react';

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    type = 'button',
    icon: Icon
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500",
        secondary: "bg-white text-secondary-700 border border-secondary-300 hover:bg-secondary-50 focus:ring-secondary-500",
        danger: "bg-error-600 text-white hover:bg-error-700 focus:ring-error-500",
        success: "bg-success-600 text-white hover:bg-success-700 focus:ring-success-500",
        ghost: "bg-transparent text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );
};
