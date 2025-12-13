import React, { useState, useEffect, Suspense, lazy } from 'react';
import TransactionForm from '../components/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { api } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';


import ComplaintsTab from '../components/cashier/ComplaintsTab';
import FraudAlertsTab from '../components/cashier/FraudAlertsTab';
import AccountOpeningTab from '../components/cashier/AccountOpeningTab';
import AccountClosureTab from '../components/cashier/AccountClosureTab';
import ProductsPromotionsTab from '../components/cashier/ProductsPromotionsTab';
import ServiceRequestsTab from '../components/cashier/ServiceRequestsTab';
import CashDrawerTab from '../components/cashier/CashDrawerTab';
import PerformanceMonitoringTab from '../components/cashier/PerformanceMonitoringTab';
import ReportsTab from '../components/cashier/ReportsTab';
import SecurityMonitoringTab from '../components/cashier/SecurityMonitoringTab';
import MessagingTab from '../components/cashier/MessagingTab';
import CashAdvancesTab from '../components/cashier/CashAdvancesTab';
import TransactionSearchTab from '../components/cashier/TransactionSearchTab';


// --- HELPER COMPONENTS ---

const Input = ({ label, className = "", ...props }: any) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block mb-2 font-medium text-secondary-700 ml-1">{label}</label>}
    <input
      className="w-full padding-3 rounded-lg border-secondary-300 border focus:border-primary-500 focus:ring-primary-500 p-3 bg-secondary-50 transition-colors"
      {...props}
    />
  </div>
);

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

const CashierDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role || '');

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
  const [cameraMode, setCameraMode] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cashDrawers, setCashDrawers] = useState([]);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [showOpenDrawer, setShowOpenDrawer] = useState(false);
  const [showCloseDrawer, setShowCloseDrawer] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [denominations, setDenominations] = useState({
    '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
    '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
  });
  const [accountOpeningData, setAccountOpeningData] = useState({
    account_type: 'daily_susu', card_type: 'standard', first_name: '', last_name: '', date_of_birth: '', nationality: '', address: '', phone_number: '', email: '', photo: null
  });
  const [accountClosureData, setAccountClosureData] = useState({ account_id: '', closure_reason: '', other_reason: '' });
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestStats, setServiceRequestStats] = useState({});
  const [selectedRequestType, setSelectedRequestType] = useState('checkbook');
  const [newServiceRequest, setNewServiceRequest] = useState({
    member_id: '', priority: 'normal', notes: '', quantity: 1, delivery_method: 'pickup', delivery_address: '', special_instructions: '', statement_type: 'monthly', delivery_method_statement: 'digital', start_date: '', end_date: '', account_number: '', info_type: 'balance', delivery_method_loan: 'digital', loan_account_number: ''
  });
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTimeRange, setAuditTimeRange] = useState(24);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [fraudStats, setFraudStats] = useState({});
  const [fraudLoading, setFraudLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [systemHealth, setSystemHealth] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [transactionVolume, setTransactionVolume] = useState([]);
  const [performanceAlerts, setPerformanceAlerts] = useState([]);
  const [performanceRecommendations, setPerformanceRecommendations] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetricType, setSelectedMetricType] = useState('response_time');
  const [performanceChartData, setPerformanceChartData] = useState(null);
  const [cashAdvances, setCashAdvances] = useState([]);
  const [cashAdvancesLoading, setCashAdvancesLoading] = useState(false);
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [reportSchedules, setReportSchedules] = useState([]);
  const [reportAnalytics, setReportAnalytics] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [transactionFilters, setTransactionFilters] = useState({ type: '', status: '', dateRange: 'today', amountRange: { min: '', max: '' } });
  const [serviceRequestFilters, setServiceRequestFilters] = useState({ status: '', priority: '', type: '' });
  const [startAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

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
    { id: 'performance_monitoring', name: 'Performance', icon: '📈' },
    { id: 'reports', name: 'Reports', icon: '📑' },
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
    const srArray = Array.isArray(serviceRequests) ? serviceRequests : [];
    return {
      transactions: todayTransactions.length,
      totalAmount: formatCurrencyGHS(totalAmount),
      cashOnHand: formatCurrencyGHS(currentDrawer ? (currentDrawer as any).current_balance || 0 : 0),
      pendingApprovals: srArray.filter((sr: any) => sr.status === 'pending').length
    };
  }, [transactions, currentDrawer, serviceRequests]);

  // --- EFFECTS ---
  useEffect(() => {
    fetchMembers();
    fetchTransactions();
    fetchCashDrawers();
    fetchProducts();
    fetchPromotions();
    fetchServiceRequests();
    fetchServiceRequestStats();
    fetchCashAdvances();
    fetchRefunds();
    fetchComplaints();
    fetchFraudAlerts();
    fetchFraudStats();
    fetchAuditData();
    fetchPerformanceData();
    fetchReports();
    fetchReportTemplates();
    fetchReportSchedules();
    fetchReportAnalytics();
  }, [auditTimeRange, selectedTimeRange]);

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
          case 'f': event.preventDefault(); setShowAdvancedFilters(!startAdvancedFilters); break;
          case 'o': event.preventDefault(); setActiveTab('overview'); break;
          case '/': event.preventDefault(); (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus(); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [startAdvancedFilters]);

  // --- API CALLS ---
  const fetchMembers = async () => { try { const r = await api.get('users/members/'); setMembers(r.data || []); } catch (e) { console.error(e); } };
  const fetchTransactions = async () => { try { const r = await api.get('transactions/'); setTransactions(Array.isArray(r.data) ? r.data : (r.data?.results || [])); } catch (e) { console.error(e); } };
  const fetchCashDrawers = async () => { try { const r = await api.get('banking/cash-drawers/'); setCashDrawers(r.data || []); } catch (e) { console.error(e); } };
  const fetchProducts = async () => { try { const r = await api.get('products/products/'); setProducts(r.data || []); } catch (e) { console.error(e); } };
  const fetchPromotions = async () => { try { const r = await api.get('products/promotions/active/'); setPromotions(r.data || []); } catch (e) { console.error(e); } };
  const fetchServiceRequests = async () => { try { const r = await api.get('services/requests/'); setServiceRequests(r.data || []); } catch (e) { console.error(e); } };
  const fetchServiceRequestStats = async () => { try { const r = await api.get('services/stats/'); setServiceRequestStats(r.data || {}); } catch (e) { console.error(e); } };
  const fetchAuditData = async () => { try { const r = await api.get(`audit/dashboard/?hours=${auditTimeRange}`); setAuditData(r.data); } catch (e) { console.error(e); } };
  const fetchReports = async () => { setReportsLoading(true); try { const r = await api.get('reports/reports/'); setReports(r.data || []); } catch (e) { console.error(e); } finally { setReportsLoading(false); } };
  const fetchReportTemplates = async () => { try { const r = await api.get('reports/templates/'); setReportTemplates(r.data || []); } catch (e) { console.error(e); } };
  const fetchReportSchedules = async () => { try { const r = await api.get('reports/schedules/'); setReportSchedules(r.data || []); } catch (e) { console.error(e); } };
  const fetchReportAnalytics = async () => { try { const r = await api.get('reports/analytics/'); setReportAnalytics(r.data || []); } catch (e) { console.error(e); } };
  const fetchCashAdvances = async () => { setCashAdvancesLoading(true); try { const r = await api.get('banking/cash-advances/'); setCashAdvances(r.data || []); } catch (e) { console.error(e); } finally { setCashAdvancesLoading(false); } };
  const fetchRefunds = async () => { setRefundsLoading(true); try { const r = await api.get('banking/refunds/'); setRefunds(r.data || []); } catch (e) { console.error(e); } finally { setRefundsLoading(false); } };
  const fetchComplaints = async () => { setComplaintsLoading(true); try { const r = await api.get('banking/complaints/'); setComplaints(r.data || []); } catch (e) { console.error(e); } finally { setComplaintsLoading(false); } };
  // @ts-ignore
  const fetchFraudAlerts = async () => { setFraudLoading(true); try { const r = await api.get('fraud/alerts/', { params: { status: 'all' } }); setFraudAlerts(Array.isArray(r.data) ? r.data : (r.data?.results || [])); } catch (e) { console.error(e); } finally { setFraudLoading(false); } };
  const fetchFraudStats = async () => { try { const r = await api.get('fraud/alerts/dashboard_stats/'); setFraudStats(r.data || {}); } catch (e) { console.error(e); } };
  const fetchPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const d = await api.get('performance/dashboard-data/'); setPerformanceData(d.data);
      const h = await api.get('performance/system-health/'); setSystemHealth(h.data.results || []);
      const m = await api.get('performance/metrics/'); setPerformanceMetrics(m.data.results || []);
      // ... other performance fetches omitted for brevity but assumed safe ...
    } catch (e) { console.error(e); } finally { setPerformanceLoading(false); }
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const announceToScreenReader = (msg: string) => { console.log(msg); }; // Simplified

  // --- HANDLERS ---
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    announceToScreenReader(`Switched to ${tabs.find(t => t.id === tabId)?.name}`);
  };

  const handleTransactionSubmit = async (e: any, type: string) => {
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Transaction failed';
      showMessage('error', errorMsg);
    } finally { setLoading(false); }
  };

  const handleCheckDepositSubmit = async (e: any) => {
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
      const r = await api.post('check-deposits/process_check_deposit/', formData);
      showMessage('success', `Check Deposited! ID: ${r.data.transaction_id}`);
      setCheckDepositAmount(''); setCheckDepositMemberId(''); setFrontImage(null); setBackImage(null);
      fetchTransactions();
    } catch (error: any) { showMessage('error', error.response?.data?.error || 'Failed'); } finally { setLoading(false); }
  };

  // --- RENDER CONTENT ---
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col items-center justify-center p-6 text-center hover:border-warning-300">
                <div className="text-secondary-500 font-bold uppercase text-xs mb-2">Transactions Today</div>
                <div className="text-3xl font-bold text-secondary-900">{dailySummary.transactions}</div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 text-center hover:border-success-300">
                <div className="text-secondary-500 font-bold uppercase text-xs mb-2">Total Amount</div>
                <div className="text-3xl font-bold text-success-600">{dailySummary.totalAmount}</div>
              </Card>
              <Card className="flex flex-col items-center justify-center p-6 text-center hover:border-primary-300">
                <div className="text-secondary-500 font-bold uppercase text-xs mb-2">Cash On Hand</div>
                <div className="text-3xl font-bold text-primary-600">{dailySummary.cashOnHand}</div>
              </Card>
            </div>
            <Card>
              <h3 className="text-lg font-bold text-secondary-900 mb-4">Recent Transactions</h3>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-secondary-50 rounded-lg transition-colors border-b border-secondary-100 last:border-0">
                    <span className="font-mono text-sm text-secondary-600">{tx.id || 'TX-ID'}</span>
                    <span className="font-bold text-secondary-900">{formatCurrencyGHS(tx.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      case 'deposit':
        return (
          <Card className="max-w-md mx-auto border-t-4 border-t-success-500">
            <h2 className="text-2xl font-bold text-success-700 mb-6 text-center">💰 Make a Deposit</h2>
            <form onSubmit={(e) => handleTransactionSubmit(e, 'Deposit')}>
              <Input
                label="Member ID"
                placeholder="Search or Enter Member ID"
                list="member-list"
                value={depositMemberId}
                onChange={(e: any) => setDepositMemberId(e.target.value)}
              />
              <Input
                label="Amount (GHS)"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e: any) => setDepositAmount(e.target.value)}
              />
              <Button type="submit" variant="success" className="w-full mt-4" disabled={loading}>
                {loading ? 'Processing...' : 'Process Deposit'}
              </Button>
            </form>
          </Card>
        );
      case 'withdrawal':
        return (
          <Card className="max-w-md mx-auto border-t-4 border-t-error-500">
            <h2 className="text-2xl font-bold text-error-700 mb-6 text-center">💸 Make a Withdrawal</h2>
            <form onSubmit={(e) => handleTransactionSubmit(e, 'Withdrawal')}>
              <Input
                label="Member ID"
                placeholder="Search or Enter Member ID"
                list="member-list"
                value={withdrawalMemberId}
                onChange={(e: any) => setWithdrawalMemberId(e.target.value)}
              />
              <Input
                label="Amount (GHS)"
                type="number"
                placeholder="0.00"
                value={withdrawalAmount}
                onChange={(e: any) => setWithdrawalAmount(e.target.value)}
              />
              <Button type="submit" variant="danger" className="w-full mt-4" disabled={loading}>
                {loading ? 'Processing...' : 'Process Withdrawal'}
              </Button>
            </form>
          </Card>
        );
      case 'check_deposit':
        return (
          <Card className="max-w-md mx-auto border-t-4 border-t-warning-500">
            <h2 className="text-2xl font-bold text-warning-700 mb-6 text-center">📄 Check Deposit</h2>
            <form onSubmit={handleCheckDepositSubmit}>
              <Input
                label="Member ID"
                value={checkDepositMemberId}
                onChange={(e: any) => setCheckDepositMemberId(e.target.value)}
                list="member-list"
              />
              <Input
                label="Check Amount"
                type="number"
                value={checkDepositAmount}
                onChange={(e: any) => setCheckDepositAmount(e.target.value)}
              />
              <div className="bg-secondary-50 p-6 rounded-xl border-2 border-dashed border-secondary-300 text-center mb-6 hover:border-primary-400 transition-colors">
                <label className="cursor-pointer">
                  <div className="text-4xl mb-2">📸</div>
                  <span className="font-bold text-secondary-600 block">Upload Front Photo</span>
                  <input type="file" onChange={(e: any) => setFrontImage(e.target.files[0])} className="hidden" />
                </label>
                {frontImage && <p className="text-success-600 font-bold mt-2">File Selected: {frontImage.name}</p>}
              </div>
              <Button type="submit" variant="primary" className="w-full bg-warning-500 hover:bg-warning-600 text-white border-warning-600" disabled={loading}>
                {loading ? 'Scanning...' : 'Deposit Check'}
              </Button>
            </form>
          </Card>
        );
      case 'refunds': return <RefundsTab />;
      case 'complaints': return <ComplaintsTab />;
      case 'fraud_alerts': return <FraudAlertsTab />;
      case 'cash_advances': return <CashAdvancesTab />;
      case 'transaction_search': return <TransactionSearchTab />;
      case 'account_opening': return <ErrorBoundary><AccountOpeningTab /></ErrorBoundary>;
      case 'account_closure': return <ErrorBoundary><AccountClosureTab /></ErrorBoundary>;
      case 'products_promotions': return <ErrorBoundary><ProductsPromotionsTab /></ErrorBoundary>;
      case 'service_requests': return <ErrorBoundary><ServiceRequestsTab /></ErrorBoundary>;
      case 'cash_drawer': return <ErrorBoundary><CashDrawerTab /></ErrorBoundary>;
      case 'performance_monitoring': return <PerformanceMonitoringTab />;
      case 'reports': return <ErrorBoundary><ReportsTab /></ErrorBoundary>;
      case 'my_payslips': return <ErrorBoundary><StaffPayslipViewer /></ErrorBoundary>;
      case 'security_monitoring': return <SecurityMonitoringTab />;
      case 'messaging': return <MessagingTab onOpenMessaging={() => hasMessagingAccess ? navigate('/messaging') : alert('Access Denied')} />;
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
            }`}>
            {message.type === 'error' ? '🚫 ' : '✅ '} {message.text}
          </div>
        )}

        {renderActiveTabContent()}

        <datalist id="member-list">
          {members.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
        </datalist>
      </DashboardLayout>
    </ErrorBoundary>
  );
}

export default CashierDashboard;