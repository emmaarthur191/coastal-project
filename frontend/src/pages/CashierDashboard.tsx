import React, { useState, useEffect, useCallback } from 'react';
// TransactionForm kept for potential future use
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { api, authService, PaginatedResponse, ServiceRequest, AuditData, HealthCheckData, PerformanceMetric, PerformanceDashboardData, ReportAnalytics } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import './CashierDashboard.css';
import { Transaction } from '../api/models/Transaction';
import { Product } from '../api/models/Product';
import { Report } from '../api/models/Report';
import { ReportTemplate } from '../api/models/ReportTemplate';
import { ReportSchedule } from '../api/models/ReportSchedule';
import { CashAdvance } from '../api/models/CashAdvance';
import { Refund } from '../api/models/Refund';
import { Complaint } from '../api/models/Complaint';
import { User } from '../api/models/User';
import { CashDrawer } from '../api/models/CashDrawer';
import { Promotion } from '../api/models/Promotion';
import { FraudAlert } from '../api/models/FraudAlert';
import { AxiosError } from 'axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
// Input and ModernStatCard available for future use

import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import AccountClosureTab from '../components/cashier/AccountClosureTab';
import ProductsPromotionsTab from '../components/cashier/ProductsPromotionsTab';
import CashDrawerTab from '../components/cashier/CashDrawerTab';
import SecurityMonitoringTab from '../components/cashier/SecurityMonitoringTab';
import MessagingTab from '../components/cashier/MessagingTab';
import TransactionSearchTab from '../components/cashier/TransactionSearchTab';
import OverviewTab from '../components/cashier/OverviewTab';
import DepositTab from '../components/cashier/DepositTab';
import WithdrawalTab from '../components/cashier/WithdrawalTab';
import CheckDepositTab from '../components/cashier/CheckDepositTab';


// --- HELPER COMPONENTS ---

// Error Boundary
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
interface ErrorBoundaryProps { children: React.ReactNode; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error('Dashboard Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-error-200 bg-error-50 text-center py-8">
          <h3 className="text-2xl font-bold text-error-700 mb-2">⚠️ Something went wrong</h3>
          <p className="text-error-600 mb-4">We encountered an unexpected error.</p>
          <Button onClick={() => this.setState({ hasError: false, error: null })} variant="danger">
            Try Again ↻
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// NOTE: Many state variables below are declared for planned features (cash drawer, account opening, etc.)
// They are intentionally kept for future implementation. Re-enable lint when features are complete.

const CashierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onboardingMode = (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'operations_manager') ? 'manager' : 'staff';
  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role || '');
  const isMounted = React.useRef(true);
  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [depositMemberId, setDepositMemberId] = useState('');
  const [withdrawalMemberId, setWithdrawalMemberId] = useState('');
  const [accountType, setAccountType] = useState('daily_susu');
  const [checkDepositAmount, setCheckDepositAmount] = useState('');
  const [checkDepositMemberId, setCheckDepositMemberId] = useState('');
  const [checkDepositAccountType, setCheckDepositAccountType] = useState('daily_susu');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [auditTimeRange, setAuditTimeRange] = useState(24);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceDashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<HealthCheckData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [globalSearch, setGlobalSearch] = useState('');

