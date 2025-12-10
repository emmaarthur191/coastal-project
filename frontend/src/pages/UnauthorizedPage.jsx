import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * UnauthorizedPage - Displayed when a user tries to access a route they don't have permission for
 */
const UnauthorizedPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Get the appropriate dashboard for the user's role
    const getDashboardRoute = () => {
        if (!user) return '/login';

        const dashboardRoutes = {
            customer: '/member-dashboard',
            cashier: '/cashier-dashboard',
            mobile_banker: '/mobile-banker-dashboard',
            manager: '/manager-dashboard',
            operations_manager: '/operations-dashboard',
            administrator: '/dashboard',
            superuser: '/dashboard',
        };

        return dashboardRoutes[user.role] || '/dashboard';
    };

    const getRoleDisplayName = () => {
        const roleNames = {
            customer: 'Customer',
            cashier: 'Cashier',
            mobile_banker: 'Mobile Banker',
            manager: 'Manager',
            operations_manager: 'Operations Manager',
            administrator: 'Administrator',
            superuser: 'Superuser',
        };
        return roleNames[user?.role] || 'User';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-8">
                    <ShieldX className="w-12 h-12 text-red-500" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>

                {/* Description */}
                <p className="text-gray-600 mb-8">
                    You don't have permission to access this page.
                    {user && (
                        <>
                            <br />
                            Your current role is <span className="font-semibold text-gray-800">{getRoleDisplayName()}</span>.
                        </>
                    )}
                </p>

                {/* Information Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
                    <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800">
                                <strong>Need access?</strong> Contact your administrator or manager to request the appropriate permissions for this area.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate(getDashboardRoute())}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        My Dashboard
                    </button>
                </div>

                {/* Logout Option */}
                {user && (
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Sign in with a different account
                    </button>
                )}
            </div>
        </div>
    );
};

export default UnauthorizedPage;
