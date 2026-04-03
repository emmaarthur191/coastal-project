import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductsServicesManagement from '../components/manager/ProductsServicesManagement';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout'; 
import OverviewSection from '../components/manager/OverviewSection';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import AdministrativeHub from '../components/operational/AdministrativeHub';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialOperationsHub from '../components/operational/FinancialOperationsHub';

function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simplified Menu for Unified Hub Architecture
  const menuItems = React.useMemo(() => [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'financial-requests', name: 'Requests Hub', icon: '📝' },
    { id: 'onboarding', name: 'Onboarding', icon: '🤝' },
    { id: 'administration', name: 'Admin Ops', icon: '⚙️' },
    { id: 'financial-ops', name: 'Internal Finance', icon: '💰' },
    { id: 'support', name: 'Support & Security', icon: '🛡️' },
    { id: 'products', name: 'Products', icon: '🎁' }
  ], []);

  const fetchDashboardMetrics = async () => {
    try {
      const response = await authService.getOperationalMetrics();
      if (response.success) {
        setDashboardData({
          branch_metrics: [
            { label: 'System Uptime', value: response.data.system_uptime, change: '+0.1%', trend: 'up', icon: '⏱️' },
            { label: 'Transactions', value: response.data.transactions_today?.toLocaleString() || '0', change: `+${response.data.transaction_change || 0}%`, trend: 'up', icon: '💳' },
            { label: 'API Speed', value: `${response.data.api_response_time}ms`, change: '-5ms', trend: 'up', icon: '⚡' },
            { label: 'Failed TXs', value: response.data.failed_transactions?.toString() || '0', change: `+${response.data.failed_change || 0}`, trend: 'down', icon: '❌' }
          ],
          staff_performance: response.data.staff_performance || [],
          pending_approvals: response.data.pending_approvals || []
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleLogout = async () => { 
    await logout(); 
    navigate('/login'); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coastal-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'overview': 
        return (
          <OverviewSection 
            dashboardData={dashboardData} 
            onReviewAccountOpening={() => setActiveView('onboarding')} 
            onRefreshDashboard={fetchDashboardMetrics} 
          />
        );
      
      case 'financial-requests':
        return <FinancialRequestsHub mode="manager" />;
      
      case 'onboarding':
        return <OnboardingHub mode="manager" />;
      
      case 'administration':
        return <AdministrativeHub mode="manager" />;
      
      case 'financial-ops':
        return <FinancialOperationsHub mode="manager" />;
      
      case 'support':
        return <SupportHub mode="manager" />;
      
      case 'products':
        return <ProductsServicesManagement />;
        
      default:
        return <OverviewSection dashboardData={dashboardData} onRefreshDashboard={fetchDashboardMetrics} />;
    }
  };

  return (
    <DashboardLayout
      title="Manager Portal"
      user={user}
      menuItems={menuItems}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
    >
      <div className="p-1 md:p-4">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}

export default ManagerDashboard;
