import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedStaffRoute - Simple role-based route protection for staff members
 * 
 * @param {React.ReactNode} children - The component to render if authorized
 * @param {string[]} allowedRoles - Array of roles that can access this route
 * @param {string} redirectTo - Where to redirect unauthorized users (default: /unauthorized)
 * 
 * Role hierarchy:
 * - superuser: Access to everything
 * - administrator: Access to all dashboards
 * - operations_manager: Operations dashboard + reports
 * - manager: Manager dashboard
 * - cashier: Cashier dashboard
 * - mobile_banker: Mobile banker dashboard
 * - customer: Member dashboard only
 */
const ProtectedStaffRoute = ({
    children,
    allowedRoles = [],
    redirectTo = '/unauthorized'
}) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Fast client-side check: if no token, redirect immediately
    const hasToken = !!localStorage.getItem('accessToken');
    if (!hasToken) {
        return <Navigate to="/login" replace />;
    }

    // Show loading state while checking remote authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Verifying access permissions...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        console.log('ProtectedStaffRoute: Auth failed or no user - network issue? Redirecting to login.');
        return <Navigate to="/login" replace />;
    }

    // Superuser and administrator have access to everything
    const privilegedRoles = ['superuser', 'administrator'];
    if (privilegedRoles.includes(user.role)) {
        return children;
    }

    // Check if user's role is in the allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect customers to member dashboard
        if (user.role === 'customer') {
            return <Navigate to="/member-dashboard" replace />;
        }

        // Redirect other unauthorized staff to appropriate dashboard
        return <Navigate to={redirectTo} replace />;
    }

    // Role is allowed, render children
    return children;
};

export default ProtectedStaffRoute;
