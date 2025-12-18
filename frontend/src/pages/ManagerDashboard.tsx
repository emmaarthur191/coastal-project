import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProductsServicesManagement from '../components/manager/ProductsServicesManagement';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout.tsx'; // Unified Layout
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

function ManagerDashboard() {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role);

  // --- MENU ITEMS CONFIG ---
  // Updated colors to match Unified Theme vaguely, but icons/IDs remain
  const menuItems = React.useMemo(() => [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'accounts', name: 'Accounts', icon: '🏦' },
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
    { id: 'security', name: 'Security', icon: '🛡️' }
  ], []);

  // --- STATE MANAGEMENT ---
  const [activeView, setActiveView] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);
  const [interestData, setInterestData] = useState(null);
  const [commissionData, setCommissionData] = useState(null);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({
    name: '', description: '', charge_type: 'percentage', rate: '', applicable_to: []
  });
  const [serviceChargeCalculation, setServiceChargeCalculation] = useState(null);
  // unused: const [interestCalculation, setInterestCalculation] = useState(null);
  // unused: const [commissionCalculation, setCommissionCalculation] = useState(null);
  // unused: const [showDropdown, setShowDropdown] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false); // Prevent double-clicks
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    category: '', amount: '', description: '', date_incurred: new Date().toISOString().split('T')[0]
  });
  const [staffIds, setStaffIds] = useState([]);
  const [staffIdFilters, setStaffIdFilters] = useState({});

  // --- EFFECTS ---
  useEffect(() => {
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
    fetchDashboardData();
  }, []);

  const fetchTransactions = async () => { const r = await authService.getAllTransactions(); if (r.success) setTransactions(Array.isArray(r.data) ? r.data : []); };
  const fetchLoans = async () => { const r = await authService.getPendingLoans(); if (r.success) setLoans(r.data); };
  const fetchCashFlow = async () => { const r = await authService.getCashFlow(); if (r.success) setCashFlow(r.data); };
  const fetchInterest = async () => { const r = await authService.calculateInterest({}); if (r.success) setInterestData(r.data); };
  const fetchCommission = async () => { const r = await authService.calculateCommission({}); if (r.success) setCommissionData(r.data); };
  const fetchServiceCharges = async () => { const r = await authService.getServiceCharges(); if (r.success) setServiceCharges(r.data); };
  const fetchStaffMembers = async () => { const r = await authService.getAllStaff(); if (r.success) setStaffMembers(r.data); };
  const fetchExpenses = async () => { const r = await authService.getExpenses(); if (r.success) setExpenses(r.data); };
  const fetchStaffIds = async () => { const r = await authService.getStaffIds(staffIdFilters); if (r.success) setStaffIds(r.data.results || r.data); };

  useEffect(() => {
    if (activeView === 'transactions') fetchTransactions();
    if (activeView === 'loans') fetchLoans();
    if (activeView === 'cashflow') fetchCashFlow();
    if (activeView === 'interest') fetchInterest();
    if (activeView === 'commission') fetchCommission();
    if (activeView === 'charges') fetchServiceCharges();
    if (activeView === 'users' || activeView === 'payslip') fetchStaffMembers();
    if (activeView === 'staff-ids') fetchStaffIds();
    if (activeView === 'expenses') fetchExpenses();
  }, [activeView, staffIdFilters]);

  // --- HANDLERS ---
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleSendOTP = async () => {
    // Prevent double-clicks
    if (otpLoading) {
      console.log('[OTP] Request already in progress, ignoring');
      return;
    }

    // Validate phone number exists and is not just whitespace
    const phoneNumber = formData.phone?.trim();
    if (!phoneNumber) {
      alert('Please enter a phone number first');
      return;
    }

    // Set loading state to prevent duplicate requests
    setOtpLoading(true);
    console.log('[OTP] Sending OTP to phone:', phoneNumber);

    try {
      const response = await authService.sendOTP({
        phone_number: phoneNumber,
        verification_type: 'user_creation'
      });

      console.log('[OTP] Response:', response);

      if (response.success) {
        setOtpSent(true);
        setOtpExpiresIn(300);
        if (response.data.test_mode && response.data.otp_code) {
          alert(`TEST MODE OTP: ${response.data.otp_code}`);
        } else {
          alert('OTP sent to your phone number.');
        }
        const timer = setInterval(() => {
          setOtpExpiresIn(prev => {
            if (prev <= 1) { clearInterval(timer); setOtpSent(false); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert('Failed to send OTP: ' + response.error);
      }
    } catch (error) {
      console.error('[OTP] Error:', error);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) { alert('Please enter the OTP code'); return; }
    const phoneNumber = formData.phone?.trim();
    const response = await authService.verifyOTP({
      phone_number: phoneNumber,
      otp_code: otpCode,
      verification_type: 'user_creation'
    });
    if (response.success) {
      setPhoneVerified(true);
      setOtpSent(false);
      alert('Phone number verified successfully!');
    } else {
      alert('Failed to verify OTP: ' + response.error);
    }
  };

  const handleCreateUser = async (e: any) => {
    e.preventDefault();
    if (!phoneVerified) { alert('Please verify your phone number with OTP before creating the user.'); return; }
    const response = await authService.createUser(formData);
    if (response.success) {
      alert(`User created! ID: ${response.data.staff_id || 'N/A'}`);
      setFormData({}); setOtpCode(''); setPhoneVerified(false); setOtpSent(false);
    } else { alert('Failed to create user: ' + response.error); }
  };

  const handleApproveLoan = async (loanId: any) => {
    const response = await authService.approveLoan(loanId);
    if (response.success) { alert('Loan approved successfully!'); fetchLoans(); }
    else { alert('Failed to approve loan: ' + response.error); }
  };

  const handleGeneratePayslip = async () => {
    const response = await authService.generatePayslip(formData);
    if (response.success) { alert('Payslip generated successfully!'); console.log(response.data); }
    else { alert('Failed to generate payslip: ' + response.error); }
  };

  const handleGenerateStatement = async () => {
    const response = await authService.generateStatement(formData);
    if (response.success) { alert('Statement generated successfully!'); console.log(response.data); }
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

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <OverviewSection dashboardData={dashboardData} />;
      case 'accounts': return <AccountsTab />;
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
          otpCode={otpCode} setOtpCode={setOtpCode}
          phoneVerified={phoneVerified} setPhoneVerified={setPhoneVerified}
          otpSent={otpSent} setOtpSent={setOtpSent}
          otpExpiresIn={otpExpiresIn} setOtpExpiresIn={setOtpExpiresIn}
          otpLoading={otpLoading}
          handleSendOTP={handleSendOTP} handleVerifyOTP={handleVerifyOTP}
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
      case 'loans': return <LoansSection loans={loans} handleApproveLoan={handleApproveLoan} />;
      case 'charges': return (
        <ServiceChargesSection
          newCharge={newCharge} setNewCharge={setNewCharge}
          serviceChargeCalculation={serviceChargeCalculation}
          setServiceChargeCalculation={setServiceChargeCalculation}
          serviceCharges={serviceCharges} fetchServiceCharges={fetchServiceCharges}
        />
      );
      case 'payslip': return (
        <PayslipSection
          formData={formData} setFormData={setFormData}
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
          newExpense={newExpense} setNewExpense={setNewExpense}
          expenses={expenses} fetchExpenses={fetchExpenses}
        />
      );
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
