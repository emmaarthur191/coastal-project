import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService as authService, LoanExtended as Loan, MessageThreadExtended, OperationsMetrics, BranchActivity, SystemAlert, WorkflowStatus, ServiceCharge, Complaint, CashAdvance, Refund, Account } from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Modular Operational Components (Unified Hub)
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import SecurityOversight from '../components/operational/SecurityOversight';
import OperationalOverview from '../components/operational/OperationalOverview';
import OperationalMessenger from '../components/operational/OperationalMessenger';
import OperationalReports, { ReportParams } from '../components/operational/OperationalReports';
import OnboardingHub from '../components/operational/OnboardingHub';
import AdministrativeHub from '../components/operational/AdministrativeHub';

// Legacy/Specialized Sub-components
import OverviewTab from '../components/OverviewTab';
import MobileBankerManagementSection from '../components/manager/MobileBankerManagementSection';
import ProductsServicesManagement from '../components/manager/ProductsServicesManagement';

import { FraudAlert } from '../api/models/FraudAlert';
import { Message } from '../api/models/Message';

type ActiveView = 'overview' | 'accounts' | 'complaints' | 'account-opening' | 'loan-approvals' | 'cash-advances' | 'refunds' | 'staff-ids' | 'mobile-banker-management' | 'branches' | 'reports' | 'alerts' | 'charges' | 'messaging' | 'products-services' | 'security';

interface StaffId {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  staff_id: string;
  employment_date: string;
  is_active: boolean;
  is_approved: boolean;
  date_joined: string;
}

function OperationsManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | number | null>(null);

  const [dashboardData, setDashboardData] = useState<{
    metrics: OperationsMetrics | null;
    branchActivity: BranchActivity[];
    systemAlerts: SystemAlert[];
    workflowStatus: WorkflowStatus | Record<string, never>;
    serviceCharges: ServiceCharge[];
  }>({
    metrics: null,
    branchActivity: [],
    systemAlerts: [],
    workflowStatus: {},
    serviceCharges: [],
  });

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);

  // Messaging state
  const [messageThreads, setMessageThreads] = useState<MessageThreadExtended[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThreadExtended | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Reporting state
  const [reportsData, setReportsData] = useState<any>({});
  const [reportParams, setReportParams] = useState<ReportParams>({
    type: 'transactions',
    format: 'pdf',
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0]
  });

  const [newCharge, setNewCharge] = useState({
    name: '', description: '', charge_type: 'percentage', rate: '', applicable_to: []
  });
  const [serviceChargeCalculation, setServiceChargeCalculation] = useState<any>(null);

  const [staffIds, setStaffIds] = useState<StaffId[]>([]);
  const [staffIdFilters, setStaffIdFilters] = useState({});
  const [newComplaint, setNewComplaint] = useState({
    subject: '', description: '', category: 'service', priority: 'medium'
  });

  // --- HANDLERS ---
  const handleLogout = useCallback(async () => { await logout(); navigate('/login'); }, [logout, navigate]);

  const handleCreateComplaint = async () => {
    try {
      await authService.createComplaint(newComplaint);
      alert('Incident logged in the priority queue.');
      setNewComplaint({ subject: '', description: '', category: 'service', priority: 'medium' });
      fetchData();
    } catch (err) {
      alert('Incident logging failed.');
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        metricsRes, branchRes, alertsRes, workflowRes, chargesRes,
        fraudRes, threadsRes, statsRes
      ] = await Promise.all([
        authService.getOperationalMetrics(),
        authService.getBranchActivity(),
        authService.getSystemAlerts(),
        authService.getWorkflowStatus(),
        authService.getServiceCharges(),
        authService.getFraudAlerts(),
        authService.getMessageThreads(),
        authService.getServiceStats()
      ]);

      setDashboardData({
        metrics: metricsRes.success && metricsRes.data ? metricsRes.data : null,
        branchActivity: branchRes.success && Array.isArray(branchRes.data) ? branchRes.data : [],
        systemAlerts: alertsRes.success && Array.isArray(alertsRes.data) ? alertsRes.data : [],
        workflowStatus: workflowRes.success && workflowRes.data ? workflowRes.data : {},
        serviceCharges: chargesRes.success && Array.isArray(chargesRes.data) ? chargesRes.data : [],
      });

      if (fraudRes.success) {
        const data = fraudRes.data;
        setFraudAlerts((Array.isArray(data) ? data : (data as { results?: FraudAlert[] })?.results || []) as FraudAlert[]);
      }
      if (threadsRes.success) {
        const data = threadsRes.data;
        setMessageThreads((Array.isArray(data) ? data : (data as { results?: MessageThreadExtended[] })?.results || []) as MessageThreadExtended[]);
      }

      if (statsRes.success && statsRes.data) {
        setReportsData({
          monthlyData: (statsRes.data as any).monthly_volume || [],
          categoryData: (statsRes.data as any).type_distribution || []
        });
      }
    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectThread = async (thread: MessageThreadExtended) => {
    setSelectedThread(thread);
    try {
      const res = await authService.getThreadMessages(String(thread.id));
      if (res.success) {
        const data = res.data as any;
        setMessages(Array.isArray(data) ? data : data?.results || []);
      }
    } catch (err) {
      console.error('Failed to load thread');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;
    setIsProcessing('sending');
    try {
      await authService.createMessage({
        thread_id: String(selectedThread.id),
        content: newMessage
      });
      setNewMessage('');
      const res = await authService.getThreadMessages(String(selectedThread.id));
      if (res.success) {
        const data = res.data as any;
        setMessages(Array.isArray(data) ? data : data?.results || []);
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const handleGenerateReport = async () => {
    setIsProcessing('generating-report');
    try {
      const res = await authService.generateOperationalReport(reportParams as any);
      if (res.success && res.data) {
        const blob = new Blob([res.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `OM-Report-${reportParams.type}.${reportParams.format}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } finally {
      setIsProcessing(null);
    }
  };


  // --- MENU ---
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'loan-approvals', name: 'Loan Approvals', icon: '✅' },
    { id: 'cash-advances', name: 'Cash Advances', icon: '💵' },
    { id: 'refunds', name: 'Refunds', icon: '🔄' },
    { id: 'account-opening', name: 'Member Onboarding', icon: '👤' },
    { id: 'staff-ids', name: 'Staff IDs', icon: '🆔' },
    { id: 'reports', name: 'Analytics & Reports', icon: '📋' },
    { id: 'complaints', name: 'Performance & Incidents', icon: '🚨' },
    { id: 'security', name: 'Security Hub', icon: '🛡️' },
    { id: 'messaging', name: 'Staff Chat', icon: '💬' },
    { id: 'mobile-banker-management', name: 'Mobile Bankers', icon: '🛵' },
    { id: 'charges', name: 'Charges Config', icon: '🏷️' },
    { id: 'products-services', name: 'Products', icon: '🎁' }
  ];

  // --- CONTENT ---
  const renderContent = () => {
    const { metrics, branchActivity, workflowStatus, serviceCharges } = dashboardData;

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
      case 'account-opening':
        return <OnboardingHub mode={user?.role === 'manager' || user?.role === 'operations_manager' ? 'manager' : 'staff'} />;
      case 'loan-approvals':
      case 'cash-advances':
      case 'refunds':
        return (
          <FinancialRequestsHub
            mode="manager"
            initialView={activeView === 'loan-approvals' ? 'loans' : (activeView === 'cash-advances' ? 'cash_advances' : 'refunds')}
          />
        );
      case 'complaints':
        return <SupportHub mode="manager" initialTab="complaints" />;
      case 'accounts':
        return <AdministrativeHub mode="manager" initialTab="accounts" />;
      case 'staff-ids':
        return <AdministrativeHub mode="manager" initialTab="staff-ids" />;
      case 'charges':
        return <AdministrativeHub mode="manager" initialTab="charges" />;
      case 'reports':
        return (
          <div className="space-y-8">
            <OperationalReports
              reportParams={reportParams}
              onParamsChange={setReportParams}
              onGenerateReport={handleGenerateReport}
              isGenerating={isProcessing === 'generating-report'}
            />
            <OperationalOverview
              monthlyData={reportsData.monthlyData}
              categoryData={reportsData.categoryData}
              loading={loading}
            />
          </div>
        );
      case 'security':
        return (
          <SecurityOversight
            view="alerts"
            alerts={fraudAlerts}
            onInvestigate={(id) => navigate(`/fraud/alerts`)}
            onConfirmFraud={(id) => authService.reviewFraudAlert(String(id), 'confirmed').then(() => fetchData())}
            onDismissAlert={(id) => authService.reviewFraudAlert(String(id), 'dismissed').then(() => fetchData())}
          />
        );
      case 'messaging':
        return (
          <OperationalMessenger
            threads={messageThreads as any}
            selectedThread={selectedThread as any}
            messages={messages as any}
            newMessage={newMessage}
            onSelectThread={handleSelectThread as any}
            onSendMessage={handleSendMessage}
            onNewMessageChange={setNewMessage}
            isProcessing={isProcessing}
          />
        );
      case 'charges':
        return <AdministrativeHub mode="manager" initialTab="charges" />;
      case 'products-services':
        return <Card><ProductsServicesManagement /></Card>;
      default: return <div>Select a module from the sidebar.</div>;
    }
  };

  return (
    <DashboardLayout
      title="Coastal Operations Master"
      user={user}
      menuItems={menuItems}
      activeView={activeView}
      onNavigate={(id) => setActiveView(id as ActiveView)}
      onLogout={handleLogout}
    >
      <div className="max-w-[1400px] mx-auto">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}

export default OperationsManagerDashboard;
