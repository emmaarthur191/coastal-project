import React, { forwardRef, InputHTMLAttributes, useId } from 'react';

/**
 * Props for the Input component.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
    /** The label text displayed above the input. */
    label?: string;
    /** Error message to display below the input. Triggers error styling. */
    error?: string;
    /** Additional CSS classes to apply to the container div. */
    className?: string;
    /** The component type to render (e.g., 'input', 'select', or a custom component). Defaults to 'input'. */
    as?: React.ElementType;
    /** Children elements, primarily used when 'as' is 'select' to render options. */
    children?: React.ReactNode;
    /** Number of rows for textarea. */
    rows?: number;
}

/**
 * A versatile input component that supports labels, validation errors, and custom rendering (e.g., as a textarea or select).
 * Built with accessible focus states and glassmorphism styling.
 */
export const Input = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, InputProps>(({
    label,
    error,
    className = '',
    type = 'text',
    as: Component = 'input',
    children,
    id,
    ...props
}, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div className={`mb-4 w-full ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1"
                >
                    {label}
                </label>
            )}
            <Component
                ref={ref}
                id={inputId}
                type={type}
                className={`
                    w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none
                    ${error
                        ? 'border-red-300 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                        : 'border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }
                    backdrop-blur-sm
                    ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                {...props}
            >
                {children}
            </Component>
            {error && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-bold ml-1 flex items-center">
                    <span className="mr-1">⚠️</span> {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
