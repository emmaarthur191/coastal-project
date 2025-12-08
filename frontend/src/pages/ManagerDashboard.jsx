import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
// Keep original imports
import DashboardHeader from '../components/DashboardHeader';
import OverviewSection from '../components/OverviewSection';
import UserManagementSection from '../components/UserManagementSection';
import TransactionsSection from '../components/TransactionsSection';
import LoansSection from '../components/LoansSection';
import LoanApprovalsSection from '../components/LoanApprovalsSection';
import ServiceChargesSection from '../components/ServiceChargesSection';
import PayslipSection from '../components/PayslipSection';
import CashFlowSection from '../components/CashFlowSection';
import InterestSection from '../components/InterestSection';
import CommissionSection from '../components/CommissionSection';
import StatementsSection from '../components/StatementsSection';
import ExpensesSection from '../components/ExpensesSection';
import DashboardDropdown from '../components/DashboardDropdown';
import ClientRegistrationTab from '../components/ClientRegistrationTab';
import AccountsTab from '../components/AccountsTab';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#FFF0F5', // Lavender Blush
    primary: '#6C5CE7', // Purple
    secondary: '#00CEC9', // Teal
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon
    warning: '#FDCB6E', // Mustard
    sidebar: '#FFFFFF',
    text: '#2D3436',
    border: '#dfe6e9',
  },
  shadows: {
    card: '0 8px 0px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.2)',
    active: '0 2px 0px rgba(0,0,0,0.2)',
  },
  radius: {
    card: '24px',
    button: '50px',
  }
};

// --- STYLED WRAPPERS ---
const PlayfulCard = ({ children, color = '#FFFFFF', style }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.card,
    border: '3px solid #000000',
    boxShadow: THEME.shadows.card,
    padding: '24px',
    marginBottom: '24px',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style }) => (
  <button
    onClick={onClick}
    style={{
      background: variant === 'danger' ? THEME.colors.danger : THEME.colors.primary,
      color: 'white',
      border: '3px solid #000000',
      padding: '12px 24px',
      borderRadius: THEME.radius.button,
      fontWeight: '900',
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'all 0.1s',
      ...style
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'translateY(4px)';
      e.currentTarget.style.boxShadow = THEME.shadows.active;
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = THEME.shadows.button;
    }}
  >
    {children}
  </button>
);

