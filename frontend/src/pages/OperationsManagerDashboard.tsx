import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.ts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Import Sub-components
import OverviewTab from '../components/OverviewTab';
import ServiceChargesTab from '../components/ServiceChargesTab';
import ReportsTab from '../components/cashier/ReportsTab';
import LoanApprovalsSection from '../components/LoanApprovalsSection';
import ClientRegistrationTab from '../components/ClientRegistrationTab';
import AccountsTab from '../components/AccountsTab';

import StaffIdsSection from '../components/manager/StaffIdsSection';
import MobileBankerManagementSection from '../components/manager/MobileBankerManagementSection.tsx';
import ProductsServicesManagement from '../components/manager/ProductsServicesManagement';
import SecuritySection from '../components/manager/SecuritySection';

// --- Types ---
interface WorkflowStatus {
  loan_disbursements: { completed: number; pending: number };
  account_onboarding: { completed: number; pending: number };
  kyc_verification: { completed: number; pending: number };
  service_charges: { completed: number; pending: number };
}

type ActiveView = 'overview' | 'accounts' | 'client-registration' | 'loan-approvals' | 'staff-ids' | 'mobile-banker-management' | 'branches' | 'reports' | 'alerts' | 'charges' | 'messaging' | 'products-services' | 'security';

function OperationsManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role || '');

  // --- STATE ---
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState<{
    metrics: Record<string, any> | null;
    branchActivity: any[];
    systemAlerts: any[];
    workflowStatus: WorkflowStatus | {};
    serviceCharges: any[];
  }>({
    metrics: null,
    branchActivity: [],
    systemAlerts: [],
    workflowStatus: {},
    serviceCharges: [],
  });

  const [newCharge, setNewCharge] = useState({
    name: '', description: '', charge_type: 'percentage', rate: '', applicable_to: []
  });
  const [serviceChargeCalculation, setServiceChargeCalculation] = useState<any>(null);
  const [reportData, setReportData] = useState(null);
  const [staffIds, setStaffIds] = useState([]);
  const [staffIdFilters, setStaffIdFilters] = useState({});

  // --- HANDLERS ---
  const handleLogout = useCallback(async () => { await logout(); navigate('/login'); }, [logout, navigate]);

  const handleGenerateReport = useCallback(async (reportType: string) => {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const reportDataPayload = { type: reportType, date_from: lastWeek, date_to: today };

    const result = await authService.generateReport(reportDataPayload);
    if (result.success) {
      alert(`Report '${reportType}' generated!`);
      setReportData(result.data);
    } else {
      alert('Failed: ' + result.error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metricsRes, branchRes, alertsRes, workflowRes, chargesRes] = await Promise.all([
          authService.getOperationalMetrics(),
          authService.getBranchActivity(),
          authService.getSystemAlerts(),
          authService.getWorkflowStatus(),
          authService.getServiceCharges()
        ]);

        setDashboardData({
          metrics: metricsRes.success ? metricsRes.data : {},
          branchActivity: branchRes.success && Array.isArray(branchRes.data) ? branchRes.data : [],
          systemAlerts: alertsRes.success && Array.isArray(alertsRes.data) ? alertsRes.data : [],
          workflowStatus: workflowRes.success ? workflowRes.data : {},
          serviceCharges: chargesRes.success && Array.isArray(chargesRes.data) ? chargesRes.data : [],
        });
      } catch (error) {
        console.error('Error fetching operations data:', error);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Fetch staff IDs when view is active or filters change
  const fetchStaffIds = useCallback(async () => {
    const result = await authService.getStaffIds(staffIdFilters);
    if (result.success) {
      setStaffIds(result.data?.results || result.data || []);
    }
  }, [staffIdFilters]);

  useEffect(() => {
    if (activeView === 'staff-ids') {
      fetchStaffIds();
    }
  }, [activeView, fetchStaffIds]);

  // --- MENU ---
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'accounts', name: 'Accounts', icon: '🏦' },
    { id: 'client-registration', name: 'Client Registration', icon: '👤' },
    { id: 'loan-approvals', name: 'Loan Approvals', icon: '✅' },
    { id: 'staff-ids', name: 'Staff IDs', icon: '🆔' },
    { id: 'mobile-banker-management', name: 'Mobile Bankers', icon: '🛵' },
    { id: 'branches', name: 'Branches', icon: '🏢' },
    { id: 'reports', name: 'Reports', icon: '📋' },
    { id: 'alerts', name: 'Alerts', icon: '🚨' },
    { id: 'charges', name: 'Charges', icon: '🏷️' },
    { id: 'products-services', name: 'Products & Services', icon: '🎁' },
    { id: 'messaging', name: 'Messaging', icon: '💬' },
    { id: 'security', name: 'Security', icon: '🛡️' }
  ];

  if (loading && !dashboardData.metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // --- CONTENT ---
  const renderContent = () => {
    const { metrics, branchActivity, workflowStatus, serviceCharges, systemAlerts } = dashboardData;

    switch (activeView) {
      case 'overview':
        return (
          <OverviewTab
            loading={loading}
            metrics={metrics}
            branchActivity={branchActivity}
            workflowStatus={workflowStatus}
          />
        );
      case 'accounts': return <Card><AccountsTab /></Card>;
      case 'client-registration': return <Card><ClientRegistrationTab /></Card>;
      case 'loan-approvals': return <Card><LoanApprovalsSection /></Card>;
      case 'staff-ids':
        return (
          <StaffIdsSection
            staffIds={staffIds}
            staffIdFilters={staffIdFilters}
            setStaffIdFilters={setStaffIdFilters}
            fetchStaffIds={fetchStaffIds}
          />
        );
      case 'mobile-banker-management':
        return (
          <Card>
            <MobileBankerManagementSection />
          </Card>
        );
      case 'branches':
        return (
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-secondary-900">Branch Activity Details</h2>
            <div className="text-center py-8 text-secondary-500">Detailed branch activity view coming soon.</div>
          </Card>
        );
      case 'reports':
        return (
          <Card>
            <ReportsTab />
          </Card>
        );
      case 'alerts':
        return (
          <Card>
            <h2 className="text-2xl font-bold mb-6 text-secondary-900">System Alerts</h2>
            {systemAlerts && systemAlerts.length > 0 ? (
              <div className="space-y-4">
                {systemAlerts.map((alert: any, index: number) => (
                  <div key={alert.id || index} className={`p-4 rounded-lg border-l-4 ${alert.type === 'warning' ? 'bg-warning-50 border-l-warning-500' :
                    alert.type === 'error' ? 'bg-error-50 border-l-error-500' :
                      alert.type === 'info' ? 'bg-primary-50 border-l-primary-500' : 'bg-success-50 border-l-success-500'
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {alert.type === 'warning' ? '⚠️' : alert.type === 'error' ? '❌' : alert.type === 'info' ? 'ℹ️' : '✅'}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-secondary-900 mb-1">{alert.message}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-secondary-600">
                          <span>🆔 {alert.id}</span>
                          <span className="uppercase font-semibold">📊 {alert.type}</span>
                          <span className="uppercase font-semibold">⚡ {alert.severity}</span>
                          <span>🕒 {new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary-500">
                <div className="text-4xl mb-4">✅</div>
                <p>No system alerts at this time.</p>
              </div>
            )}
          </Card>
        );
      case 'charges':
        return (
          <Card>
            <ServiceChargesTab
              serviceCharges={serviceCharges}
              newCharge={newCharge}
              setNewCharge={setNewCharge}
              serviceChargeCalculation={serviceChargeCalculation}
              setServiceChargeCalculation={setServiceChargeCalculation}
              authService={authService}
              refetchCharges={async () => {
                const chargesRes = await authService.getServiceCharges();
                if (chargesRes.success) setDashboardData(d => ({ ...d, serviceCharges: chargesRes.data }));
              }}
            />
          </Card>
        );
      case 'messaging':
        return (
          <Card className="text-center py-16 bg-gradient-to-br from-secondary-50 to-white">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-2">Secure Staff Messaging</h3>
            <p className="text-secondary-600 mb-8 max-w-md mx-auto">Encrypted internal communication channel.</p>
            <Button onClick={() => hasMessagingAccess ? navigate('/messaging') : alert('Access Denied')} size="lg" variant="primary">
              Open Secure Chat
            </Button>
          </Card>
        );

      case 'products-services':
        return (
          <Card>
            <ProductsServicesManagement />
          </Card>
        );
      case 'security':
        return <SecuritySection />;
      default: return null;
    }
  };

  return (
    <DashboardLayout
      title="Operations Portal"
      user={user}
      menuItems={menuItems}
      activeView={activeView}
      onNavigate={(id) => setActiveView(id as ActiveView)}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default OperationsManagerDashboard;