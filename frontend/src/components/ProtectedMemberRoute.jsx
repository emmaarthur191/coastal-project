import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoading from './PageLoading';

/**
 * ProtectedMemberRoute - Protects routes that require customer/member access
 */
const ProtectedMemberRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // CRITICAL: Wait for auth loading to complete before making decisions
  if (loading) {
    console.log('[DEBUG] ProtectedMemberRoute: Still loading auth state...');
    return <PageLoading />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    console.log('[DEBUG] ProtectedMemberRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check if we're in test mode - allow all authenticated users
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';
  if (isTestMode) {
    console.log('[DEBUG] Test mode enabled - allowing member dashboard access for all authenticated users');
    return children;
  }

  // Only allow customers to access member routes
  if (user.role !== 'customer') {
    console.log('[DEBUG] ProtectedMemberRoute: User role is', user.role, 'redirecting...');

    // Redirect based on role
    const roleRoutes = {
      cashier: '/cashier-dashboard',
      mobile_banker: '/mobile-banker-dashboard',
      manager: '/manager-dashboard',
      operations_manager: '/operations-dashboard',
      administrator: '/dashboard',
      superuser: '/dashboard',
    };

    const redirectRoute = roleRoutes[user.role] || '/unauthorized';
    return <Navigate to={redirectRoute} replace />;
  }

  return children;
};

export default ProtectedMemberRoute;