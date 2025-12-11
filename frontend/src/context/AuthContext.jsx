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
        console.log('Auth check user data:', data.user); // DEBUG: show otp_verified
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
    try {
      const data = await authService.login(email, password);
      console.log('[DEBUG] Login response data:', data);
      console.log('[DEBUG] Login response user:', data.user);
      setUser(data.user);
      // Return user data with success so caller can use it immediately
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[DEBUG] Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Role checking functions - memoized to update when user changes
  const isManager = React.useMemo(() => user?.role === 'manager', [user]);
  const isCashier = React.useMemo(() => user?.role === 'cashier', [user]);
  const isMobileBanker = React.useMemo(() => user?.role === 'mobile_banker', [user]);
  const isOperationsManager = React.useMemo(() => user?.role === 'operations_manager', [user]);
  const isMember = React.useMemo(() => user?.role === 'customer', [user]);
  const isAdministrator = React.useMemo(() => user?.role === 'administrator', [user]);
  const isSuperuser = React.useMemo(() => user?.role === 'superuser', [user]);

  // Staff roles (non-customer roles)
  const staffRoles = ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator', 'superuser'];
  const isStaff = React.useMemo(() => staffRoles.includes(user?.role), [user]);

  // Helper function to check if user has a specific role
  const hasRole = React.useCallback((role) => user?.role === role, [user]);

  // Helper function to check if user has any of the specified roles
  const hasAnyRole = React.useCallback((roles) => {
    if (!user?.role) return false;
    // Superuser and administrator always have access
    if (['superuser', 'administrator'].includes(user.role)) return true;
    return roles.includes(user.role);
  }, [user]);

  // Get appropriate dashboard route for user's role
  const getDashboardRoute = React.useCallback(() => {
    if (!user) return '/login';
    const routes = {
      customer: '/member-dashboard',
      cashier: '/cashier-dashboard',
      mobile_banker: '/mobile-banker-dashboard',
      manager: '/manager-dashboard',
      operations_manager: '/operations-dashboard',
      administrator: '/dashboard',
      superuser: '/dashboard',
    };
    return routes[user.role] || '/dashboard';
  }, [user]);

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
    isAdministrator,
    isSuperuser,
    isStaff,
    // Role helper functions
    hasRole,
    hasAnyRole,
    getDashboardRoute,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
