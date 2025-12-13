import React, { lazy, Suspense, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PageLoading from './PageLoading';

// Lazy load dashboards by role
const dashboards = {
  member: lazy(() => import('../pages/MemberDashboard')),
  cashier: lazy(() => import('../pages/CashierDashboard')),
  manager: lazy(() => import('../pages/ManagerDashboard')),
  operations_manager: lazy(() => import('../pages/OperationsManagerDashboard')),
  mobile_banker: lazy(() => import('../pages/MobileBankerDashboard')),
  default: lazy(() => import('../pages/Dashboard')),
};

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  const DashboardComponent = useMemo(() => {
    if (!user?.role) return dashboards.default;

    // Map user roles to dashboard components
    const roleMapping: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
      'member': dashboards.member,
      'cashier': dashboards.cashier,
      'manager': dashboards.manager,
      'operations_manager': dashboards.operations_manager,
      'mobile_banker': dashboards.mobile_banker,
    };

    return roleMapping[user.role] || dashboards.default;
  }, [user?.role]);

  return (
    <Suspense fallback={<PageLoading />}>
      <DashboardComponent />
    </Suspense>
  );
};

export default RoleBasedDashboard;