  // --- MENU ---
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'deposit', name: 'Deposit', icon: '💰' },
    { id: 'withdrawal', name: 'Withdraw', icon: '💸' },
    { id: 'check_deposit', name: 'Check Deposit', icon: '📄' },
    { id: 'cash_advances', name: 'Cash Advances', icon: '🏧' },
    { id: 'refunds', name: 'Refunds', icon: '↩️' },
    { id: 'complaints', name: 'Complaints', icon: '📢' },
    { id: 'fraud_alerts', name: 'Fraud Alerts', icon: '🚨' },
    { id: 'account_opening', name: 'New Account', icon: '👶' },
    { id: 'account_closure', name: 'Close Account', icon: '🔒' },
    { id: 'products_promotions', name: 'Products', icon: '🎁' },
    { id: 'service_requests', name: 'Services', icon: '🛎️' },
    { id: 'cash_drawer', name: 'Cash Drawer', icon: '🗄️' },
    { id: 'my_payslips', name: 'My Payslips', icon: '💰' },
    { id: 'security_monitoring', name: 'Security', icon: '🛡️' },
    { id: 'messaging', name: 'Messaging', icon: '💬' }
  ];

  // Compute daily summary from actual transactions
  const dailySummary = React.useMemo(() => {
    const txArray = Array.isArray(transactions) ? transactions : [];
    const todayTransactions = txArray.filter((tx: any) => {
      const txDate = new Date(tx.created_at);
      const today = new Date();
      return txDate.toDateString() === today.toDateString();
    });
    const totalAmount = todayTransactions.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
    return {
      transactions: todayTransactions.length,
      totalAmount: formatCurrencyGHS(totalAmount),
      cashOnHand: formatCurrencyGHS(currentDrawer ? (currentDrawer as any).current_balance || 0 : 0),
      pendingApprovals: 0 // Delegated to Hubs
    };
  }, [transactions, currentDrawer]);



  // --- API CALLS ---
  const fetchMembers = async () => { try { const r = await api.get<PaginatedResponse<User>>('users/members/'); setMembers(r.data.results || []); } catch (e) { console.error(e); } };
  const fetchTransactions = async () => { try { const r = await api.get<PaginatedResponse<Transaction>>('transactions/'); setTransactions(r.data.results || []); } catch (e) { console.error(e); } };
  const fetchAuditData = useCallback(async () => { try { const r = await api.get<AuditData>(`audit/dashboard/?hours=${auditTimeRange}`); setAuditData(r.data); } catch (e) { console.error(e); } }, [auditTimeRange]);
  const fetchFraudAlerts = async () => {
    setFraudLoading(true);
    try {
      const r = await authService.getFraudAlerts();
      if (r.success && r.data && isMounted.current) {
        setFraudAlerts(r.data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (isMounted.current) setFraudLoading(false);
    }
  };
  const fetchPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const d = await api.get<PerformanceDashboardData>('performance/dashboard-data/'); setPerformanceData(d.data);
      const h = await api.get<PaginatedResponse<HealthCheckData>>('performance/system-health/'); setSystemHealth(h.data.results || []);
      const m = await api.get<PaginatedResponse<PerformanceMetric>>('performance/metrics/'); setPerformanceMetrics(m.data.results || []);
    } catch (e) { console.error(e); } finally { setPerformanceLoading(false); }
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchMembers();
    fetchTransactions();
    fetchFraudAlerts();
    fetchAuditData();
    fetchPerformanceData();
  }, [auditTimeRange, selectedTimeRange, fetchAuditData]);

  // Keyboard Shortcuts (Preserved)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'd': event.preventDefault(); setActiveTab('deposit'); break;
          case 'w': event.preventDefault(); setActiveTab('withdrawal'); break;
          case 'c': event.preventDefault(); setActiveTab('check_deposit'); break;
          case 'o': event.preventDefault(); setActiveTab('overview'); break;
          case '/': event.preventDefault(); (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus(); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const announceToScreenReader = (msg: string) => {
    logger.log(msg);
  };

  // --- HANDLERS ---
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    announceToScreenReader(`Switched to ${tabs.find(t => t.id === tabId)?.name} `);
  };

  const handleTransactionSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    const memberId = type === 'Deposit' ? depositMemberId : withdrawalMemberId;
    const amount = type === 'Deposit' ? depositAmount : withdrawalAmount;

    if (!memberId || !amount || parseFloat(amount) <= 0) { showMessage('error', 'Invalid input'); return; }
    setLoading(true);
    try {
      await api.post('transactions/process/', { member_id: memberId, amount: parseFloat(amount), type, account_type: accountType });
      showMessage('success', `${type} Success!`);
      if (type === 'Deposit') { setDepositAmount(''); setDepositMemberId(''); } else { setWithdrawalAmount(''); setWithdrawalMemberId(''); }
      fetchTransactions();
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMsg = error.response?.data?.error || error.message || 'Transaction failed';
        showMessage('error', errorMsg);
      } else {
        showMessage('error', 'Transaction failed');
      }
    } finally { setLoading(false); }
  };

  const handleCheckDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkDepositMemberId || !checkDepositAmount || !frontImage) { showMessage('error', 'Missing fields'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('member_id', checkDepositMemberId);
      formData.append('amount', checkDepositAmount);
      formData.append('account_type', checkDepositAccountType);
      formData.append('front_image', frontImage);
      if (backImage) formData.append('back_image', backImage);
      const r = await api.post<{ transaction_id: string }>('check-deposits/process-check-deposit/', formData);
      showMessage('success', `Check Deposited! ID: ${r.data.transaction_id} `);
      setCheckDepositAmount(''); setCheckDepositMemberId(''); setFrontImage(null); setBackImage(null);
      fetchTransactions();
    } catch (error) {
      if (error instanceof AxiosError) {
        showMessage('error', error.response?.data?.error || 'Failed');
      } else {
        showMessage('error', 'Failed');
      }
    } finally { setLoading(false); }
  };

  // --- RENDER CONTENT ---
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            dailySummary={dailySummary}
            transactions={transactions}
          />
        );
      case 'deposit':
        return (
          <DepositTab
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            depositMemberId={depositMemberId}
            setDepositMemberId={setDepositMemberId}
            loading={loading}
            handleTransactionSubmit={handleTransactionSubmit}
          />
        );
      case 'withdrawal':
        return (
          <WithdrawalTab
            withdrawalAmount={withdrawalAmount}
            setWithdrawalAmount={setWithdrawalAmount}
            withdrawalMemberId={withdrawalMemberId}
            setWithdrawalMemberId={setWithdrawalMemberId}
            loading={loading}
            handleTransactionSubmit={handleTransactionSubmit}
          />
        );
      case 'check_deposit':
        return (
          <CheckDepositTab
            checkDepositAmount={checkDepositAmount}
            setCheckDepositAmount={setCheckDepositAmount}
            checkDepositMemberId={checkDepositMemberId}
            setCheckDepositMemberId={setCheckDepositMemberId}
            frontImage={frontImage}
            setFrontImage={setFrontImage}
            backImage={backImage}
            setBackImage={setBackImage}
            loading={loading}
            handleCheckDepositSubmit={handleCheckDepositSubmit}
          />
        );
      case 'complaints': return <ErrorBoundary><SupportHub mode="staff" initialTab="complaints" /></ErrorBoundary>;
      case 'fraud_alerts': return <Card><h2>Fraud Alerts handled in security module</h2></Card>;
      case 'cash_advances': return <ErrorBoundary><FinancialRequestsHub mode="staff" initialView="cash_advances" /></ErrorBoundary>;
      case 'transaction_search': return <TransactionSearchTab />;
      case 'account_opening': return <ErrorBoundary><OnboardingHub mode="staff" /></ErrorBoundary>;
      case 'account_closure': return <ErrorBoundary><AccountClosureTab /></ErrorBoundary>;
      case 'products_promotions': return <ErrorBoundary><ProductsPromotionsTab /></ErrorBoundary>;
      case 'service_requests': return <ErrorBoundary><SupportHub mode="staff" initialTab="service_requests" /></ErrorBoundary>;
      case 'cash_drawer': return <CashDrawerTab />;
      case 'security_monitoring': return <SecurityMonitoringTab />;
      case 'messaging': return <MessagingTab onOpenMessaging={() => hasMessagingAccess ? navigate('/messaging') : alert('Access Denied')} />;
      case 'refunds': return <ErrorBoundary><FinancialRequestsHub mode="staff" initialView="refunds" /></ErrorBoundary>;
      default: return <Card><h2>🚧 Under Construction</h2></Card>;
    }
  };

  return (
    <ErrorBoundary>
      <DashboardLayout
        title="Teller Portal"
        user={user}
        menuItems={tabs}
        activeView={activeTab}
        onNavigate={handleTabChange}
        onLogout={handleLogout}
      >
        <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-secondary-100">
          <h1 className="text-2xl font-bold text-secondary-900">{tabs.find(t => t.id === activeTab)?.name}</h1>
          <input
            placeholder="🔍 Search transactions..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="px-4 py-2 rounded-full border-2 border-secondary-200 focus:border-primary-500 focus:outline-none w-64"
          />
        </div>

        {/* Toast Notification */}
        {message.text && (
          <div className={`fixed top-24 right-8 px-6 py-4 rounded-xl shadow-xl z-50 text-white font-bold animate-bounce ${message.type === 'error' ? 'bg-error-500' : 'bg-success-500'
            } `}>
            {message.type === 'error' ? '🚫 ' : '✅ '} {message.text}
          </div>
        )}

        {renderActiveTabContent()}

        <datalist id="member-list">
          {members.map((m: User) => <option key={m.id} value={m.id.toString()}>{m.name} ({m.email})</option>)}
        </datalist>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

export default CashierDashboard;
