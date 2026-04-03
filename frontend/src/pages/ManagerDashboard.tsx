import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductsServicesManagement from '../components/manager/ProductsServicesManagement';
import { formatCurrencyGHS as _formatCurrencyGHS } from '../utils/formatters';
import { authService, ServiceCharge } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

import DashboardLayout from '../components/layout/DashboardLayout'; // Unified Layout
import OverviewSection from '../components/manager/OverviewSection';
import MessagingSection from '../components/manager/MessagingSection';
import UserManagementSection from '../components/manager/UserManagementSection';
import StaffIdsSection from '../components/manager/StaffIdsSection';
import TransactionsSection from '../components/manager/TransactionsSection';
import LoansSection from '../components/manager/LoansSection';
import ServiceChargesSection from '../components/manager/ServiceChargesSection';
import PayslipSection from '../components/manager/PayslipSection';
import CashFlowSection from '../components/manager/CashFlowSection';
import InterestSection from '../components/manager/InterestSection';
import CommissionSection from '../components/manager/CommissionSection';
import StatementsSection from '../components/manager/StatementsSection';
import ExpensesSection from '../components/manager/ExpensesSection';
import AccountsTab from '../components/AccountsTab';
import SecuritySection from '../components/manager/SecuritySection';
import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';
import AccountOpeningsSection from '../components/manager/AccountOpeningsSection';
import AccountClosuresSection from '../components/manager/AccountClosuresSection';
import PerformanceMonitoringSection from '../components/manager/PerformanceMonitoringSection';
import ReportsSection from '../components/manager/ReportsSection';