function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT (Original Logic) ---
  const [activeView, setActiveView] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
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
  const [staffIdFilters, setStaffIdFilters] = useState({
    name: '', department: '', employment_date_from: '', employment_date_to: '', id_prefix: ''
  });

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
  const fetchCommission = async () => { const r = await authService.getCommissionSummary(); if (r.success) setCommissionData(r.data); };
  const fetchServiceCharges = async () => { const r = await authService.getServiceCharges(); if (r.success) setServiceCharges(r.data); };
  const fetchStaffMembers = async () => { const r = await authService.getAllStaff(); if (r.success) setStaffMembers(r.data); };
  const fetchExpenses = async () => { const r = await authService.getExpenses(); if (r.success) setExpenses(r.data); };
  const fetchStaffIds = async () => { const r = await authService.getStaffIds(staffIdFilters); if (r.success) setStaffIds(r.data); };

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
        <PlayfulCard>
          <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>🐘</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif" }}>Boss Mode Loading...</h2>
        </PlayfulCard>
        <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      </div>
    );
  }

  // --- MENU ITEMS CONFIG ---
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: '📊', color: THEME.colors.primary },
    { id: 'accounts', name: 'Accounts', icon: '🏦', color: THEME.colors.success },
    { id: 'client-registration', name: 'Client Registration', icon: '👤', color: THEME.colors.success },
    { id: 'loan-approvals', name: 'Loan Approvals', icon: '✅', color: THEME.colors.success },
    { id: 'messaging', name: 'Messaging', icon: '💬', color: THEME.colors.secondary },
    { id: 'users', name: 'Staff Users', icon: '👥', color: THEME.colors.warning },
    { id: 'staff-ids', name: 'Staff IDs', icon: '🆔', color: THEME.colors.primary },
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

      {/* --- SIDEBAR (STICKER SHEET) --- */}
      <nav style={{
        width: '280px',
        background: '#fff',
        borderRight: '3px solid #000',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '40px', background: THEME.colors.warning, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>🦁</div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Boss Mode</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{user?.name}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                border: activeView === item.id ? `3px solid ${item.color}` : '3px solid transparent',
                background: activeView === item.id ? `${item.color}20` : 'transparent',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '800',
                color: activeView === item.id ? item.color : '#888',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <PlayfulButton variant="danger" onClick={handleLogout} style={{ width: '100%' }}>
            Log Out 👋
          </PlayfulButton>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.text, margin: 0 }}>
             {menuItems.find(i => i.id === activeView)?.icon} {menuItems.find(i => i.id === activeView)?.name}
          </h2>
          <div style={{ background: '#FFF', padding: '8px 16px', borderRadius: '20px', border: '2px solid #000', fontWeight: 'bold' }}>
            📅 {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Dynamic Content Wrapper */}
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          
          {activeView === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Custom Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {dashboardData?.branch_metrics?.map((metric, idx) => (
                  <PlayfulCard key={idx} color={idx % 2 === 0 ? '#dff9fb' : '#fff0f5'} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '30px' }}>{metric.icon}</div>
                    <div style={{ color: '#888', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>{metric.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: THEME.colors.text, margin: '5px 0' }}>{metric.value}</div>
                    <div style={{ color: metric.trend === 'up' ? THEME.colors.success : THEME.colors.danger, fontWeight: 'bold' }}>
                      {metric.change} {metric.trend === 'up' ? '↗' : '↘'}
                    </div>
                  </PlayfulCard>
                ))}
              </div>
              <PlayfulCard>
                 <OverviewSection dashboardData={dashboardData} />
              </PlayfulCard>
            </div>
          )}

          {activeView === 'accounts' && (
            <PlayfulCard color="#E8F5E9">
              <AccountsTab />
            </PlayfulCard>
          )}

          {activeView === 'client-registration' && (
            <PlayfulCard color="#FFF">
              <ClientRegistrationTab />
            </PlayfulCard>
          )}

          {activeView === 'messaging' && (
            <PlayfulCard color="#F0F8FF">
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: '80px', marginBottom: '16px' }}>💬</div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Secure Staff Messaging</h3>
                <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>Top Secret chats with your team! 🕵️</p>
                <PlayfulButton onClick={() => navigate('/messaging')}>
                  Open Chat Room 🚀
                </PlayfulButton>
              </div>
            </PlayfulCard>
          )}

          {activeView === 'users' && (
            <PlayfulCard color="#FFF">
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
            </PlayfulCard>
          )}

          {activeView === 'staff-ids' && (
            <PlayfulCard color="#E8F4FD">
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Staff ID Management</h3>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={staffIdFilters.name}
                    onChange={(e) => setStaffIdFilters({...staffIdFilters, name: e.target.value})}
                    style={{ padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                  />
                  <input
                    type="text"
                    placeholder="Department..."
                    value={staffIdFilters.department}
                    onChange={(e) => setStaffIdFilters({...staffIdFilters, department: e.target.value})}
                    style={{ padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                  />
                  <input
                    type="date"
                    placeholder="Employment from..."
                    value={staffIdFilters.employment_date_from}
                    onChange={(e) => setStaffIdFilters({...staffIdFilters, employment_date_from: e.target.value})}
                    style={{ padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                  />
                  <input
                    type="date"
                    placeholder="Employment to..."
                    value={staffIdFilters.employment_date_to}
                    onChange={(e) => setStaffIdFilters({...staffIdFilters, employment_date_to: e.target.value})}
                    style={{ padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                  />
                  <input
                    type="text"
                    placeholder="ID prefix..."
                    value={staffIdFilters.id_prefix}
                    onChange={(e) => setStaffIdFilters({...staffIdFilters, id_prefix: e.target.value})}
                    style={{ padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                  />
                </div>

                {/* Staff IDs Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ background: THEME.colors.primary, color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Staff ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Department</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Employment Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Contact</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffIds.map((staff, idx) => (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                          <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                            {staff.decrypted_staff_id || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {staff.first_name} {staff.last_name}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {staff.role}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {staff.employment_date ? new Date(staff.employment_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: staff.is_active ? THEME.colors.success : THEME.colors.danger,
                              color: 'white',
                              fontSize: '12px'
                            }}>
                              {staff.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {staff.phone || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                            {/* Placeholder for performance metrics */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>⭐</span>
                              <span>4.5/5</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {staffIds.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🆔</div>
                    <p>No staff IDs found matching your criteria.</p>
                  </div>
                )}

                {/* Export Options */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <PlayfulButton onClick={() => alert('Export to CSV - Coming Soon!')}>
                    📊 Export CSV
                  </PlayfulButton>
                  <PlayfulButton onClick={() => alert('Export to PDF - Coming Soon!')}>
                    📄 Export PDF
                  </PlayfulButton>
                  <PlayfulButton onClick={() => alert('Export to Excel - Coming Soon!')}>
                    📈 Export Excel
                  </PlayfulButton>
                </div>
              </div>
            </PlayfulCard>
          )}

          {activeView === 'transactions' && (
            <PlayfulCard color="#E0F2F1">
              <TransactionsSection />
            </PlayfulCard>
          )}

          {activeView === 'loan-approvals' && (
            <PlayfulCard color="#D1FAE5">
              <LoanApprovalsSection />
            </PlayfulCard>
          )}

          {activeView === 'loans' && (
            <PlayfulCard color="#FFEBEE">
              <LoansSection loans={loans} handleApproveLoan={handleApproveLoan} />
            </PlayfulCard>
          )}

          {activeView === 'charges' && (
            <PlayfulCard color="#F3E5F5">
              <ServiceChargesSection
                newCharge={newCharge} setNewCharge={setNewCharge}
                serviceChargeCalculation={serviceChargeCalculation}
                setServiceChargeCalculation={setServiceChargeCalculation}
                serviceCharges={serviceCharges} fetchServiceCharges={fetchServiceCharges}
              />
            </PlayfulCard>
          )}

          {activeView === 'payslip' && (
            <PlayfulCard color="#E8F5E9">
              <PayslipSection
                formData={formData} setFormData={setFormData}
                handleGeneratePayslip={handleGeneratePayslip}
              />
            </PlayfulCard>
          )}

          {/* Contextual Note: Cash Flow represents the movement of money in and out. 
            

[Image of cash flow cycle diagram]
 
          */}
          {activeView === 'cashflow' && cashFlow && (
            <PlayfulCard color="#E1F5FE">
              <CashFlowSection cashFlow={cashFlow} />
            </PlayfulCard>
          )}

          {activeView === 'interest' && interestData && (
            <PlayfulCard color="#FFF3E0">
              <InterestSection interestData={interestData} />
            </PlayfulCard>
          )}

          {activeView === 'commission' && commissionData && (
            <PlayfulCard color="#FBE9E7">
              <CommissionSection commissionData={commissionData} />
            </PlayfulCard>
          )}

          {activeView === 'statements' && (
            <PlayfulCard color="#ECEFF1">
              <StatementsSection
                formData={formData} setFormData={setFormData}
                handleGenerateStatement={handleGenerateStatement}
              />
            </PlayfulCard>
          )}

          {activeView === 'expenses' && (
            <PlayfulCard color="#F9FBE7">
              <ExpensesSection
                newExpense={newExpense} setNewExpense={setNewExpense}
                expenses={expenses} fetchExpenses={fetchExpenses}
              />
            </PlayfulCard>
          )}

        </div>
      </main>
    </div>
  );
}

export default ManagerDashboard;