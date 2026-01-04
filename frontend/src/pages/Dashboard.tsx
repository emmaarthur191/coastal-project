import React from 'react';
import { useAuth } from '../context/AuthContext';

// Import all role-specific dashboards
import ManagerDashboard from './ManagerDashboard';
import CashierDashboard from './CashierDashboard';
import MobileBankerDashboard from './MobileBankerDashboard';
import OperationsManagerDashboard from './OperationsManagerDashboard';
import MemberDashboard from './MemberDashboard';

function Dashboard() {
  const { user, isManager, isCashier, isMobileBanker, isOperationsManager, isMember } = useAuth();

  // Role-based dashboard rendering
  const renderDashboard = () => {
    if (isManager) return <ManagerDashboard />;
    if (isCashier) return <CashierDashboard />;
    if (isMobileBanker) return <MobileBankerDashboard />;
    if (isOperationsManager) return <OperationsManagerDashboard />;
    return <MemberDashboard />;
  };

  return (
    <div>
      {renderDashboard()}
    </div>
  );
}

export default Dashboard;
