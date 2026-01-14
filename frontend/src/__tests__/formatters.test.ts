import { describe, it, expect } from 'vitest';
import { formatCurrencyGHS, formatPercentage, formatNumber, formatDate } from '../utils/formatters';

describe('Formatters Utility', () => {
    describe('formatCurrencyGHS', () => {
        it('should format currency with symbol properly', () => {
            // en-GH locale uses GH₵ as symbol
            const result = formatCurrencyGHS(1234.56).replace(/\s/g, ' ');
            expect(result).toBe('GH₵1,234.56');
        });

        it('should format currency without symbol properly', () => {
            const result = formatCurrencyGHS(1234.56, false).replace(/\s/g, ' ');
            expect(result).toBe('1,234.56');
        });

        it('should handle zero properly', () => {
            const result = formatCurrencyGHS(0).replace(/\s/g, ' ');
            expect(result).toBe('GH₵0.00');
        });

        it('should handle null/undefined properly', () => {
            // formatters.js hardcodes 'GHS 0.00' for null/undefined
            expect(formatCurrencyGHS(null)).toBe('GHS 0.00');
            expect(formatCurrencyGHS(undefined)).toBe('GHS 0.00');
            expect(formatCurrencyGHS('invalid' as unknown as number)).toBe('GHS 0.00');
        });
    });

    describe('formatPercentage', () => {
        it('should format percentages properly', () => {
            expect(formatPercentage(15.5)).toBe('15.5%');
            expect(formatPercentage(15.556, 2)).toBe('15.56%');
        });

        it('should handle null/undefined properly', () => {
            expect(formatPercentage(null)).toBe('0%');
            expect(formatPercentage(undefined)).toBe('0%');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with thousands separator', () => {
            expect(formatNumber(1234567.89)).toBe('1,234,567.89');
        });

        it('should handle null/undefined properly', () => {
            expect(formatNumber(null)).toBe('0');
            expect(formatNumber(undefined)).toBe('0');
        });
    });

    describe('formatDate', () => {
        it('should format date string properly', () => {
            const date = '2023-12-25';
            const formatted = formatDate(date);
            // Actual format is "25 Dec 2023" for en-GH
            expect(formatted).toBe('25 Dec 2023');
        });

        it('should handle null properly', () => {
            expect(formatDate(null)).toBe('N/A');
        });

        it('should handle invalid dates properly', () => {
            expect(formatDate('not-a-date')).toBe('Invalid Date');
        });
    });
});
