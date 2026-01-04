import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Props for the ProtectedStaffRoute component.
 */
interface ProtectedStaffRouteProps {
    /** The component to render if the user is authorized. */
    children: ReactNode;
    /** Optional array of specific staff roles that are allowed to access this route. If empty, all staff are allowed. */
    allowedRoles?: string[];
    /** The path to redirect the user to if they are not authorized. Defaults to '/unauthorized'. */
    redirectTo?: string;
}

/**
 * A highly secure route protection wrapper for internal staff dashboards.
 *
 * It enforces the following security and access policies:
 * 1. Authenticated users only (via secure HTTP-only cookies).
 * 2. Role-based access control (RBAC) with hierarchical overrides for 'superuser' and 'administrator'.
 * 3. Automatic redirection for customers trying to access staff areas.
 * 4. Displays a secure "verifying" state while checking authentication.
 *
 * @param props - Configuration properties for staff route protection.
 * @returns The children components if authorized, or a redirect otherwise.
 */
const ProtectedStaffRoute: React.FC<ProtectedStaffRouteProps> = ({
    children,
    allowedRoles = [],
    redirectTo = '/unauthorized'
}) => {
    const { isAuthenticated, user, loading } = useAuth();

    // SECURITY: Auth state is managed by useAuth hook via HTTP-only cookies
    // Do NOT use localStorage for token checks - vulnerable to XSS

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
        console.warn('ProtectedStaffRoute: Auth failed or no user - network issue? Redirecting to login.');
        return <Navigate to="/login" replace />;
    }

    // Superuser and administrator have access to everything
    const privilegedRoles = ['superuser', 'administrator'];
    const userRole = user.role ?? '';
    if (privilegedRoles.includes(userRole)) {
        return children;
    }

    // Check if user's role is in the allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect customers to member dashboard
        if (userRole === 'customer') {
            return <Navigate to="/member-dashboard" replace />;
        }

        // Redirect other unauthorized staff to appropriate dashboard
        return <Navigate to={redirectTo} replace />;
    }

    // Role is allowed, render children
    return children;
};

export default ProtectedStaffRoute;
