import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeText, sanitizeUserInput } from '../utils/sanitizer';

describe('Sanitizer Utility', () => {
    describe('sanitizeHTML', () => {
        it('should strip out script tags', () => {
            const dirty = '<p>Hello <script>alert("xss")</script>world</p>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toBe('<p>Hello world</p>');
        });

        it('should allow safe tags', () => {
            const dirty = '<strong>Bold</strong> <em>Italic</em>';
            const clean = sanitizeHTML(dirty);
            expect(clean).toBe('<strong>Bold</strong> <em>Italic</em>');
        });

        it('should strip out unknown tags and attributes', () => {
            const dirty = '<div onClick="alert(1)">Danger</div>';
            const clean = sanitizeHTML(dirty);
            expect(clean).not.toContain('onClick');
            expect(clean).not.toContain('div');
        });
    });

    describe('sanitizeText', () => {
        it('should escape HTML characters', () => {
            const dirty = '<script>alert("xss")</script>';
            const clean = sanitizeText(dirty);
            expect(clean).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
        });
    });

    describe('sanitizeUserInput', () => {
        it('should sanitize as text by default', () => {
            const dirty = '<b>Bold</b>';
            const clean = sanitizeUserInput(dirty);
            expect(clean).toBe('&lt;b&gt;Bold&lt;&#x2F;b&gt;');
        });

        it('should sanitize as HTML when requested', () => {
            const dirty = '<b>Bold</b><script>alert(1)</script>';
            const clean = sanitizeUserInput(dirty, true);
            expect(clean).toBe('<b>Bold</b>');
        });
    });
});
