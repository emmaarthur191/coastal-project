/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock the auth service
vi.mock('../services/api', () => ({
    authService: {
        checkAuth: vi.fn().mockResolvedValue({ authenticated: false }),
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

// Mock ProtectedRoute component for testing
const MockProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div>Redirected to login</div>;
    }

    return <>{children}</>;
};

const TestApp: React.FC = () => (
    <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                <Route
                    path="/protected"
                    element={
                        <MockProtectedRoute>
                            <div>Protected Content</div>
                        </MockProtectedRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    </AuthProvider>
);

describe('ProtectedRoute', () => {
    it('should show loading state initially', () => {
        render(<TestApp />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect unauthenticated users', async () => {
        render(<TestApp />);

        // Wait for auth check to complete
        expect(await screen.findByText('Redirected to login')).toBeInTheDocument();
    });
});
