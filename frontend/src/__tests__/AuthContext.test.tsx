/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock the auth service
vi.mock('../services/api', () => ({
    authService: {
        checkAuth: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

import { authService } from '../services/api';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should provide initial state with loading true', async () => {
        (authService.checkAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
            authenticated: false,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Initially loading should be true
        expect(result.current.loading).toBe(true);
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);

        // Wait for auth check to complete
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('should set user when authenticated', async () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'customer',
        };

        (authService.checkAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
            authenticated: true,
            user: mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle login success', async () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
        };

        (authService.checkAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
            authenticated: false,
        });
        (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
            user: mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const loginResult = await result.current.login('testuser', 'password123');

        expect(loginResult.success).toBe(true);
        await waitFor(() => {
            expect(result.current.user).toEqual(mockUser);
        });
    });

    it('should handle login failure', async () => {
        (authService.checkAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
            authenticated: false,
        });
        (authService.login as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('Invalid credentials')
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const loginResult = await result.current.login('wronguser', 'wrongpass');

        expect(loginResult.success).toBe(false);
        expect(loginResult.error).toBe('Invalid credentials');
    });

    it('should handle logout', async () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
        };

        (authService.checkAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
            authenticated: true,
            user: mockUser,
        });
        (authService.logout as ReturnType<typeof vi.fn>).mockResolvedValue({});

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        await result.current.logout();

        await waitFor(() => {
            expect(result.current.user).toBeNull();
        });
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should throw error when useAuth is used outside AuthProvider', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });
});
