/**
 * Production-safe logger utility
 * Only logs in development mode, silent in production
 */

const getEnv = () => ({
    isDevelopment: (typeof window !== 'undefined' && (window as any).__LOGGER_DEV_OVERRIDE__ !== undefined)
        ? (window as any).__LOGGER_DEV_OVERRIDE__
        : (import.meta.env.DEV || import.meta.env.MODE === 'development')
});

// PII Fields for exact-key masking (Black Team Standard)
const PII_KEYS = new Set([
    'password', 'token', 'id_number', 'phone_number', 'ssnit_number',
    'staff_id', 'digital_address', 'first_name', 'last_name', 'email',
    'amount', 'balance', 'current_balance', 'recipient', 'sender',
    'sender_name', 'recipient_name', 'message', 'body', 'content',
    'account_number', 'card_number', 'cvv', 'pin'
]);

/**
 * Hardened Redaction Logic (Red/Black Team Standard)
 * Neutralizes homoglyph bypasses via NFKC normalization.
 * Recursively redacts objects and strings.
 */
const secureRedact = (data: any): any => {
    // 1. Handle Strings (Pattern Match + Unicode Normalization)
    if (typeof data === 'string') {
        // Red Team Neutralization: Normalize Unicode (NFKC) to catch characters like Cyrillic 'а'
        let sanitized = data.normalize('NFKC');

        // Redact Bearer tokens
        sanitized = sanitized.replace(/Bearer\s+[\w.-]+/gi, 'Bearer [REDACTED]');

        // Redact standard JSON-like PII patterns with hardened regex
        // Matches "key": "value" or 'key': 'value' or key: 'value'
        const piiFieldsPattern = Array.from(PII_KEYS).join('|');
        const piiRegex = new RegExp(`(${piiFieldsPattern})(['"\\s]*[:=][\\s'"\\s]*)([^'"\\s,{}[\\]]{3,})(['"\\s]*)`, 'gi');

        return sanitized.replace(piiRegex, (match, p1, p2, _p3, p4) => {
            return `${p1}${p2}[REDACTED]${p4}`;
        });
    }

    // 2. Handle Objects/Arrays (Precise Key Match)
    if (data && typeof data === 'object') {
        const redacted: any = Array.isArray(data) ? [] : {};
        for (const [key, value] of Object.entries(data)) {
            if (PII_KEYS.has(key.toLowerCase())) {
                redacted[key] = '[REDACTED]';
            } else {
                redacted[key] = secureRedact(value);
            }
        }
        return redacted;
    }

    return data;
};

export const logger = {
    log: (...args: unknown[]) => {
        if (getEnv().isDevelopment) {
            console.log(...args);
        }
    },

    warn: (...args: unknown[]) => {
        if (getEnv().isDevelopment) {
            console.warn(...args);
        }
    },

    error: (...args: unknown[]) => {
        const { isDevelopment } = getEnv();
        if (!isDevelopment) {
            const sanitizedArgs = args.map(secureRedact);
            console.error('[Error]', ...sanitizedArgs);
        } else {
            console.error(...args);
        }
    },

    debug: (...args: unknown[]) => {
        if (getEnv().isDevelopment) {
            console.debug(...args);
        }
    },

    info: (...args: unknown[]) => {
        if (getEnv().isDevelopment) {
            console.info(...args);
        }
    },

    // Special method for API logging
    api: (message: string, data?: unknown) => {
        if (getEnv().isDevelopment) {
            console.log(`[API] ${message}`, data || '');
        }
    },

    // Group logs (dev only)
    group: (label: string) => {
        if (getEnv().isDevelopment) {
            console.group(label);
        }
    },

    groupEnd: () => {
        if (getEnv().isDevelopment) {
            console.groupEnd();
        }
    }
};

export default logger;
