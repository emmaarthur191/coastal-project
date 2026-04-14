import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout';
import OverviewSection from '../components/manager/OverviewSection';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import AdministrativeHub from '../components/operational/AdministrativeHub';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialOperationsHub from '../components/operational/FinancialOperationsHub';
import ProfileSettings from '../components/shared/ProfileSettings';
import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';
import { 
  LayoutDashboard, 
  FileText, 
  UserPlus, 
  ShieldCheck, 
  Wallet, 
  Lock, 
  MessageSquare, 
  FileSearch, 
  User,
  Activity,
  Package,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { UserExtended, ManagerDashboardData } from '../types';



function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [initialView] = useState<'loans' | 'cash_advances' | 'refunds' | 'pending-loans' | 'reports'>('pending-loans');
  const [initialShowForm] = useState(false);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Simplified Menu for Unified Hub Architecture
  const menuItems = React.useMemo(() => [
    { id: 'overview', name: 'Dashboard Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'financial-requests', name: 'Financial Hub', icon: <FileText className="w-5 h-5" /> },
    { id: 'onboarding', name: 'Member Onboarding', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'administration', name: 'Administrative Center', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'financial-ops', name: 'Internal Finance', icon: <Wallet className="w-5 h-5" /> },
    { id: 'support', name: 'Support & Security', icon: <Lock className="w-5 h-5" /> },
    { id: 'messaging', name: 'Staff Messenger', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'my-payslips', name: 'My Payslips', icon: <FileSearch className="w-5 h-5" /> },
    { id: 'settings', name: 'My Profile', icon: <User className="w-5 h-5" /> }
  ], []);


  const fetchDashboardMetrics = async () => {
    try {
      const response = await authService.getOperationalMetrics();
      if (response.success) {
        setDashboardData({
          branch_metrics: [
            { label: 'System Uptime', value: response.data.system_uptime, change: '+0.1%', trend: 'up', icon: <Activity className="w-5 h-5" /> },
            { label: 'Financial Products', value: response.data.financial_products?.toString() || '0', change: 'New', trend: 'neutral', icon: <Package className="w-5 h-5" /> },
            { label: 'Transactions', value: response.data.transactions_today?.toLocaleString() || '0', change: `+${response.data.transaction_change || 0}%`, trend: 'up', icon: <CreditCard className="w-5 h-5" /> },
            { label: 'Failed TXs', value: response.data.failed_transactions?.toString() || '0', change: `+${response.data.failed_change || 0}`, trend: 'down', icon: <AlertCircle className="w-5 h-5 text-red-500" /> }
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
        return <FinancialRequestsHub mode="manager" initialView={initialView} initialShowForm={initialShowForm} />;

      case 'onboarding':
        return <OnboardingHub mode="manager" />;

      case 'administration':
        return <AdministrativeHub mode="manager" />;

      case 'financial-ops':
        return <FinancialOperationsHub mode="manager" />;

      case 'support':
        return <SupportHub mode="manager" />;

      case 'products':
        return <AdministrativeHub mode="manager" initialTab="charges" />;


      case 'my-payslips':
        return <StaffPayslipViewer />;
      
      case 'settings':

        return <ProfileSettings user={user} />;

      default:
        return <OverviewSection dashboardData={dashboardData} onRefreshDashboard={fetchDashboardMetrics} />;
    }
  };

  return (
    <DashboardLayout
      title="Manager Portal"
      user={user as UserExtended | null}

      menuItems={menuItems}
      activeView={activeView}
      onNavigate={(id) => {
        if (id === 'messaging') {
          navigate('/messaging');
        } else {
          setActiveView(id);
        }
      }}
      onLogout={handleLogout}
    >
      <div className="p-4 lg:p-10">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}

export default ManagerDashboard;
