import React, { ButtonHTMLAttributes, ElementType } from 'react';

/**
 * Props for the Button component.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** The visual style variant of the button. Defaults to 'primary'. */
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
    /** The size of the button. Defaults to 'md'. */
    size?: 'sm' | 'md' | 'lg';
    /** Optional icon to display before the button text. */
    icon?: ElementType;
    /** Additional CSS classes to apply to the button. */
    className?: string; // Explicitly allow className
}

/**
 * A highly customizable, accessible button component with multiple variants and sizes.
 * Supports glassmorphism effects and micro-animations.
 *
 * @param props - The properties to configure the button.
 * @returns A styled HTML button element.
 */
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
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const variants = {
        primary: "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400 shadow-lg shadow-blue-500/20 focus:ring-blue-500 border border-transparent",
        secondary: "bg-white/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 focus:ring-slate-500 shadow-sm backdrop-blur-sm",
        danger: "bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-500 shadow-lg shadow-red-500/20 focus:ring-red-500 border border-transparent",
        success: "bg-emerald-500 dark:bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 focus:ring-emerald-500 border border-transparent",
        warning: "bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-500 shadow-lg shadow-amber-500/20 focus:ring-amber-500 border border-transparent",
        ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );
};
