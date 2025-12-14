import React, { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    className = '',
    type = 'text',
    ...props
}, ref) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                className={`
                    w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none
                    ${error
                        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10'
                    }
                    ${props.disabled ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-600 font-medium ml-1 flex items-center">
                    <span className="mr-1">⚠️</span> {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
