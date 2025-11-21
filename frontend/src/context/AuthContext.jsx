import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/api.ts';

const AuthContext = createContext();

export { AuthContext };

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token refresh interval
  const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authService.checkAuth();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Set up periodic token validation
    const interval = setInterval(() => {
      if (authService.isAuthenticated()) {
        checkAuth();
      }
    }, TOKEN_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [checkAuth, TOKEN_CHECK_INTERVAL]);

  const login = async (email, password, role) => {
    console.log('[DEBUG] AuthContext.login called with:', email, '[PASSWORD HIDDEN]', role);
    try {
      console.log('[DEBUG] Calling authService.login...');
      const data = await authService.login(email, password);
      console.log('[DEBUG] authService.login returned:', data);
      setUser(data.user);
      console.log('[DEBUG] User set in context:', data.user);
      return { success: true };
    } catch (error) {
      console.log('[DEBUG] authService.login threw error:', error);
      return { success: false, error: error.message };
    }
  };

  // Role checking functions - memoized to update when user changes
   const isManager = React.useMemo(() => user?.role === 'manager', [user]);
   const isCashier = React.useMemo(() => user?.role === 'cashier', [user]);
   const isMobileBanker = React.useMemo(() => user?.role === 'mobile_banker', [user]);
   const isOperationsManager = React.useMemo(() => user?.role === 'operations_manager', [user]);
   const isMember = React.useMemo(() => user?.role === 'customer', [user]);

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    checkAuth, // Expose checkAuth for manual re-checks
    // Role checking functions
    isManager,
    isCashier,
    isMobileBanker,
    isOperationsManager,
    isMember,
    isStaff: user?.role === 'staff' || user?.role === 'cashier',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
