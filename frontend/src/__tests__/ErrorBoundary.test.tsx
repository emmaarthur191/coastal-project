import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary';

// Component that throws an error
const ThrowError = () => {
    throw new Error('Test Error');
};

describe('ErrorBoundary Component', () => {
    it('should render children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div data-testid="child">Child Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByTestId('child')).toBeDefined();
        expect(screen.getByText('Child Content')).toBeDefined();
    });

    it('should render error UI when a child throws', () => {
        // Mock console.error to prevent it from cluttering the test output
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        const errorText = screen.queryByText(/Something went wrong/i) || screen.queryByText(/Development Error/i);
        expect(errorText).not.toBeNull();

        spy.mockRestore();
    });

    it('should allow retrying after an error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        // State is now hasError: true
        const retryButton = screen.getByText(/Try Again/i);

        // Rerender with a safe component BEFORE clicking retry
        // This ensures that when handleRetry is called, the child doesn't throw again
        rerender(
            <ErrorBoundary>
                <div data-testid="recovered">Recovered</div>
            </ErrorBoundary>
        );

        fireEvent.click(retryButton);

        expect(screen.getByTestId('recovered')).toBeDefined();
        spy.mockRestore();
    });
});