function ManagerDashboard() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role);

  // --- MENU ITEMS CONFIG ---
  // Updated colors to match Unified Theme vaguely, but icons/IDs remain
  const menuItems = React.useMemo(() => [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'accounts', name: 'Accounts', icon: '🏦' },
    { id: 'account-openings', name: 'Account Requests', icon: '📂' },
    { id: 'account-closures', name: 'Account Closures', icon: '🔒' },
    { id: 'messaging', name: 'Messaging', icon: '💬' },
    { id: 'products-services', name: 'Products & Services', icon: '🎁' },
    { id: 'users', name: 'Staff Users', icon: '👥' },
    { id: 'staff-ids', name: 'Staff IDs', icon: '🆔' },
    { id: 'transactions', name: 'All Transacs', icon: '💸' },
    { id: 'loans', name: 'Loan Apps', icon: '📝' },
    { id: 'charges', name: 'Charges', icon: '🏷️' },
    { id: 'payslip', name: 'Payslips', icon: '🧧' },
    { id: 'my_payslips', name: 'My Payslips', icon: '💰' },
    { id: 'cashflow', name: 'Cash Flow', icon: '🌊' },
    { id: 'interest', name: 'Interest', icon: '📈' },
    { id: 'commission', name: 'Commission', icon: '🤝' },
    { id: 'statements', name: 'Statements', icon: '📜' },
    { id: 'expenses', name: 'Expenses', icon: '📉' },
    { id: 'performance', name: 'Performance', icon: '📈' },
    { id: 'reports', name: 'Reports', icon: '📑' },
    { id: 'security', name: 'Security', icon: '🛡️' }
  ], []);

  // --- STATE MANAGEMENT ---
  const [activeView, setActiveView] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [_transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanPagination, setLoanPagination] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [cashFlow, setCashFlow] = useState(null);
  const [interestData, setInterestData] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [newCharge, setNewCharge] = useState<ServiceCharge>({
    name: '', description: '', charge_type: 'percentage', rate: '', applicable_to: []
  });
  const [serviceChargeCalculation, setServiceChargeCalculation] = useState(null);
  // unused: const [interestCalculation, setInterestCalculation] = useState(null);
  // unused: const [commissionCalculation, setCommissionCalculation] = useState(null);
  // unused: const [showDropdown, setShowDropdown] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    category: '', amount: '', description: '', date_incurred: new Date().toISOString().split('T')[0]
  });
  const [staffIds, setStaffIds] = useState([]);
  const [staffIdFilters, setStaffIdFilters] = useState({});

  // --- EFFECTS ---
  const fetchDashboardData = async () => {
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
      } else { console.error('Failed to fetch dashboard data:', response.error); }
    } catch (error) { console.error('Error fetching dashboard data:', error); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchTransactions = async () => { const r = await authService.getAllTransactions(); if (r.success) setTransactions(Array.isArray(r.data) ? r.data : []); };
  const fetchLoans = async (page = 1) => {
    const r = await authService.getPendingLoans(page);
    if (r.success && r.data) {
      setLoans(r.data.results || []);
      setLoanPagination({
        current_page: page,
        total_pages: Math.ceil((r.data.count || 0) / 20),
        total_count: r.data.count || 0
      });
    }
  };
  const fetchCashFlow = async () => { const r = await authService.getCashFlow(); if (r.success) setCashFlow(r.data); };
  const fetchInterest = async () => { const r = await authService.calculateInterest({}); if (r.success) setInterestData(r.data); };
  const fetchCommission = async () => { const r = await authService.calculateCommission({}); if (r.success) setCommissionData(r.data); };
  const fetchStaffMembers = async () => { const r = await authService.getAllStaff(); if (r.success) setStaffMembers(r.data as never[]); };
  const fetchExpenses = async () => { const r = await authService.getExpenses(); if (r.success) setExpenses(r.data as never[]); };
  const fetchStaffIds = async () => { const r = await authService.getStaffIds(staffIdFilters); if (r.success) setStaffIds(((r.data as { results?: never[] })?.results || r.data) as never[]); };

  useEffect(() => {
    if (activeView === 'transactions') fetchTransactions();
    if (activeView === 'loans') fetchLoans();
    if (activeView === 'cashflow') fetchCashFlow();
    if (activeView === 'interest') fetchInterest();
    if (activeView === 'commission') fetchCommission();
    if (activeView === 'users' || activeView === 'payslip') fetchStaffMembers();
    if (activeView === 'staff-ids') fetchStaffIds();
    if (activeView === 'expenses') fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, staffIdFilters]);

  // --- HANDLERS ---
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await (authService as unknown as { createUser: (data: Record<string, string>) => Promise<{ success: boolean; error?: string; data?: { staff_id?: string } }> }).createUser(formData);
    if (response.success) {
      alert(`User created! ID: ${response.data.staff_id || 'N/A'}`);
      setFormData({});
    } else { alert('Failed to create user: ' + response.error); }
  };

  const handleApproveLoan = async (loanId: string | number) => {
    const response = await authService.approveLoan(loanId);
    if (response.success) { alert('Loan approved successfully!'); fetchLoans(); }
    else { alert('Failed to approve loan: ' + response.error); }
  };

  const handleGeneratePayslip = async () => {
    const response = await authService.generatePayslip(formData);
    if (response.success) { alert('Payslip generated successfully!'); logger.debug('[Payslip] Generated:', response.data); }
    else { alert('Failed to generate payslip: ' + response.error); }
  };

  const handleGenerateStatement = async () => {
    const response = await authService.generateStatement(formData);
    if (response.success) { alert('Statement generated successfully!'); logger.debug('[Statement] Generated:', response.data); }
    else { alert('Failed to generate statement: ' + response.error); }
  };

  // --- LOADING VIEW ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handler to navigate to account openings section
  const handleReviewAccountOpening = () => {
    setActiveView('account-openings');
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <OverviewSection dashboardData={dashboardData} onReviewAccountOpening={handleReviewAccountOpening} onRefreshDashboard={fetchDashboardData} />;
      case 'accounts': return <AccountsTab />;
      case 'account-openings': return <AccountOpeningsSection onRefreshDashboard={fetchDashboardData} />;
      case 'account-closures': return <AccountClosuresSection onRefreshDashboard={fetchDashboardData} />;
      case 'messaging': return (
        <MessagingSection onOpenMessaging={() => {
          if (!hasMessagingAccess) { alert('Access denied.'); return; }
          navigate('/messaging');
        }} />
      );
      case 'products-services': return <ProductsServicesManagement />;
      case 'users': return (
        <UserManagementSection
          formData={formData} setFormData={setFormData}
          handleCreateUser={handleCreateUser}
          staffMembers={staffMembers} fetchStaffMembers={fetchStaffMembers}
        />
      );
      case 'staff-ids': return (
        <StaffIdsSection
          staffIds={staffIds} staffIdFilters={staffIdFilters}
          setStaffIdFilters={setStaffIdFilters} fetchStaffIds={fetchStaffIds}
        />
      );
      case 'transactions': return <TransactionsSection />;
      case 'loans': return (
        <LoansSection
          loans={loans}
          handleApproveLoan={handleApproveLoan}
          pagination={loanPagination}
          onPageChange={fetchLoans}
        />
      );
      case 'charges': return (
        <ServiceChargesSection
          newCharge={newCharge} setNewCharge={setNewCharge}
          serviceChargeCalculation={serviceChargeCalculation}
          setServiceChargeCalculation={setServiceChargeCalculation}
        />
      );
      case 'payslip': return (
        <PayslipSection
          formData={formData as never} setFormData={setFormData as never}
          handleGeneratePayslip={handleGeneratePayslip}
          staffMembers={staffMembers}
        />
      );
      case 'my_payslips': return <StaffPayslipViewer />;
      case 'cashflow': return cashFlow ? <CashFlowSection cashFlow={cashFlow} /> : null;
      case 'interest': return interestData ? <InterestSection interestData={interestData} /> : null;
      case 'commission': return commissionData ? <CommissionSection commissionData={commissionData} /> : null;
      case 'statements': return (
        <StatementsSection
          formData={formData} setFormData={setFormData}
          handleGenerateStatement={handleGenerateStatement}
        />
      );
      case 'expenses': return (
        <ExpensesSection
          newExpense={newExpense as never} setNewExpense={setNewExpense as never}
          expenses={expenses} fetchExpenses={fetchExpenses}
        />
      );
      case 'performance': return <PerformanceMonitoringSection />;
      case 'reports': return <ReportsSection />;
      case 'security': return <SecuritySection />;
      default: return null;
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
      {renderContent()}
    </DashboardLayout>
  );
}

export default ManagerDashboard;
