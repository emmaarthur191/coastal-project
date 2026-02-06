import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../utils/logger';

describe('Logger Redaction', () => {
    beforeEach(() => {
        // Reset dev override
        if (typeof window !== 'undefined') {
            delete (window as any).__LOGGER_DEV_OVERRIDE__;
        }
        vi.restoreAllMocks();
    });

    it('should redact sensitive fields in non-development mode', () => {
        (window as any).__LOGGER_DEV_OVERRIDE__ = false;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const sensitiveData = JSON.stringify({
            first_name: 'Kojo',
            last_name: 'Antwi',
            email: 'kojo@example.com',
            balance: '5000.00'
        });

        logger.error('API Error:', sensitiveData);

        const callArgs = consoleSpy.mock.calls[0];
        const loggedMessage = callArgs.join(' ');

        expect(loggedMessage).toContain('[REDACTED]');
        expect(loggedMessage).not.toContain('Kojo');
        expect(loggedMessage).not.toContain('Antwi');
        expect(loggedMessage).not.toContain('5000.00');
    });

    it('should redact recursive objects and arrays', () => {
        (window as any).__LOGGER_DEV_OVERRIDE__ = false;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const complexData = {
            user: {
                first_name: 'Kojo',
                id_number: 'GHA-123',
                metadata: {
                    ip: '127.0.0.1',
                    email: 'kojo@ex.com'
                }
            },
            tags: ['tag1', 'phone_number: 0244000000'],
            safeField: 'KeepMe'
        };

        logger.error('Complex Log:', complexData);

        const redactedObj = consoleSpy.mock.calls[0][2] as any;

        expect(redactedObj.user.first_name).toBe('[REDACTED]');
        expect(redactedObj.user.id_number).toBe('[REDACTED]');
        expect(redactedObj.user.metadata.email).toBe('[REDACTED]');
        expect(redactedObj.tags[1]).toContain('[REDACTED]');
        expect(redactedObj.safeField).toBe('KeepMe');
    });

    it('should neutralize homoglyph bypasses via Unicode normalization', () => {
        (window as any).__LOGGER_DEV_OVERRIDE__ = false;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        // Unicode Cyrillic 'а' (U+0430) instead of Latin 'a' (U+0061)
        const homoglyphEmail = 'kojo@exаmple.com';

        logger.error('Bypass attempt:', `email: ${homoglyphEmail}`);

        const loggedMessage = consoleSpy.mock.calls[0].join(' ');
        expect(loggedMessage).toContain('[REDACTED]');
        expect(loggedMessage).not.toContain('kojo@ex');
    });

    it('should not redact in development mode', () => {
        (window as any).__LOGGER_DEV_OVERRIDE__ = true;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const pii = 'id_number: GHA-123456';

        logger.error('Log:', pii);
        expect(consoleSpy.mock.calls[0]).toContain(pii);
    });
});
