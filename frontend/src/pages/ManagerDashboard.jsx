import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';
import OverviewSection from '../components/OverviewSection';
import UserManagementSection from '../components/UserManagementSection';
import TransactionsSection from '../components/TransactionsSection';
import LoansSection from '../components/LoansSection';
import ServiceChargesSection from '../components/ServiceChargesSection';
import PayslipSection from '../components/PayslipSection';
import CashFlowSection from '../components/CashFlowSection';
import InterestSection from '../components/InterestSection';
import CommissionSection from '../components/CommissionSection';
import StatementsSection from '../components/StatementsSection';
import ExpensesSection from '../components/ExpensesSection';
import DashboardDropdown from '../components/DashboardDropdown';

function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
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
    name: '',
    description: '',
    charge_type: 'percentage',
    rate: '',
    applicable_to: []
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
    category: '',
    amount: '',
    description: '',
    date_incurred: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use operational metrics instead of manager_dashboard to avoid permission issues
        const response = await authService.getOperationalMetrics();
        if (response.success) {
          setDashboardData({
            branch_metrics: [
              {
                label: 'System Uptime',
                value: response.data.system_uptime,
                change: '+0.1%',
                trend: 'up',
                icon: ''
              },
              {
                label: 'Transactions Today',
                value: response.data.transactions_today?.toLocaleString() || '0',
                change: `+${response.data.transaction_change || 0}%`,
                trend: 'up',
                icon: ''
              },
              {
                label: 'API Response Time',
                value: `${response.data.api_response_time}ms`,
                change: '-5ms',
                trend: 'up',
                icon: ''
              },
              {
                label: 'Failed Transactions',
                value: response.data.failed_transactions?.toString() || '0',
                change: `+${response.data.failed_change || 0}`,
                trend: 'down',
                icon: ''
              }
            ],
            staff_performance: [], // Will be populated from other endpoints
            pending_approvals: [] // Will be populated from loans
          });
        } else {
          console.error('Failed to fetch dashboard data:', response.error);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchTransactions = async () => {
    const response = await authService.getAllTransactions();
    if (response.success) {
      setTransactions(Array.isArray(response.data) ? response.data : []);
    }
  };

  const fetchLoans = async () => {
    const response = await authService.getPendingLoans();
    if (response.success) {
      setLoans(response.data);
    }
  };

  const fetchCashFlow = async () => {
    const response = await authService.getCashFlow();
    if (response.success) {
      setCashFlow(response.data);
    }
  };

  const fetchInterest = async () => {
    const response = await authService.calculateInterest();
    if (response.success) {
      setInterestData(response.data);
    }
  };

  const fetchCommission = async () => {
    const response = await authService.calculateCommission();
    if (response.success) {
      setCommissionData(response.data);
    }
  };

  const fetchServiceCharges = async () => {
    const response = await authService.getServiceCharges();
    if (response.success) {
      setServiceCharges(response.data);
    }
  };

  const fetchStaffMembers = async () => {
    const response = await authService.getAllStaff();
    if (response.success) {
      setStaffMembers(response.data);
    }
  };

  const fetchExpenses = async () => {
    const response = await authService.getExpenses();
    if (response.success) {
      setExpenses(response.data);
    }
  };


  useEffect(() => {
    if (activeView === 'transactions') fetchTransactions();
    if (activeView === 'loans') fetchLoans();
    if (activeView === 'cashflow') fetchCashFlow();
    if (activeView === 'interest') fetchInterest();
    if (activeView === 'commission') fetchCommission();
    if (activeView === 'charges') fetchServiceCharges();
    if (activeView === 'users') fetchStaffMembers();
    if (activeView === 'expenses') fetchExpenses();
  }, [activeView]);

  const handleSendOTP = async () => {
    if (!formData.phone) {
      alert('Please enter a phone number first');
      return;
    }

    const response = await authService.sendOTP({
      phone_number: formData.phone,
      verification_type: 'user_creation'
    });

    if (response.success) {
      setOtpSent(true);
      setOtpExpiresIn(300); // 5 minutes
      
      // In test mode, display the OTP code
      if (response.data.test_mode && response.data.otp_code) {
        alert(`TEST MODE: OTP sent successfully!\n\nYour OTP code is: ${response.data.otp_code}\n\nThis code will expire in 5 minutes.\n\nIn production, this would be sent via SMS.`);
        console.log('TEST MODE - OTP Code:', response.data.otp_code);
      } else {
        alert('OTP sent to your phone number.');
      }

      // Start countdown timer
      const timer = setInterval(() => {
        setOtpExpiresIn(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setOtpSent(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      alert('Failed to send OTP: ' + response.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      alert('Please enter the OTP code');
      return;
    }

    const response = await authService.verifyOTP({
      phone_number: formData.phone,
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

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!phoneVerified) {
      alert('Please verify your phone number with OTP before creating the user.');
      return;
    }

    const response = await authService.createUser(formData);
    if (response.success) {
      const staffRoles = ['cashier', 'mobile_banker', 'manager', 'operations_manager'];
      if (staffRoles.includes(formData.role)) {
        alert(`User created successfully!\n\nStaff ID: ${response.data.staff_id}\nName: ${response.data.first_name} ${response.data.last_name}\nEmail: ${response.data.email}\nRole: ${response.data.role}`);
      } else {
        alert('User created successfully!');
      }
      setFormData({});
      setOtpCode('');
      setPhoneVerified(false);
      setOtpSent(false);
    } else {
      alert('Failed to create user: ' + response.error);
    }
  };

  const handleApproveLoan = async (loanId) => {
    const response = await authService.approveLoan(loanId);
    if (response.success) {
      alert('Loan approved successfully!');
      fetchLoans();
    } else {
      alert('Failed to approve loan: ' + response.error);
    }
  };

  const handleGeneratePayslip = async () => {
    const response = await authService.generatePayslip(formData);
    if (response.success) {
      alert('Payslip generated successfully!');
      console.log(response.data);
    } else {
      alert('Failed to generate payslip: ' + response.error);
    }
  };

  const handleGenerateStatement = async () => {
    const response = await authService.generateStatement(formData);
    if (response.success) {
      alert('Statement generated successfully!');
      console.log(response.data);
    } else {
      alert('Failed to generate statement: ' + response.error);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--md-sys-color-background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }} className="md-animate-scale-in">
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            borderRadius: 'var(--md-sys-shape-corner-extra-large)',
            background: 'var(--md-sys-color-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--md-sys-elevation-3)'
          }} className="animate-pulse">
            <span style={{ fontSize: '40px' }}></span>
          </div>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            border: '4px solid var(--md-sys-color-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <h2 className="md-typescale-headline-small" style={{
            color: 'var(--md-sys-color-on-surface)',
            marginBottom: '8px'
          }}>
            Loading Manager Dashboard
          </h2>
          <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  const branchMetrics = dashboardData?.branch_metrics || [
    { label: 'Total Deposits', value: formatCurrencyGHS(0), change: '0%', icon: '', trend: 'up' },
    { label: 'Loan Portfolio', value: formatCurrencyGHS(0), change: '0%', icon: '', trend: 'up' },
    { label: 'New Accounts', value: '0', change: '0%', icon: '', trend: 'up' },
    { label: 'Customer Satisfaction', value: '0%', change: '0%', icon: '⭐', trend: 'up' }
  ];

  const staffPerformance = dashboardData?.staff_performance || [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '16px',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(0, 102, 204, 0.03) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)`,
        pointerEvents: 'none'
      }} />
      {/* App Bar */}
      <header className="md-elevated-card md-animate-slide-in-down" style={{
        marginBottom: '24px',
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(0, 102, 204, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 102, 204, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(45deg, rgba(0, 102, 204, 0.02) 25%, transparent 25%),
                           linear-gradient(-45deg, rgba(0, 102, 204, 0.02) 25%, transparent 25%),
                           linear-gradient(45deg, transparent 75%, rgba(0, 102, 204, 0.02) 75%),
                           linear-gradient(-45deg, transparent 75%, rgba(0, 102, 204, 0.02) 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          opacity: 0.3
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 className="md-typescale-headline-medium" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '4px'
            }}>
              Manager Dashboard
            </h1>
            <p className="md-typescale-body-medium" style={{
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              Welcome, {user?.name} • Manage operations and oversight
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="md-chip" style={{
              background: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              border: 'none'
            }}>
               MANAGER
            </div>
            <button
              onClick={handleLogout}
              className="md-filled-button md-ripple"
              style={{
                background: 'var(--md-sys-color-error)',
                color: 'var(--md-sys-color-on-error)'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '4px',
          background: 'var(--md-sys-color-surface-container-highest)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          position: 'relative',
          zIndex: 1
        }}>
          {[
            { id: 'overview', name: 'Overview', icon: '' },
            { id: 'users', name: 'Users', icon: '' },
            { id: 'transactions', name: 'Transactions', icon: '' },
            { id: 'loans', name: 'Loans', icon: '' },
            { id: 'charges', name: 'Charges', icon: '' },
            { id: 'payslip', name: 'Payslip', icon: '' },
            { id: 'cashflow', name: 'Cash Flow', icon: '' },
            { id: 'interest', name: 'Interest', icon: '' },
            { id: 'commission', name: 'Commission', icon: '' },
            { id: 'statements', name: 'Statements', icon: '' },
            { id: 'expenses', name: 'Expenses', icon: '' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className="md-ripple"
              style={{
                padding: '10px 16px',
                background: activeView === view.id ? 'var(--md-sys-color-surface)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                color: activeView === view.id ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: activeView === view.id ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
                boxShadow: activeView === view.id ? 'var(--md-sys-elevation-1)' : 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>{view.icon}</span>
              <span className="md-typescale-label-large">{view.name}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <OverviewSection dashboardData={dashboardData} />
        )}

        {/* User Management Tab */}
        {activeView === 'users' && (
          <UserManagementSection
            formData={formData}
            setFormData={setFormData}
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            phoneVerified={phoneVerified}
            setPhoneVerified={setPhoneVerified}
            otpSent={otpSent}
            setOtpSent={setOtpSent}
            otpExpiresIn={otpExpiresIn}
            setOtpExpiresIn={setOtpExpiresIn}
            handleSendOTP={handleSendOTP}
            handleVerifyOTP={handleVerifyOTP}
            handleCreateUser={handleCreateUser}
            staffMembers={staffMembers}
            fetchStaffMembers={fetchStaffMembers}
          />
        )}


        {/* Transactions Tab */}
        {activeView === 'transactions' && (
          <TransactionsSection />
        )}

        {/* Loans Tab */}
        {activeView === 'loans' && (
          <LoansSection loans={loans} handleApproveLoan={handleApproveLoan} />
        )}

        {/* Service Charges Tab */}
        {activeView === 'charges' && (
          <ServiceChargesSection
            newCharge={newCharge}
            setNewCharge={setNewCharge}
            serviceChargeCalculation={serviceChargeCalculation}
            setServiceChargeCalculation={setServiceChargeCalculation}
            serviceCharges={serviceCharges}
            fetchServiceCharges={fetchServiceCharges}
          />
        )}

        {/* Payslip Tab */}
        {activeView === 'payslip' && (
          <PayslipSection
            formData={formData}
            setFormData={setFormData}
            handleGeneratePayslip={handleGeneratePayslip}
          />
        )}

        {/* Cash Flow Tab */}
        {activeView === 'cashflow' && cashFlow && (
          <CashFlowSection cashFlow={cashFlow} />
        )}

        {/* Interest Tab */}
        {activeView === 'interest' && interestData && (
          <InterestSection interestData={interestData} />
        )}

        {/* Commission Tab */}
        {activeView === 'commission' && commissionData && (
          <CommissionSection commissionData={commissionData} />
        )}

        {/* Statements Tab */}
        {activeView === 'statements' && (
          <StatementsSection
            formData={formData}
            setFormData={setFormData}
            handleGenerateStatement={handleGenerateStatement}
          />
        )}

        {/* Expenses Tab */}
        {activeView === 'expenses' && (
          <ExpensesSection
            newExpense={newExpense}
            setNewExpense={setNewExpense}
            expenses={expenses}
            fetchExpenses={fetchExpenses}
          />
        )}

      </div>
    </div>
  );
}

export default ManagerDashboard;