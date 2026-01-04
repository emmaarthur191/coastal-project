import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  needs_verification?: boolean;
  phone?: string;
  two_factor_phone?: string;
  otp_verified?: boolean;
}

interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
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
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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
  const isMember = user?.role === 'customer' || user?.role === 'member';

  const getDashboardRoute = () => {
    if (isManager) return '/manager-dashboard';
    if (isCashier) return '/cashier-dashboard';
    if (isMobileBanker) return '/mobile-banker-dashboard';
    if (isOperationsManager) return '/operations-dashboard';
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
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
