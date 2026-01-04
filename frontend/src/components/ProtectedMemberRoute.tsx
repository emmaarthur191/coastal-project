import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoading from './PageLoading';

/**
 * Props for the ProtectedMemberRoute component.
 */
interface ProtectedMemberRouteProps {
  /** The components to be rendered if the user is a verified customer. */
  children: ReactNode;
}

/**
 * A route protection wrapper that ensures only authenticated users with the 'customer' role can access the wrapped components.
 *
 * If the authentication state is still loading, it displays a loading splash screen.
 * If the user is not authenticated, it redirects to the login page.
 * If the user is authenticated but does not have the 'customer' role, it redirects them to their role-specific dashboard.
 *
 * @param props - The properties for the route protection.
 * @returns The children components if authorized, or a redirect otherwise.
 */
const ProtectedMemberRoute: React.FC<ProtectedMemberRouteProps> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // CRITICAL: Wait for auth loading to complete before making decisions
  if (loading) {
    console.warn('[DEBUG] ProtectedMemberRoute: Still loading auth state...');
    return <PageLoading />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    console.warn('[DEBUG] ProtectedMemberRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check if we're in test mode - allow all authenticated users
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';
  if (isTestMode) {
    console.warn('[DEBUG] Test mode enabled - allowing member dashboard access for all authenticated users');
    return children;
  }

  // Only allow customers to access member routes
  if (user.role !== 'customer') {
    console.warn('[DEBUG] ProtectedMemberRoute: User role is', user.role, 'redirecting...');

    // Redirect based on role
    const roleRoutes: Record<string, string> = {
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
