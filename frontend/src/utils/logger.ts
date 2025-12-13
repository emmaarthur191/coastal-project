/**
 * Production-safe logger utility
 * Only logs in development mode, silent in production
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
    log: (...args: unknown[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    warn: (...args: unknown[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    error: (...args: unknown[]) => {
        // Always log errors, but sanitize in production
        if (isDevelopment) {
            console.error(...args);
        } else {
            // In production, log minimal error info without sensitive data
            const sanitizedArgs = args.map(arg => {
                if (typeof arg === 'string') {
                    return arg.replace(/Bearer\s+[\w.-]+/gi, 'Bearer [REDACTED]')
                        .replace(/password['":\s]+['"][^'"]+['"]/gi, 'password: [REDACTED]')
                        .replace(/token['":\s]+['"][^'"]+['"]/gi, 'token: [REDACTED]');
                }
                return '[Object]';
            });
            console.error('[Error]', ...sanitizedArgs);
        }
    },

    debug: (...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },

    info: (...args: unknown[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    // Special method for API logging
    api: (message: string, data?: unknown) => {
        if (isDevelopment) {
            console.log(`[API] ${message}`, data || '');
        }
    },

    // Group logs (dev only)
    group: (label: string) => {
        if (isDevelopment) {
            console.group(label);
        }
    },

    groupEnd: () => {
        if (isDevelopment) {
            console.groupEnd();
        }
    }
};

export default logger;
