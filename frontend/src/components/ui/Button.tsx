import React, { ButtonHTMLAttributes, ElementType } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: ElementType;
    className?: string; // Explicitly allow className
}

export const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    type = 'button',
    icon: Icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95";

    const variants = {
        primary: "bg-coastal-primary text-white hover:bg-indigo-600 shadow-md hover:shadow-lg shadow-indigo-500/20 focus:ring-indigo-500",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-500 shadow-sm",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 focus:ring-red-500",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 focus:ring-emerald-500",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 focus:ring-amber-500",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
            {...props}
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );
};
