import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import type { User, UserExtended } from '../types';

export type { User };

interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export interface AuthContextType {
  user: UserExtended | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getDashboardRoute: () => string;
  loading: boolean;
  isAuthenticated: boolean;

  isManager: boolean;
  isCashier: boolean;
  isMobileBanker: boolean;
  isOperationsManager: boolean;
  isMember: boolean;
  updateUser: (user: UserExtended | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export for backward compatibility with useAuth.js and other imports
export { AuthContext };

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserExtended | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for auth:logout events from api.ts (triggered when refresh token fails)
    const handleAuthLogout = () => {
      setUser(null);
      // Optional: We could also call authService.logout() here, but the token is likely already invalid
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      if (typeof authService.checkAuth !== 'function') {
        console.error('checkAuth is not a function - checking exports');
        return;
      }
      const data: AuthResponse = await authService.checkAuth();
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await authService.login(username, password);

      if (!data.success) {
        return { success: false, error: data.error };
      }

      if ('error' in data && typeof (data as { error?: string }).error === 'string') {
        throw new Error((data as { error?: string }).error);
      }
      if (data.user) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: 'Login successful but no user data received' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Derived role states
  const isManager = user?.role === 'manager';
  const isCashier = user?.role === 'cashier';
  const isMobileBanker = user?.role === 'mobile_banker';
  const isOperationsManager = user?.role === 'operations_manager';
  const isMember = (user?.role as string) === 'customer' || (user?.role as string) === 'member';

  const getDashboardRoute = () => {
    if (isManager) return '/manager-dashboard';
    if (isCashier || isOperationsManager) return '/banking-operations';
    return '/dashboard';
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    checkAuth,
    getDashboardRoute,
    loading,
    isAuthenticated: !!user,
    isManager,
    isCashier,
    isMobileBanker,
    isOperationsManager,
    isMember,
    updateUser: (newUser: UserExtended | null) => setUser(newUser),
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
