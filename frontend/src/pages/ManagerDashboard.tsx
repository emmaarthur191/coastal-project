import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../components/manager/ManagerTheme';
import ManagerSidebar from '../components/manager/ManagerSidebar';
import DashboardHeader from '../components/manager/DashboardHeader';
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
import DashboardDropdown from '../components/manager/DashboardDropdown';
import AccountsTab from '../components/AccountsTab';

function ManagerDashboard() {
  console.log('ManagerDashboard: Component is rendering!');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Add visible debug message
  if (typeof document !== 'undefined') {
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position: fixed; top: 0; left: 0; background: red; color: white; padding: 10px; z-index: 9999; font-size: 16px;';
    debugDiv.textContent = 'MANAGER DASHBOARD IS RENDERING - User: ' + (user?.email || 'none') + ', Role: ' + (user?.role || 'none');
    document.body.appendChild(debugDiv);
  }

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role);

  // --- STATE MANAGEMENT (Original Logic) ---
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
  const [interestCalculation, setInterestCalculation] = useState(null);
  const [commissionCalculation, setCommissionCalculation] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    category: '', amount: '', description: '', date_incurred: new Date().toISOString().split('T')[0]
  });
  const [staffIds, setStaffIds] = useState([]);
  const [staffIdFilters, setStaffIdFilters] = useState({});

  // --- EFFECTS (Original Logic) ---
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
            staff_performance: [],
            pending_approvals: []
          });
        } else { console.error('Failed to fetch dashboard data:', response.error); }
      } catch (error) { console.error('Error fetching dashboard data:', error); } finally { setLoading(false); }
    };
    fetchDashboardData();
  }, []);

  const fetchTransactions = async () => { const r = await authService.getAllTransactions(); if (r.success) setTransactions(Array.isArray(r.data) ? r.data : []); };
  const fetchLoans = async () => { const r = await authService.getPendingLoans(); if (r.success) setLoans(r.data); };
  const fetchCashFlow = async () => { const r = await authService.getCashFlow(); if (r.success) setCashFlow(r.data); };
  const fetchInterest = async () => { const r = await authService.calculateInterest(); if (r.success) setInterestData(r.data); };
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
    if (activeView === 'users') fetchStaffMembers();
    if (activeView === 'staff-ids') fetchStaffIds();
    if (activeView === 'expenses') fetchExpenses();
  }, [activeView, staffIdFilters]);

  // --- HANDLERS (Original Logic) ---
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const handleSendOTP = async () => {
    if (!formData.phone) { alert('Please enter a phone number first'); return; }
    const response = await authService.sendOTP({ phone_number: formData.phone, verification_type: 'user_creation' });
    if (response.success) {
      setOtpSent(true); setOtpExpiresIn(300);
      if (response.data.test_mode && response.data.otp_code) { alert(`TEST MODE OTP: ${response.data.otp_code}`); }
      else { alert('OTP sent to your phone number.'); }
      const timer = setInterval(() => {
        setOtpExpiresIn(prev => { if (prev <= 1) { clearInterval(timer); setOtpSent(false); return 0; } return prev - 1; });
      }, 1000);
    } else { alert('Failed to send OTP: ' + response.error); }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) { alert('Please enter the OTP code'); return; }
    const response = await authService.verifyOTP({ phone_number: formData.phone, otp_code: otpCode, verification_type: 'user_creation' });
    if (response.success) { setPhoneVerified(true); setOtpSent(false); alert('Phone number verified successfully!'); }
    else { alert('Failed to verify OTP: ' + response.error); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!phoneVerified) { alert('Please verify your phone number with OTP before creating the user.'); return; }
    const response = await authService.createUser(formData);
    if (response.success) {
      alert(`User created! ID: ${response.data.staff_id || 'N/A'}`);
      setFormData({}); setOtpCode(''); setPhoneVerified(false); setOtpSent(false);
    } else { alert('Failed to create user: ' + response.error); }
  };

  const handleApproveLoan = async (loanId) => {
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
      <div style={{ minHeight: '100vh', background: THEME.colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: THEME.radius.card,
          border: '3px solid #000000',
          boxShadow: THEME.shadows.card,
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>🐘</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif" }}>Boss Mode Loading...</h2>
        </div>
        <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      </div>
    );
  }

  // --- MENU ITEMS CONFIG ---
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: '📊', color: THEME.colors.primary },
    { id: 'accounts', name: 'Accounts', icon: '🏦', color: THEME.colors.success },
    { id: 'messaging', name: 'Messaging', icon: '💬', color: THEME.colors.secondary },
    { id: 'users', name: 'Staff Users', icon: '👥', color: THEME.colors.warning },
    { id: 'staff-ids', name: 'Staff IDs', icon: '🆔', color: THEME.colors.info },
    { id: 'transactions', name: 'All Transacs', icon: '💸', color: THEME.colors.success },
    { id: 'loans', name: 'Loan Apps', icon: '📝', color: THEME.colors.danger },
    { id: 'charges', name: 'Charges', icon: '🏷️', color: THEME.colors.primary },
    { id: 'payslip', name: 'Payslips', icon: '🧧', color: THEME.colors.secondary },
    { id: 'cashflow', name: 'Cash Flow', icon: '🌊', color: THEME.colors.success },
    { id: 'interest', name: 'Interest', icon: '📈', color: THEME.colors.warning },
    { id: 'commission', name: 'Commission', icon: '🤝', color: THEME.colors.danger },
    { id: 'statements', name: 'Statements', icon: '📜', color: THEME.colors.primary },
    { id: 'expenses', name: 'Expenses', icon: '📉', color: THEME.colors.secondary }
  ];

  console.log('ManagerDashboard: menuItems created:', menuItems);

  // --- RENDER ---
  return (
    <div style={{ display: 'flex', height: '100vh', background: THEME.colors.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
          /* Custom Scrollbar */
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: #fff; }
          ::-webkit-scrollbar-thumb { background: ${THEME.colors.primary}; border-radius: 5px; }
        `}
      </style>

      <ManagerSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        handleLogout={handleLogout}
        user={user}
        menuItems={menuItems}
      />

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

        <DashboardHeader activeView={activeView} menuItems={menuItems} />

        {/* Dynamic Content Wrapper */}
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>

          {activeView === 'overview' && (
            <OverviewSection dashboardData={dashboardData} />
          )}

          {activeView === 'accounts' && (
            <>
              {console.log('ManagerDashboard: Rendering AccountsTab for activeView:', activeView)}
              <AccountsTab />
            </>
          )}

          {activeView === 'messaging' && (
            <MessagingSection onOpenMessaging={() => {
              if (!hasMessagingAccess) {
                alert('Access denied. Messaging is only for authorized staff.');
                return;
              }
              alert('Opening secure messaging system...');
              navigate('/messaging');
            }} />
          )}

          {activeView === 'users' && (
            <UserManagementSection
              formData={formData} setFormData={setFormData}
              otpCode={otpCode} setOtpCode={setOtpCode}
              phoneVerified={phoneVerified} setPhoneVerified={setPhoneVerified}
              otpSent={otpSent} setOtpSent={setOtpSent}
              otpExpiresIn={otpExpiresIn} setOtpExpiresIn={setOtpExpiresIn}
              handleSendOTP={handleSendOTP} handleVerifyOTP={handleVerifyOTP}
              handleCreateUser={handleCreateUser}
              staffMembers={staffMembers} fetchStaffMembers={fetchStaffMembers}
            />
          )}

          {activeView === 'staff-ids' && (
            <StaffIdsSection
              staffIds={staffIds}
              staffIdFilters={staffIdFilters}
              setStaffIdFilters={setStaffIdFilters}
              fetchStaffIds={fetchStaffIds}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsSection />
          )}

          {activeView === 'loans' && (
            <LoansSection loans={loans} handleApproveLoan={handleApproveLoan} />
          )}

          {activeView === 'charges' && (
            <ServiceChargesSection
              newCharge={newCharge} setNewCharge={setNewCharge}
              serviceChargeCalculation={serviceChargeCalculation}
              setServiceChargeCalculation={setServiceChargeCalculation}
              serviceCharges={serviceCharges} fetchServiceCharges={fetchServiceCharges}
            />
          )}

          {activeView === 'payslip' && (
            <PayslipSection
              formData={formData} setFormData={setFormData}
              handleGeneratePayslip={handleGeneratePayslip}
            />
          )}

          {activeView === 'cashflow' && cashFlow && (
            <CashFlowSection cashFlow={cashFlow} />
          )}

          {activeView === 'interest' && interestData && (
            <InterestSection interestData={interestData} />
          )}

          {activeView === 'commission' && commissionData && (
            <CommissionSection commissionData={commissionData} />
          )}

          {activeView === 'statements' && (
            <StatementsSection
              formData={formData} setFormData={setFormData}
              handleGenerateStatement={handleGenerateStatement}
            />
          )}

          {activeView === 'expenses' && (
            <ExpensesSection
              newExpense={newExpense} setNewExpense={setNewExpense}
              expenses={expenses} fetchExpenses={fetchExpenses}
            />
          )}

        </div>
      </main>
    </div>
  );
}

export default ManagerDashboard;