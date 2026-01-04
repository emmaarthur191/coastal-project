import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWebSocket } from '../hooks/useWebSocket';

const mockUser = { id: 1, role: 'staff' };

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        isAuthenticated: true
    })
}));

describe('useWebSocket Hook', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize correctly', () => {
        const { result } = renderHook(() => useWebSocket({ url: 'ws://localhost/test' }));

        expect(result.current.isConnected).toBe(false);
        expect(result.current.lastMessage).toBe(null);
    });

    it('should connect when rendered with a user', async () => {
        const onOpen = vi.fn();
        let capturedOnOpen: (() => void) | null = null;

        const mockWs = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: 0,
            set onopen(handler: () => void) {
                capturedOnOpen = handler;
            },
            get onopen() {
                return capturedOnOpen;
            }
        };

        // @ts-expect-error - mocking global WebSocket
        global.WebSocket = vi.fn().mockImplementation(function () { return mockWs; });
        (global.WebSocket as any).OPEN = 1;

        const { result } = renderHook(() => useWebSocket({
            url: 'ws://localhost/test',
            onOpen,
            reconnectAttempts: 0
        }));

        await waitFor(() => expect(capturedOnOpen).toBeTruthy());

        await act(async () => {
            if (capturedOnOpen) {
                (capturedOnOpen as () => void)();
            }
        });

        await waitFor(() => expect(result.current.isConnected).toBe(true));
        expect(onOpen).toHaveBeenCalled();
    });

    it('should send messages correctly', async () => {
        const mockSend = vi.fn();
        let capturedOnOpen: (() => void) | null = null;

        const mockWs = {
            send: mockSend,
            close: vi.fn(),
            readyState: 1, // Already OPEN
            set onopen(handler: () => void) {
                capturedOnOpen = handler;
            },
            get onopen() {
                return capturedOnOpen;
            }
        };

        // @ts-expect-error - mocking global WebSocket
        global.WebSocket = vi.fn().mockImplementation(function () { return mockWs; });
        (global.WebSocket as any).OPEN = 1;

        const { result } = renderHook(() => useWebSocket({
            url: 'ws://localhost/test',
            reconnectAttempts: 0
        }));

        // Wait for connection
        await waitFor(() => expect(capturedOnOpen).toBeTruthy());
        await act(async () => {
            if (capturedOnOpen) {
                (capturedOnOpen as () => void)();
            }
        });

        await waitFor(() => expect(result.current.isConnected).toBe(true));

        await act(async () => {
            (mockWs as any).readyState = 1;
            (mockWs as any).onopen();
        });

        await waitFor(() => expect(result.current.isConnected).toBe(true));

        act(() => {
            result.current.sendMessage({ type: 'ping' });
        });

        expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
    });

    it('should handle incoming messages', async () => {
        const mockWs = { send: vi.fn(), close: vi.fn(), readyState: 0, onopen: null, onmessage: null };
        // @ts-expect-error - mocking global WebSocket
        global.WebSocket = vi.fn().mockImplementation(function () { return mockWs; });
        (global.WebSocket as any).OPEN = 1;

        const onMessage = vi.fn();
        const { result } = renderHook(() => useWebSocket({
            url: 'ws://localhost/test',
            onMessage,
            reconnectAttempts: 0
        }));

        await waitFor(() => expect(mockWs.onopen).not.toBeNull());

        await act(async () => {
            (mockWs as any).readyState = 1;
            (mockWs as any).onopen();
        });

        await waitFor(() => expect(mockWs.onmessage).not.toBeNull());

        const mockData = { type: 'test', payload: 'hello' };
        await act(async () => {
            (mockWs as any).onmessage({ data: JSON.stringify(mockData) });
        });

        await waitFor(() => expect(result.current.lastMessage).toEqual(mockData));
        expect(onMessage).toHaveBeenCalledWith(mockData);
    });
});
