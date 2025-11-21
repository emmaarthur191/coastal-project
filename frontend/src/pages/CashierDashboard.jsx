import React, { useState, useEffect, Suspense, lazy } from 'react';
import TransactionForm from '../components/TransactionForm';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { api } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

// Lazy load heavy components
const ChatSupportSection = lazy(() => import('../components/ChatSupportSection'));

// Skeleton Loading Component
const SkeletonLoader = React.memo(({ width = '100%', height = '20px', style = {} }) => (
  <div
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, var(--md-sys-color-surface-container-high) 25%, var(--md-sys-color-surface-container-low) 50%, var(--md-sys-color-surface-container-high) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: 'var(--md-sys-shape-corner-small)',
      ...style
    }}
  />
));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="md-filled-card" style={{
          padding: '24px',
          margin: '16px',
          background: 'var(--md-sys-color-error-container)',
          border: '1px solid var(--md-sys-color-error)'
        }}>
          <h3 className="md-typescale-title-large" style={{
            color: 'var(--md-sys-color-on-error-container)',
            marginBottom: '12px'
          }}>
            ⚠️ Something went wrong
          </h3>
          <p className="md-typescale-body-medium" style={{
            color: 'var(--md-sys-color-on-error-container)',
            marginBottom: '16px'
          }}>
            We encountered an error while loading this section. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="md-filled-button md-ripple"
            style={{
              background: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [depositMemberId, setDepositMemberId] = useState('');
  const [withdrawalMemberId, setWithdrawalMemberId] = useState('');
  const [accountType, setAccountType] = useState('Savings');

  // Check deposit states
  const [checkDepositAmount, setCheckDepositAmount] = useState('');
  const [checkDepositMemberId, setCheckDepositMemberId] = useState('');
  const [checkDepositAccountType, setCheckDepositAccountType] = useState('Savings');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cash drawer states
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

  // Account opening states
  const [accountOpeningData, setAccountOpeningData] = useState({
    account_type: 'savings',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    phone_number: '',
    email: ''
  });

  // Account closure states
  const [accountClosureData, setAccountClosureData] = useState({
    account_id: '',
    closure_reason: '',
    other_reason: ''
  });

  // Products and promotions states
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Service requests states
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestStats, setServiceRequestStats] = useState({});
  const [selectedRequestType, setSelectedRequestType] = useState('checkbook');
  const [newServiceRequest, setNewServiceRequest] = useState({
    member_id: '',
    priority: 'normal',
    notes: '',
    // Checkbook specific
    quantity: 1,
    delivery_method: 'pickup',
    delivery_address: '',
    special_instructions: '',
    // Statement specific
    statement_type: 'monthly',
    delivery_method_statement: 'digital',
    start_date: '',
    end_date: '',
    account_number: '',
    // Loan info specific
    info_type: 'balance',
    delivery_method_loan: 'digital',
    loan_account_number: ''
  });
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false);

  // Security monitoring states
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedAuditView, setSelectedAuditView] = useState('dashboard');
  const [auditTimeRange, setAuditTimeRange] = useState(24);

  // Fraud alerts states
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [fraudStats, setFraudStats] = useState({});
  const [fraudLoading, setFraudLoading] = useState(false);
  const [selectedFraudAlert, setSelectedFraudAlert] = useState(null);
  const [fraudResolutionNotes, setFraudResolutionNotes] = useState('');
  const [fraudActionTaken, setFraudActionTaken] = useState('');

  // Performance monitoring states
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

  // Cash Advances states
  const [cashAdvances, setCashAdvances] = useState([]);
  const [cashAdvancesLoading, setCashAdvancesLoading] = useState(false);
  const [selectedCashAdvance, setSelectedCashAdvance] = useState(null);
  const [cashAdvanceForm, setCashAdvanceForm] = useState({
    account_id: '',
    amount: '',
    purpose: '',
    priority: 'medium'
  });
  const [showCashAdvanceForm, setShowCashAdvanceForm] = useState(false);

  // Refunds states
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundForm, setRefundForm] = useState({
    original_transaction_id: '',
    refund_type: 'full',
    requested_amount: '',
    reason: ''
  });
  const [showRefundForm, setShowRefundForm] = useState(false);

  // Complaints states
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintForm, setComplaintForm] = useState({
    account_id: '',
    related_transaction_id: '',
    complaint_type: 'service',
    priority: 'medium',
    subject: '',
    description: ''
  });
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  // Reports states
  const [reports, setReports] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [reportSchedules, setReportSchedules] = useState([]);
  const [reportAnalytics, setReportAnalytics] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReportTemplate, setSelectedReportTemplate] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportFilters, setReportFilters] = useState({});
  const [showGenerateReport, setShowGenerateReport] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportViewMode, setReportViewMode] = useState('list'); // 'list', 'view', 'analytics'

  // Search and filtering states
  const [globalSearch, setGlobalSearch] = useState('');
  const [transactionFilters, setTransactionFilters] = useState({
    type: '',
    status: '',
    dateRange: 'today',
    amountRange: { min: '', max: '' }
  });
  const [serviceRequestFilters, setServiceRequestFilters] = useState({
    status: '',
    priority: '',
    type: ''
  });
  const [fraudAlertFilters, setFraudAlertFilters] = useState({
    severity: '',
    status: '',
    type: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊', color: 'var(--md-sys-color-primary)' },
    { id: 'deposit', name: 'Deposit', icon: '', color: 'var(--md-sys-color-secondary)' },
    { id: 'withdrawal', name: 'Withdrawal', icon: '', color: 'var(--md-sys-color-error)' },
    { id: 'check_deposit', name: 'Check Deposit', icon: '📄', color: 'var(--md-sys-color-tertiary)' },
    { id: 'cash_advances', name: 'Cash Advances', icon: '💸', color: 'var(--md-sys-color-primary)' },
    { id: 'refunds', name: 'Refunds', icon: '↩️', color: 'var(--md-sys-color-secondary)' },
    { id: 'complaints', name: 'Complaints', icon: '📢', color: 'var(--md-sys-color-tertiary)' },
    { id: 'fraud_alerts', name: 'Fraud Alerts', icon: '🚨', color: 'var(--md-sys-color-error)' },
    { id: 'account_opening', name: 'Account Opening', icon: '📝', color: 'var(--md-sys-color-primary)' },
    { id: 'account_closure', name: 'Account Closure', icon: '🔒', color: 'var(--md-sys-color-error)' },
    { id: 'products_promotions', name: 'Products & Promotions', icon: '🛍️', color: 'var(--md-sys-color-tertiary)' },
    { id: 'service_requests', name: 'Service Requests', icon: '📋', color: 'var(--md-sys-color-primary)' },
    { id: 'cash_drawer', name: 'Cash Drawer', icon: '💰', color: 'var(--md-sys-color-secondary)' },
    { id: 'performance_monitoring', name: 'Performance Monitoring', icon: '📈', color: 'var(--md-sys-color-tertiary)' },
    { id: 'reports', name: 'Reports', icon: '📊', color: 'var(--md-sys-color-tertiary)' },
    { id: 'security_monitoring', name: 'Security Monitoring', icon: '🔒', color: 'var(--md-sys-color-error)' },
    { id: 'chat_support', name: 'Chat Support', icon: '💬', color: 'var(--md-sys-color-primary)' }
  ];

  const dailySummary = {
    transactions: 45,
    totalAmount: formatCurrencyGHS(125670),
    cashOnHand: formatCurrencyGHS(5000),
    pendingApprovals: 3
  };

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'SELECT') {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            setActiveTab('deposit');
            break;
          case 'w':
            event.preventDefault();
            setActiveTab('withdrawal');
            break;
          case 'c':
            event.preventDefault();
            setActiveTab('check_deposit');
            break;
          case 'f':
            event.preventDefault();
            setShowAdvancedFilters(!showAdvancedFilters);
            break;
          case 'o':
            event.preventDefault();
            setActiveTab('overview');
            break;
          case '/':
            event.preventDefault();
            document.querySelector('input[placeholder*="Search"]').focus();
            break;
          default:
            break;
        }
      }

      // Number keys for direct tab navigation
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const tabIndex = parseInt(event.key) - 1;
        if (tabIndex >= 0 && tabIndex < tabs.length) {
          event.preventDefault();
          setActiveTab(tabs[tabIndex].id);
        }
      }

      // Escape key to close modals/filters
      if (event.key === 'Escape') {
        if (showAdvancedFilters) {
          setShowAdvancedFilters(false);
        } else if (showOpenDrawer) {
          setShowOpenDrawer(false);
        } else if (showCloseDrawer) {
          setShowCloseDrawer(false);
        } else if (showReconcile) {
          setShowReconcile(false);
        } else if (showGenerateReport) {
          setShowGenerateReport(false);
        } else if (showCreateSchedule) {
          setShowCreateSchedule(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAdvancedFilters, showOpenDrawer, showCloseDrawer, showReconcile, showGenerateReport, showCreateSchedule, tabs]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('users/members/');
      setMembers(response.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([
        { id: '1', name: 'Kwame Asare', email: 'kwame@example.com' },
        { id: '2', name: 'Abena Mensah', email: 'abena@example.com' },
        { id: '3', name: 'Kofi Appiah', email: 'kofi@example.com' },
        { id: '4', name: 'Ama Osei', email: 'ama@example.com' }
      ]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('transactions/');
      const data = response.data;
      console.log('Full transactions response:', data);
      console.log('Response keys:', Object.keys(data));

      // Check common patterns for array data in objects
      if (data && typeof data === 'object') {
        console.log('data.results:', data.results);
        console.log('data.transactions:', data.transactions);
        console.log('data.data:', data.data);
        console.log('data.items:', data.items);
      }

      let transactionsArray = [];

      // Handle different possible response structures
      if (Array.isArray(data)) {
        // Case 1: Direct array response
        transactionsArray = data;
      } else if (data && typeof data === 'object') {
        // Case 2: Object with nested array
        if (Array.isArray(data.results)) {
          // Django REST framework pagination style
          transactionsArray = data.results;
          console.log('Using paginated results:', transactionsArray.length, 'transactions');
        } else if (Array.isArray(data.transactions)) {
          // Custom transactions key
          transactionsArray = data.transactions;
          console.log('Using transactions array:', transactionsArray.length, 'transactions');
        } else if (Array.isArray(data.data)) {
          // Common data key
          transactionsArray = data.data;
          console.log('Using data array:', transactionsArray.length, 'transactions');
        } else if (Array.isArray(data.items)) {
          // Another common pattern
          transactionsArray = data.items;
          console.log('Using items array:', transactionsArray.length, 'transactions');
        } else {
          // If no array found, check if we can use object values
          const values = Object.values(data);
          if (values.length > 0 && Array.isArray(values[0])) {
            transactionsArray = values[0];
            console.log('Using first array value:', transactionsArray.length, 'transactions');
          } else {
            console.warn('No array found in response object. Available keys:', Object.keys(data));
            transactionsArray = [];
          }
        }
      } else {
        console.warn('Unexpected response type:', typeof data);
        transactionsArray = [];
      }

      console.log('Final transactions array:', transactionsArray);
      setTransactions(transactionsArray);

    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const fetchCashDrawers = async () => {
    try {
      const response = await api.get('banking/cash-drawers/');
      setCashDrawers(response.data || []);
      // Set current drawer to the first open one or most recent
      const openDrawer = response.data?.find(drawer => drawer.status === 'open');
      if (openDrawer) {
        setCurrentDrawer(openDrawer);
      } else if (response.data?.length > 0) {
        setCurrentDrawer(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching cash drawers:', error);
      setCashDrawers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('products/products/');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await api.get('products/promotions/active/');
      setPromotions(response.data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setPromotions([]);
    }
  };

  const fetchRecommendations = async (customerId) => {
    if (!customerId) return;
    try {
      const response = await api.post('products/recommendations/generate/', {
        customer_id: customerId
      });
      setRecommendations(response.data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const response = await api.get('services/requests/');
      setServiceRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      setServiceRequests([]);
    }
  };

  const fetchServiceRequestStats = async () => {
    try {
      const response = await api.get('services/stats/');
      setServiceRequestStats(response.data || {});
    } catch (error) {
      console.error('Error fetching service request stats:', error);
      setServiceRequestStats({});
    }
  };

  const fetchAuditData = async () => {
    if (user?.role !== 'cashier' && user?.role !== 'manager' && user?.role !== 'operations_manager' && user?.role !== 'administrator') {
      return; // Only authorized roles can access audit data
    }

    setAuditLoading(true);
    try {
      const response = await api.get(`audit/dashboard/?hours=${auditTimeRange}`);
      setAuditData(response.data);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      setAuditData(null);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const response = await api.get('reports/reports/');
      setReports(response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchReportTemplates = async () => {
    try {
      const response = await api.get('reports/templates/');
      setReportTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching report templates:', error);
      setReportTemplates([]);
    }
  };

  const fetchReportSchedules = async () => {
    try {
      const response = await api.get('reports/schedules/');
      setReportSchedules(response.data || []);
    } catch (error) {
      console.error('Error fetching report schedules:', error);
      setReportSchedules([]);
    }
  };

  const fetchReportAnalytics = async () => {
    try {
      const response = await api.get('reports/analytics/');
      setReportAnalytics(response.data || []);
    } catch (error) {
      console.error('Error fetching report analytics:', error);
      setReportAnalytics([]);
    }
  };

  const fetchCashAdvances = async () => {
    setCashAdvancesLoading(true);
    try {
      const response = await api.get('banking/cash-advances/');
      setCashAdvances(response.data || []);
    } catch (error) {
      console.error('Error fetching cash advances:', error);
      setCashAdvances([]);
    } finally {
      setCashAdvancesLoading(false);
    }
  };

  const fetchRefunds = async () => {
    setRefundsLoading(true);
    try {
      const response = await api.get('banking/refunds/');
      setRefunds(response.data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      setRefunds([]);
    } finally {
      setRefundsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setComplaintsLoading(true);
    try {
      const response = await api.get('banking/complaints/');
      setComplaints(response.data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      // Fetch dashboard data
      const dashboardResponse = await api.get('performance/dashboard-data/');
      setPerformanceData(dashboardResponse.data);

      // Fetch system health
      const healthResponse = await api.get('performance/system-health/');
      setSystemHealth(healthResponse.data.results || healthResponse.data || []);

      // Fetch performance metrics
      const metricsResponse = await api.get('performance/metrics/');
      setPerformanceMetrics(metricsResponse.data.results || metricsResponse.data || []);

      // Fetch transaction volume
      const volumeResponse = await api.get(`performance/transaction-volume/?time_range=${selectedTimeRange}`);
      setTransactionVolume(volumeResponse.data || []);

      // Fetch performance alerts
      const alertsResponse = await api.get('performance/alerts/');
      setPerformanceAlerts(alertsResponse.data.results || alertsResponse.data || []);

      // Fetch performance recommendations
      const recommendationsResponse = await api.get('performance/recommendations/');
      setPerformanceRecommendations(recommendationsResponse.data.results || recommendationsResponse.data || []);

      // Fetch chart data
      const chartResponse = await api.get(`performance/chart-data/?metric_type=${selectedMetricType}&time_range=${selectedTimeRange}`);
      setPerformanceChartData(chartResponse.data);

    } catch (error) {
      console.error('Error fetching performance data:', error);
      // Set default empty data
      setPerformanceData(null);
      setSystemHealth([]);
      setPerformanceMetrics([]);
      setTransactionVolume([]);
      setPerformanceAlerts([]);
      setPerformanceRecommendations([]);
      setPerformanceChartData(null);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchFraudAlerts = async () => {
    setFraudLoading(true);
    try {
      const response = await api.get('/api/fraud/alerts/', {
        params: { status: 'all' }
      });
      setFraudAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching fraud alerts:', error);
      setFraudAlerts([]);
    } finally {
      setFraudLoading(false);
    }
  };

  const fetchFraudStats = async () => {
    try {
      const response = await api.get('/api/fraud/alerts/dashboard_stats/');
      setFraudStats(response.data || {});
    } catch (error) {
      console.error('Error fetching fraud stats:', error);
      setFraudStats({});
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Accessibility helpers
  const announceToScreenReader = (message) => {
    setAnnouncements(prev => [...prev, { id: Date.now(), message }]);
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== Date.now()));
    }, 1000);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    announceToScreenReader(`Switched to ${tab?.name} tab`);
  };

  const handleTransactionSubmit = async (e, type) => {
    e.preventDefault();
    
    const memberId = type === 'Deposit' ? depositMemberId : withdrawalMemberId;
    const amount = type === 'Deposit' ? depositAmount : withdrawalAmount;

    if (!memberId) {
      showMessage('error', 'Please select a member');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showMessage('error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('transactions/process/', {
        member_id: memberId,
        amount: parseFloat(amount),
        type: type,
        account_type: accountType
      });

      showMessage('success', `${type} of ${formatCurrencyGHS(amount)} for ${members.find(m => m.id === memberId)?.name} to ${accountType} account processed successfully! Receipt ID: ${response.data.receipt_id}`);

      // Log security event for transaction
      try {
        await api.post('audit/security-events/', {
          event_type: 'transaction_processed',
          description: `${type} transaction completed`,
          details: {
            transaction_type: type.toLowerCase(),
            amount: parseFloat(amount),
            member_id: memberId,
            account_type: accountType,
            receipt_id: response.data.receipt_id
          }
        });
      } catch (auditError) {
        console.warn('Failed to log audit event:', auditError);
      }

      if (type === 'Deposit') {
        setDepositAmount('');
        setDepositMemberId('');
      } else {
        setWithdrawalAmount('');
        setWithdrawalMemberId('');
      }

      await fetchTransactions();
      await fetchAuditData(); // Refresh audit data
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || `${type} failed`;
      showMessage('error', `Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDepositSubmit = async (e) => {
    e.preventDefault();

    if (!checkDepositMemberId || !checkDepositAmount || !frontImage) {
      showMessage('error', 'Please fill in all required fields and upload the front image of the check');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('member_id', checkDepositMemberId);
      formData.append('amount', checkDepositAmount);
      formData.append('account_type', checkDepositAccountType);
      formData.append('front_image', frontImage);
      if (backImage) {
        formData.append('back_image', backImage);
      }

      const response = await api.post('check-deposits/process_check_deposit/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showMessage('success', `Check deposit processed successfully! Transaction ID: ${response.data.transaction_id}`);

      // Reset form
      setCheckDepositAmount('');
      setCheckDepositMemberId('');
      setFrontImage(null);
      setBackImage(null);

      await fetchTransactions();

    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Check deposit failed';
      showMessage('error', `Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProductEnrollment = async () => {
    if (!selectedCustomer || !selectedProduct) {
      showMessage('error', 'Please select a customer and product');
      return;
    }

    setEnrollmentLoading(true);
    try {
      const response = await api.post('products/enroll/', {
        product_id: selectedProduct,
        customer_id: selectedCustomer,
        applied_promotion_id: selectedPromotion || null
      });

      showMessage('success', response.data.message || 'Product enrollment successful!');
      setSelectedCustomer('');
      setSelectedProduct('');
      setSelectedPromotion('');
      setRecommendations([]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Enrollment failed';
      showMessage('error', `Error: ${errorMessage}`);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <ErrorBoundary>
      <div style={{
        minHeight: '100vh',
        background: 'var(--md-sys-color-background)',
        padding: '16px'
      }}>
      {/* App Bar */}
      <header className="md-elevated-card md-animate-slide-in-down" style={{
        marginBottom: '24px',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 className="md-typescale-headline-medium" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '4px'
            }}>
              Teller Operations
            </h1>
            <p className="md-typescale-body-medium" style={{
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              Welcome, {user?.name} • Process transactions efficiently
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="md-chip" style={{
              background: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
              border: 'none'
            }}>
               CASHIER
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

        {/* Daily Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px' 
        }}>
          {[
            { label: 'Transactions Today', value: dailySummary.transactions, icon: '', color: 'primary' },
            { label: 'Total Amount', value: dailySummary.totalAmount, icon: '', color: 'secondary' },
            { label: 'Cash on Hand', value: dailySummary.cashOnHand, icon: '', color: 'tertiary' },
            { label: 'Pending Approvals', value: dailySummary.pendingApprovals, icon: '⏳', color: 'error' }
          ].map((stat, index) => (
            <div key={index} className="md-filled-card" style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                background: `var(--md-sys-color-${stat.color}-container)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                {stat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="md-typescale-title-medium" style={{ 
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '2px'
                }}>
                  {stat.value}
                </div>
                <div className="md-typescale-body-small" style={{ 
                  color: 'var(--md-sys-color-on-surface-variant)'
                }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Search and Filters */}
        <div style={{ marginTop: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Global Search */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search transactions, members, alerts..."
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '16px'
                  }}
                  aria-label="Global search"
                />
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '20px'
                }}>🔍</span>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="md-outlined-button md-ripple"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px'
              }}
              aria-expanded={showAdvancedFilters}
              aria-controls="advanced-filters"
            >
              <span style={{ fontSize: '18px' }}>⚙️</span>
              Filters
              <span style={{
                fontSize: '14px',
                transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>▼</span>
            </button>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleTabChange('deposit')}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  padding: '12px 16px',
                  fontSize: '14px'
                }}
                title="Quick deposit (Ctrl+D)"
                aria-label="Create new deposit transaction"
              >
                + Deposit
              </button>
              <button
                onClick={() => handleTabChange('withdrawal')}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-secondary)',
                  color: 'var(--md-sys-color-on-secondary)',
                  padding: '12px 16px',
                  fontSize: '14px'
                }}
                title="Quick withdrawal (Ctrl+W)"
                aria-label="Create new withdrawal transaction"
              >
                - Withdrawal
              </button>
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="md-outlined-button md-ripple"
                style={{
                  padding: '12px 16px',
                  fontSize: '14px'
                }}
                title="Keyboard shortcuts help"
                aria-label="Show keyboard shortcuts"
              >
                ⌨️ Help
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div
              id="advanced-filters"
              className="md-filled-card md-animate-slide-in-down"
              style={{
                marginTop: '16px',
                padding: '20px',
                background: 'var(--md-sys-color-surface-container-low)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {/* Transaction Filters */}
                <div>
                  <h4 className="md-typescale-title-small" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '12px'
                  }}>
                    Transaction Filters
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select
                      value={transactionFilters.type}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="">All Types</option>
                      <option value="deposit">Deposits</option>
                      <option value="withdrawal">Withdrawals</option>
                      <option value="transfer">Transfers</option>
                    </select>

                    <select
                      value={transactionFilters.status}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>

                    <select
                      value={transactionFilters.dateRange}
                      onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>

                {/* Service Request Filters */}
                <div>
                  <h4 className="md-typescale-title-small" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '12px'
                  }}>
                    Service Request Filters
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select
                      value={serviceRequestFilters.status}
                      onChange={(e) => setServiceRequestFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <select
                      value={serviceRequestFilters.priority}
                      onChange={(e) => setServiceRequestFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Fraud Alert Filters */}
                <div>
                  <h4 className="md-typescale-title-small" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '12px'
                  }}>
                    Fraud Alert Filters
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select
                      value={fraudAlertFilters.severity}
                      onChange={(e) => setFraudAlertFilters(prev => ({ ...prev, severity: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="">All Severities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>

                    <select
                      value={fraudAlertFilters.status}
                      onChange={(e) => setFraudAlertFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="md-filled-text-field"
                      style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    setGlobalSearch('');
                    setTransactionFilters({ type: '', status: '', dateRange: 'today', amountRange: { min: '', max: '' } });
                    setServiceRequestFilters({ status: '', priority: '', type: '' });
                    setFraudAlertFilters({ severity: '', status: '', type: '' });
                  }}
                  className="md-outlined-button md-ripple"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="md-filled-button md-ripple"
                  style={{
                    background: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)'
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Transaction Processing */}
        <div className="md-elevated-card md-animate-slide-in-up">
          <h3 className="md-typescale-title-large" style={{
            color: 'var(--md-sys-color-on-surface)',
            marginBottom: '20px'
          }}>
            Transaction Processing
          </h3>

          {/* Tab Selector */}
          <div className="tab-navigation" style={{ marginBottom: '24px' }}>
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="md-ripple tab-button"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: activeTab === tab.id ? 'var(--md-sys-color-surface)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  color: activeTab === tab.id ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
                  boxShadow: activeTab === tab.id ? 'var(--md-sys-elevation-1)' : 'none'
                }}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                role="tab"
                title={`${tab.name} (${index + 1})`}
              >
                <span style={{ fontSize: '20px' }} aria-hidden="true">{tab.icon}</span>
                <span className="md-typescale-label-large">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Message Display */}
          {message.text && (
            <div className="md-filled-card md-animate-scale-in" style={{
              padding: '12px 16px',
              marginBottom: '20px',
              background: message.type === 'success' 
                ? 'var(--md-sys-color-secondary-container)' 
                : 'var(--md-sys-color-error-container)',
              color: message.type === 'success' 
                ? 'var(--md-sys-color-on-secondary-container)' 
                : 'var(--md-sys-color-on-error-container)'
            }}>
              <div className="md-typescale-body-medium">
                {message.type === 'success' ? ' ' : ' '}
                {message.text}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h3 className="md-typescale-title-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  margin: 0
                }}>
                  📊 Dashboard Overview
                </h3>
                <button
                  onClick={() => setShowHelpTooltip(showHelpTooltip === 'overview' ? null : 'overview')}
                  className="md-ripple"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    color: 'var(--md-sys-color-on-surface-variant)'
                  }}
                  aria-label="Help for Dashboard Overview"
                  title="Click for help"
                >
                  ❓
                </button>
              </div>

              {/* Help Tooltip */}
              {showHelpTooltip === 'overview' && (
                <div className="md-filled-card md-animate-scale-in" style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'var(--md-sys-color-secondary-container)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  position: 'relative'
                }}>
                  <div className="md-typescale-body-medium" style={{
                    color: 'var(--md-sys-color-on-secondary-container)',
                    marginBottom: '12px'
                  }}>
                    <strong>Dashboard Overview</strong>
                  </div>
                  <div className="md-typescale-body-small" style={{
                    color: 'var(--md-sys-color-on-secondary-container)',
                    opacity: 0.9,
                    lineHeight: 1.5
                  }}>
                    This section provides key performance indicators and quick actions for your daily operations.
                    Monitor transaction volumes, cash on hand, and pending approvals at a glance.
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <a
                      href="#documentation"
                      style={{
                        color: 'var(--md-sys-color-primary)',
                        textDecoration: 'none',
                        fontWeight: '500'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        // Could open documentation modal or navigate to docs
                        alert('Opening documentation...');
                      }}
                    >
                      📖 View Documentation
                    </a>
                  </div>
                  <button
                    onClick={() => setShowHelpTooltip(null)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: 'var(--md-sys-color-on-secondary-container)',
                      opacity: 0.7
                    }}
                    aria-label="Close help tooltip"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div style={{ marginBottom: '32px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Key Performance Indicators
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  {/* Transaction Metrics */}
                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-primary-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    {loading ? (
                      <>
                        <SkeletonLoader width="60%" height="16px" style={{ marginBottom: '12px' }} />
                        <SkeletonLoader width="40%" height="24px" style={{ marginBottom: '8px' }} />
                        <SkeletonLoader width="50%" height="14px" />
                      </>
                    ) : (
                      <>
                        <div className="md-typescale-body-medium" style={{
                          color: 'var(--md-sys-color-on-surface-variant)',
                          marginBottom: '8px'
                        }}>
                          Today's Transactions
                        </div>
                        <div className="md-typescale-title-large" style={{
                          fontWeight: '600',
                          color: 'var(--md-sys-color-on-primary-container)',
                          marginBottom: '4px'
                        }}>
                          {dailySummary.transactions}
                        </div>
                        <div className="md-typescale-body-small" style={{
                          color: 'var(--md-sys-color-on-surface-variant)'
                        }}>
                          +12% from yesterday
                        </div>
                      </>
                    )}
                  </div>

                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-secondary-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '8px'
                    }}>
                      Total Amount Processed
                    </div>
                    <div className="md-typescale-title-large" style={{
                      fontWeight: '600',
                      color: 'var(--md-sys-color-on-secondary-container)',
                      marginBottom: '4px'
                    }}>
                      {dailySummary.totalAmount}
                    </div>
                    <div className="md-typescale-body-small" style={{
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      +8% from yesterday
                    </div>
                  </div>

                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-tertiary-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '8px'
                    }}>
                      Cash on Hand
                    </div>
                    <div className="md-typescale-title-large" style={{
                      fontWeight: '600',
                      color: 'var(--md-sys-color-on-tertiary-container)',
                      marginBottom: '4px'
                    }}>
                      {dailySummary.cashOnHand}
                    </div>
                    <div className="md-typescale-body-small" style={{
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      Drawer: {currentDrawer?.status || 'Closed'}
                    </div>
                  </div>

                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-error-container)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '8px'
                    }}>
                      Pending Approvals
                    </div>
                    <div className="md-typescale-title-large" style={{
                      fontWeight: '600',
                      color: 'var(--md-sys-color-on-error-container)',
                      marginBottom: '4px'
                    }}>
                      {dailySummary.pendingApprovals}
                    </div>
                    <div className="md-typescale-body-small" style={{
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      Requires attention
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: '32px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Quick Actions
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className="md-filled-button md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-primary)',
                      color: 'var(--md-sys-color-on-primary)',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>💰</span>
                    <div>
                      <div className="md-typescale-label-large" style={{ fontWeight: '600' }}>New Deposit</div>
                      <div className="md-typescale-body-small">Process customer deposit</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('withdrawal')}
                    className="md-filled-button md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-secondary)',
                      color: 'var(--md-sys-color-on-secondary)',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>📤</span>
                    <div>
                      <div className="md-typescale-label-large" style={{ fontWeight: '600' }}>New Withdrawal</div>
                      <div className="md-typescale-body-small">Process customer withdrawal</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('check_deposit')}
                    className="md-filled-button md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-tertiary)',
                      color: 'var(--md-sys-color-on-tertiary)',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>📄</span>
                    <div>
                      <div className="md-typescale-label-large" style={{ fontWeight: '600' }}>Check Deposit</div>
                      <div className="md-typescale-body-small">Process check deposit</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('cash_drawer')}
                    className="md-filled-button md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>💰</span>
                    <div>
                      <div className="md-typescale-label-large" style={{ fontWeight: '600' }}>Cash Drawer</div>
                      <div className="md-typescale-body-small">Manage cash drawer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('fraud_alerts')}
                    className="md-filled-button md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-error-container)',
                      color: 'var(--md-sys-color-on-error-container)',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>🚨</span>
                    <div>
                      <div className="md-typescale-label-large" style={{ fontWeight: '600' }}>Fraud Alerts</div>
                      <div className="md-typescale-body-small">{fraudStats.active_alerts || 0} active alerts</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('service_requests')}
                    className="md-filled-button md-ripple"
                    style={{
                      padding: '16px',
                      background: 'var(--md-sys-color-secondary-container)',
                      color: 'var(--md-sys-color-on-secondary-container)',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>📋</span>
                    <div>
                      <div className="md-typescale-label-large" style={{ fontWeight: '600' }}>Service Requests</div>
                      <div className="md-typescale-body-small">{serviceRequestStats.pending_requests || 0} pending</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity Summary */}
              <div style={{ marginBottom: '32px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Recent Activity
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px'
                }}>
                  {/* Recent Transactions */}
                  <div className="md-filled-card" style={{
                    padding: '20px',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-title-small" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '16px',
                      fontWeight: '600'
                    }}>
                      Latest Transactions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(transactions || []).slice(0, 5).map((transaction, index) => (
                        <div key={transaction.id || index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: index < 4 ? '1px solid var(--md-sys-color-outline-variant)' : 'none'
                        }}>
                          <div>
                            <div className="md-typescale-body-medium" style={{
                              color: 'var(--md-sys-color-on-surface)',
                              fontWeight: '500'
                            }}>
                              {transaction.type}
                            </div>
                            <div className="md-typescale-body-small" style={{
                              color: 'var(--md-sys-color-on-surface-variant)'
                            }}>
                              {new Date(transaction.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="md-typescale-title-small" style={{
                            fontWeight: '600',
                            color: transaction.amount >= 0
                              ? 'var(--md-sys-color-secondary)'
                              : 'var(--md-sys-color-error)'
                          }}>
                            {transaction.amount >= 0 ? '+' : ''}{formatCurrencyGHS(Math.abs(transaction.amount))}
                          </div>
                        </div>
                      ))}
                      {(transactions || []).length === 0 && (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: 'var(--md-sys-color-on-surface-variant)'
                        }}>
                          <p className="md-typescale-body-medium">No recent transactions</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Status */}
                  <div className="md-filled-card" style={{
                    padding: '20px',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-title-small" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '16px',
                      fontWeight: '600'
                    }}>
                      System Status
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}>
                        <div className="md-typescale-body-medium" style={{
                          color: 'var(--md-sys-color-on-surface)'
                        }}>
                          Cash Drawer
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: currentDrawer?.status === 'open' ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-surface-container-high)',
                          color: currentDrawer?.status === 'open' ? 'var(--md-sys-color-on-secondary)' : 'var(--md-sys-color-on-surface-variant)'
                        }}>
                          {currentDrawer?.status || 'Closed'}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}>
                        <div className="md-typescale-body-medium" style={{
                          color: 'var(--md-sys-color-on-surface)'
                        }}>
                          Fraud Monitoring
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: (fraudStats.active_alerts || 0) > 0 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-secondary)',
                          color: (fraudStats.active_alerts || 0) > 0 ? 'var(--md-sys-color-on-error)' : 'var(--md-sys-color-on-secondary)'
                        }}>
                          {(fraudStats.active_alerts || 0) > 0 ? 'Alerts' : 'Clear'}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}>
                        <div className="md-typescale-body-medium" style={{
                          color: 'var(--md-sys-color-on-surface)'
                        }}>
                          Service Requests
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: (serviceRequestStats.pending_requests || 0) > 0 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-secondary)',
                          color: (serviceRequestStats.pending_requests || 0) > 0 ? 'var(--md-sys-color-on-tertiary)' : 'var(--md-sys-color-on-secondary)'
                        }}>
                          {(serviceRequestStats.pending_requests || 0) > 0 ? 'Pending' : 'Clear'}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0'
                      }}>
                        <div className="md-typescale-body-medium" style={{
                          color: 'var(--md-sys-color-on-surface)'
                        }}>
                          Performance
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 'var(--md-sys-shape-corner-small)',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: 'var(--md-sys-color-primary)',
                          color: 'var(--md-sys-color-on-primary)'
                        }}>
                          Healthy
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Feature Highlights
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-title-small" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      🚀 Enhanced Transaction Processing
                    </div>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '12px'
                    }}>
                      Streamlined deposit and withdrawal processes with real-time validation and receipt generation.
                    </div>
                    <button
                      onClick={() => setActiveTab('deposit')}
                      className="md-outlined-button md-ripple"
                      style={{ width: '100%' }}
                    >
                      Try Now
                    </button>
                  </div>

                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-title-small" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      🔒 Advanced Security Monitoring
                    </div>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '12px'
                    }}>
                      Real-time fraud detection and comprehensive audit trails for all transactions and activities.
                    </div>
                    <button
                      onClick={() => setActiveTab('security_monitoring')}
                      className="md-outlined-button md-ripple"
                      style={{ width: '100%' }}
                    >
                      View Security
                    </button>
                  </div>

                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-title-small" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      📊 Comprehensive Reporting
                    </div>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '12px'
                    }}>
                      Automated report generation with customizable templates and scheduled delivery options.
                    </div>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="md-outlined-button md-ripple"
                      style={{ width: '100%' }}
                    >
                      Generate Report
                    </button>
                  </div>

                  <div className="md-filled-card" style={{
                    padding: '20px',
                    background: 'var(--md-sys-color-surface-container-low)',
                    border: '1px solid var(--md-sys-color-outline-variant)'
                  }}>
                    <div className="md-typescale-title-small" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      💬 Customer Support Integration
                    </div>
                    <div className="md-typescale-body-medium" style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      marginBottom: '12px'
                    }}>
                      Integrated chat support system for real-time customer assistance and issue resolution.
                    </div>
                    <button
                      onClick={() => setActiveTab('chat_support')}
                      className="md-outlined-button md-ripple"
                      style={{ width: '100%' }}
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Forms */}
          {activeTab === 'deposit' && (
            <TransactionForm
              type="Deposit"
              amount={depositAmount}
              setAmount={setDepositAmount}
              memberId={depositMemberId}
              setMemberId={setDepositMemberId}
              members={members}
              accountType={accountType}
              setAccountType={setAccountType}
              handleSubmit={handleTransactionSubmit}
              loading={loading}
            />
          )}

          {activeTab === 'withdrawal' && (
            <TransactionForm
              type="Withdrawal"
              amount={withdrawalAmount}
              setAmount={setWithdrawalAmount}
              memberId={withdrawalMemberId}
              setMemberId={setWithdrawalMemberId}
              members={members}
              accountType={accountType}
              setAccountType={setAccountType}
              handleSubmit={handleTransactionSubmit}
              loading={loading}
            />
          )}

          {activeTab === 'check_deposit' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                Check Deposit
              </h3>

              {/* Member Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Select Member
                </label>
                <select
                  value={checkDepositMemberId}
                  onChange={(e) => setCheckDepositMemberId(e.target.value)}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="">Select a member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Check Amount (GHS)
                </label>
                <input
                  type="number"
                  value={checkDepositAmount}
                  onChange={(e) => setCheckDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                />
              </div>

              {/* Account Type */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Account Type
                </label>
                <select
                  value={checkDepositAccountType}
                  onChange={(e) => setCheckDepositAccountType(e.target.value)}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="Savings">Savings</option>
                  <option value="Checking">Checking</option>
                  <option value="Share">Share</option>
                </select>
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Check Images
                </label>

                {/* Front Image */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '14px'
                  }}>
                    Front of Check *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFrontImage(e.target.files[0])}
                    style={{ display: 'block', marginTop: '4px' }}
                  />
                  {frontImage && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Selected: {frontImage.name}
                    </div>
                  )}
                </div>

                {/* Back Image */}
                <div>
                  <label style={{
                    color: 'var(--md-sys-color-on-surface-variant)',
                    fontSize: '14px'
                  }}>
                    Back of Check (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBackImage(e.target.files[0])}
                    style={{ display: 'block', marginTop: '4px' }}
                  />
                  {backImage && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Selected: {backImage.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCheckDepositSubmit}
                disabled={loading || !checkDepositMemberId || !checkDepositAmount || !frontImage}
                className="md-filled-button md-ripple"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: (!checkDepositMemberId || !checkDepositAmount || !frontImage)
                    ? 'var(--md-sys-color-surface-container-high)'
                    : 'var(--md-sys-color-tertiary)',
                  color: (!checkDepositMemberId || !checkDepositAmount || !frontImage)
                    ? 'var(--md-sys-color-on-surface-variant)'
                    : 'var(--md-sys-color-on-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontWeight: '600',
                  cursor: (!checkDepositMemberId || !checkDepositAmount || !frontImage) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Process Check Deposit'}
              </button>
            </div>
          )}

          {activeTab === 'fraud_alerts' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                🚨 Fraud Alerts & Investigations
              </h3>

              {/* Fraud Stats Overview */}
              <div style={{ marginBottom: '24px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Alert Summary
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {[
                    { label: 'Active Alerts', value: fraudStats.active_alerts || 0, color: 'error' },
                    { label: 'High Priority', value: fraudStats.high_priority || 0, color: 'tertiary' },
                    { label: 'Under Investigation', value: fraudStats.under_investigation || 0, color: 'secondary' },
                    { label: 'Resolved Today', value: fraudStats.resolved_today || 0, color: 'primary' },
                    { label: 'False Positives', value: fraudStats.false_positives || 0, color: 'primary' }
                  ].map((stat, index) => (
                    <div key={index} className="md-filled-card" style={{
                      padding: '16px',
                      background: `var(--md-sys-color-${stat.color}-container)`,
                      color: `var(--md-sys-color-on-${stat.color}-container)`
                    }}>
                      <div className="md-typescale-body-medium" style={{ marginBottom: '4px' }}>
                        {stat.label}
                      </div>
                      <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fraud Alerts List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Recent Fraud Alerts
                </h4>
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {fraudLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <p className="md-typescale-body-medium">Loading fraud alerts...</p>
                    </div>
                  ) : fraudAlerts.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      <p className="md-typescale-body-medium">No fraud alerts detected</p>
                    </div>
                  ) : (
                    fraudAlerts.slice(0, 10).map((alert) => (
                      <div key={alert.id} className="md-list-item" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-surface-container-low)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        cursor: 'pointer'
                      }} onClick={() => setSelectedFraudAlert(alert)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className="md-typescale-title-small" style={{
                              color: 'var(--md-sys-color-on-surface)',
                              fontWeight: '600'
                            }}>
                              {alert.alert_type.replace('_', ' ').toUpperCase()} - {alert.account_id}
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--md-sys-shape-corner-small)',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: alert.severity === 'critical' ? 'var(--md-sys-color-error-container)' :
                                        alert.severity === 'high' ? 'var(--md-sys-color-tertiary-container)' :
                                        alert.severity === 'medium' ? 'var(--md-sys-color-secondary-container)' :
                                        'var(--md-sys-color-primary-container)',
                              color: alert.severity === 'critical' ? 'var(--md-sys-color-on-error-container)' :
                                    alert.severity === 'high' ? 'var(--md-sys-color-on-tertiary-container)' :
                                    alert.severity === 'medium' ? 'var(--md-sys-color-on-secondary-container)' :
                                    'var(--md-sys-color-on-primary-container)'
                            }}>
                              {alert.severity.toUpperCase()}
                            </div>
                          </div>
                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)',
                            marginBottom: '4px'
                          }}>
                            {alert.description}
                          </div>
                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)'
                          }}>
                            Detected: {new Date(alert.detected_at).toLocaleString()} • Risk Score: {alert.risk_score}/100
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fraud Alert Details Modal */}
              {selectedFraudAlert && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div className="md-elevated-card" style={{
                    width: '90%',
                    maxWidth: '700px',
                    padding: '24px',
                    maxHeight: '80vh',
                    overflowY: 'auto'
                  }}>
                    <h3 className="md-typescale-title-large" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '20px'
                    }}>
                      Fraud Alert Details
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                      <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Alert Type
                        </div>
                        <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                          {selectedFraudAlert.alert_type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>

                      <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Account ID
                        </div>
                        <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                          {selectedFraudAlert.account_id}
                        </div>
                      </div>

                      <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Risk Score
                        </div>
                        <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                          {selectedFraudAlert.risk_score}/100
                        </div>
                      </div>

                      <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Description
                        </div>
                        <div className="md-typescale-body-medium" style={{ marginTop: '8px' }}>
                          {selectedFraudAlert.description}
                        </div>
                      </div>

                      <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Transaction Details
                        </div>
                        <div className="md-typescale-body-medium" style={{ marginTop: '8px' }}>
                          Amount: {formatCurrencyGHS(selectedFraudAlert.transaction_amount)}<br/>
                          Date: {new Date(selectedFraudAlert.transaction_date).toLocaleString()}<br/>
                          Location: {selectedFraudAlert.transaction_location || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Actions */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 className="md-typescale-title-medium" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        marginBottom: '16px'
                      }}>
                        Resolution Actions
                      </h4>

                      <div style={{ marginBottom: '16px' }}>
                        <label className="md-typescale-body-large" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Action Taken
                        </label>
                        <select
                          value={fraudActionTaken}
                          onChange={(e) => setFraudActionTaken(e.target.value)}
                          className="md-filled-text-field"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            background: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface)'
                          }}
                        >
                          <option value="">Select action...</option>
                          <option value="investigate">Mark for Investigation</option>
                          <option value="block_account">Block Account</option>
                          <option value="contact_customer">Contact Customer</option>
                          <option value="escalate">Escalate to Management</option>
                          <option value="dismiss">Dismiss as False Positive</option>
                          <option value="monitor">Monitor Account</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label className="md-typescale-body-large" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Resolution Notes
                        </label>
                        <textarea
                          value={fraudResolutionNotes}
                          onChange={(e) => setFraudResolutionNotes(e.target.value)}
                          placeholder="Enter resolution notes..."
                          className="md-filled-text-field"
                          rows="4"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            background: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface)',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setSelectedFraudAlert(null);
                          setFraudResolutionNotes('');
                          setFraudActionTaken('');
                        }}
                        className="md-outlined-button md-ripple"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!fraudActionTaken) {
                            showMessage('error', 'Please select an action taken');
                            return;
                          }

                          setFraudLoading(true);
                          try {
                            await api.post(`/api/fraud/alerts/${selectedFraudAlert.id}/resolve/`, {
                              action_taken: fraudActionTaken,
                              resolution_notes: fraudResolutionNotes
                            });

                            showMessage('success', 'Fraud alert resolved successfully');
                            setSelectedFraudAlert(null);
                            setFraudResolutionNotes('');
                            setFraudActionTaken('');
                            await fetchFraudAlerts();
                            await fetchFraudStats();
                          } catch (error) {
                            const errorMessage = error.response?.data?.error || error.message || 'Failed to resolve fraud alert';
                            showMessage('error', `Error: ${errorMessage}`);
                          } finally {
                            setFraudLoading(false);
                          }
                        }}
                        disabled={fraudLoading || !fraudActionTaken}
                        className="md-filled-button md-ripple"
                        style={{
                          background: !fraudActionTaken
                            ? 'var(--md-sys-color-surface-container-high)'
                            : 'var(--md-sys-color-primary)',
                          color: !fraudActionTaken
                            ? 'var(--md-sys-color-on-surface-variant)'
                            : 'var(--md-sys-color-on-primary)',
                          border: 'none',
                          borderRadius: 'var(--md-sys-shape-corner-medium)',
                          fontWeight: '600',
                          cursor: !fraudActionTaken ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {fraudLoading ? 'Resolving...' : 'Resolve Alert'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account_opening' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                📝 Account Opening
              </h3>

              {/* Account Type Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Account Type
                </label>
                <select
                  value={accountOpeningData.account_type}
                  onChange={(e) => setAccountOpeningData(prev => ({ ...prev, account_type: e.target.value }))}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="savings">Savings Account</option>
                  <option value="checking">Checking Account</option>
                  <option value="business">Business Account</option>
                  <option value="joint">Joint Account</option>
                </select>
              </div>

              {/* Personal Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={accountOpeningData.first_name}
                    onChange={(e) => setAccountOpeningData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                    className="md-filled-text-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  />
                </div>
                <div>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={accountOpeningData.last_name}
                    onChange={(e) => setAccountOpeningData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                    className="md-filled-text-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={accountOpeningData.date_of_birth}
                    onChange={(e) => setAccountOpeningData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="md-filled-text-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  />
                </div>
                <div>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={accountOpeningData.nationality}
                    onChange={(e) => setAccountOpeningData(prev => ({ ...prev, nationality: e.target.value }))}
                    placeholder="Enter nationality"
                    className="md-filled-text-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Address
                </label>
                <textarea
                  value={accountOpeningData.address}
                  onChange={(e) => setAccountOpeningData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                  className="md-filled-text-field"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={accountOpeningData.phone_number}
                    onChange={(e) => setAccountOpeningData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+233 XX XXX XXXX"
                    className="md-filled-text-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  />
                </div>
                <div>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={accountOpeningData.email}
                    onChange={(e) => setAccountOpeningData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="md-filled-text-field"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)'
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={async () => {
                  if (!accountOpeningData.first_name || !accountOpeningData.last_name ||
                      !accountOpeningData.date_of_birth || !accountOpeningData.nationality ||
                      !accountOpeningData.address || !accountOpeningData.phone_number ||
                      !accountOpeningData.email) {
                    showMessage('error', 'Please fill in all required fields');
                    return;
                  }

                  setLoading(true);
                  try {
                    const response = await api.post('banking/account-openings/', accountOpeningData);
                    showMessage('success', 'Account opening application submitted successfully! Application will be reviewed.');
                    setAccountOpeningData({
                      account_type: 'savings',
                      first_name: '',
                      last_name: '',
                      date_of_birth: '',
                      nationality: '',
                      address: '',
                      phone_number: '',
                      email: ''
                    });
                  } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Failed to submit account opening application';
                    showMessage('error', `Error: ${errorMessage}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="md-filled-button md-ripple"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Account Opening Application'}
              </button>
            </div>
          )}

          {activeTab === 'account_closure' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                🔒 Account Closure
              </h3>

              {/* Account Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Select Account to Close
                </label>
                <select
                  value={accountClosureData.account_id}
                  onChange={(e) => setAccountClosureData(prev => ({ ...prev, account_id: e.target.value }))}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="">Select an account...</option>
                  {/* This would need to be populated with user's accounts */}
                  <option value="sample-account-1">Savings Account - ****1234</option>
                  <option value="sample-account-2">Checking Account - ****5678</option>
                </select>
              </div>

              {/* Closure Reason */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Reason for Closure
                </label>
                <select
                  value={accountClosureData.closure_reason}
                  onChange={(e) => setAccountClosureData(prev => ({ ...prev, closure_reason: e.target.value }))}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="">Select a reason...</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="fraud_suspected">Fraud Suspected</option>
                  <option value="deceased">Account Holder Deceased</option>
                  <option value="compliance">Compliance Violation</option>
                  <option value="inactive">Account Inactive</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Other Reason (conditional) */}
              {accountClosureData.closure_reason === 'other' && (
                <div style={{ marginBottom: '24px' }}>
                  <label className="md-typescale-body-large" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Please specify the reason
                  </label>
                  <textarea
                    value={accountClosureData.other_reason}
                    onChange={(e) => setAccountClosureData(prev => ({ ...prev, other_reason: e.target.value }))}
                    placeholder="Enter the specific reason for account closure"
                    className="md-filled-text-field"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      borderRadius: 'var(--md-sys-shape-corner-medium)',
                      background: 'var(--md-sys-color-surface-container-highest)',
                      color: 'var(--md-sys-color-on-surface)',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {/* Warning Message */}
              <div className="md-filled-card" style={{
                padding: '16px',
                marginBottom: '24px',
                background: 'var(--md-sys-color-error-container)',
                border: '1px solid var(--md-sys-color-error)'
              }}>
                <div className="md-typescale-body-medium" style={{
                  color: 'var(--md-sys-color-on-error-container)',
                  fontWeight: '500'
                }}>
                  ⚠️ Warning: Account closure is irreversible. Please ensure all balances are settled and outstanding loans are paid before proceeding.
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={async () => {
                  if (!accountClosureData.account_id || !accountClosureData.closure_reason) {
                    showMessage('error', 'Please select an account and provide a closure reason');
                    return;
                  }

                  if (accountClosureData.closure_reason === 'other' && !accountClosureData.other_reason.trim()) {
                    showMessage('error', 'Please specify the reason for closure');
                    return;
                  }

                  setLoading(true);
                  try {
                    const closureData = {
                      account_id: accountClosureData.account_id,
                      closure_reason: accountClosureData.closure_reason,
                      other_reason: accountClosureData.closure_reason === 'other' ? accountClosureData.other_reason : ''
                    };

                    const response = await api.post('banking/account-closures/', closureData);
                    showMessage('success', 'Account closure request submitted successfully! The request will be reviewed by management.');
                    setAccountClosureData({
                      account_id: '',
                      closure_reason: '',
                      other_reason: ''
                    });
                  } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Failed to submit account closure request';
                    showMessage('error', `Error: ${errorMessage}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="md-filled-button md-ripple"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--md-sys-color-error)',
                  color: 'var(--md-sys-color-on-error)',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Account Closure Request'}
              </button>
            </div>
          )}

          {/* Products & Promotions Tab */}
          {activeTab === 'products_promotions' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                🛍️ Products & Promotions
              </h3>

              {/* Customer Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Select Customer for Recommendations
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    fetchRecommendations(e.target.value);
                  }}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="">Select a customer...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 className="md-typescale-title-medium" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '16px'
                  }}>
                    Recommended Products
                  </h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="md-filled-card" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-secondary-container)',
                        cursor: 'pointer'
                      }} onClick={() => setSelectedProduct(rec.product.id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div className="md-typescale-title-small" style={{
                              color: 'var(--md-sys-color-on-secondary-container)',
                              marginBottom: '4px'
                            }}>
                              {rec.product.name}
                            </div>
                            <div className="md-typescale-body-small" style={{
                              color: 'var(--md-sys-color-on-secondary-container)',
                              opacity: 0.8
                            }}>
                              {rec.reasoning}
                            </div>
                          </div>
                          <div className="md-typescale-title-small" style={{
                            color: 'var(--md-sys-color-on-secondary-container)',
                            fontWeight: '600'
                          }}>
                            Priority: {rec.priority_score}/10
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="">Select a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrencyGHS(product.base_price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Promotion Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Apply Promotion (Optional)
                </label>
                <select
                  value={selectedPromotion}
                  onChange={(e) => setSelectedPromotion(e.target.value)}
                  className="md-filled-text-field"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value="">No promotion</option>
                  {promotions.map((promo) => (
                    <option key={promo.id} value={promo.id}>
                      {promo.name} - {promo.discount_display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enroll Button */}
              <button
                onClick={handleProductEnrollment}
                disabled={enrollmentLoading || !selectedCustomer || !selectedProduct}
                className="md-filled-button md-ripple"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: (!selectedCustomer || !selectedProduct)
                    ? 'var(--md-sys-color-surface-container-high)'
                    : 'var(--md-sys-color-tertiary)',
                  color: (!selectedCustomer || !selectedProduct)
                    ? 'var(--md-sys-color-on-surface-variant)'
                    : 'var(--md-sys-color-on-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontWeight: '600',
                  cursor: (!selectedCustomer || !selectedProduct) ? 'not-allowed' : 'pointer'
                }}
              >
                {enrollmentLoading ? 'Processing...' : 'Enroll Customer in Product'}
              </button>
            </div>
          )}

          {/* Service Requests Tab */}
          {activeTab === 'service_requests' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                📋 Service Requests Management
              </h3>

              {/* Service Request Stats */}
              <div style={{ marginBottom: '24px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Overview
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px'
                }}>
                  {[
                    { label: 'Total Requests', value: serviceRequestStats.total_requests || 0, color: 'primary' },
                    { label: 'Pending', value: serviceRequestStats.pending_requests || 0, color: 'tertiary' },
                    { label: 'Approved', value: serviceRequestStats.approved_requests || 0, color: 'secondary' },
                    { label: 'Fulfilled', value: serviceRequestStats.fulfilled_requests || 0, color: 'primary' },
                    { label: 'Rejected', value: serviceRequestStats.rejected_requests || 0, color: 'error' }
                  ].map((stat, index) => (
                    <div key={index} className="md-filled-card" style={{
                      padding: '16px',
                      background: `var(--md-sys-color-${stat.color}-container)`,
                      color: `var(--md-sys-color-on-${stat.color}-container)`
                    }}>
                      <div className="md-typescale-body-medium" style={{ marginBottom: '4px' }}>
                        {stat.label}
                      </div>
                      <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create New Request */}
              <div style={{ marginBottom: '24px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Create New Service Request
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                  {/* Request Type Selection */}
                  <div>
                    <label className="md-typescale-body-large" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Request Type
                    </label>
                    <select
                      value={selectedRequestType}
                      onChange={(e) => setSelectedRequestType(e.target.value)}
                      className="md-filled-text-field"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        background: 'var(--md-sys-color-surface-container-highest)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    >
                      <option value="checkbook">Checkbook Request</option>
                      <option value="statement">Account Statement</option>
                      <option value="loan_info">Loan Information</option>
                    </select>
                  </div>

                  {/* Request Form */}
                  <div className="md-filled-card" style={{ padding: '20px' }}>
                    {/* Common Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label className="md-typescale-body-large" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Select Member
                        </label>
                        <select
                          value={newServiceRequest.member_id}
                          onChange={(e) => setNewServiceRequest(prev => ({ ...prev, member_id: e.target.value }))}
                          className="md-filled-text-field"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            background: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface)'
                          }}
                        >
                          <option value="">Select a member...</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} - {member.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="md-typescale-body-large" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          display: 'block',
                          marginBottom: '8px'
                        }}>
                          Priority
                        </label>
                        <select
                          value={newServiceRequest.priority}
                          onChange={(e) => setNewServiceRequest(prev => ({ ...prev, priority: e.target.value }))}
                          className="md-filled-text-field"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: 'none',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            background: 'var(--md-sys-color-surface-container-highest)',
                            color: 'var(--md-sys-color-on-surface)'
                          }}
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Type-specific fields */}
                    {selectedRequestType === 'checkbook' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="md-typescale-body-large" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newServiceRequest.quantity}
                            onChange={(e) => setNewServiceRequest(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                            className="md-filled-text-field"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: 'none',
                              borderRadius: 'var(--md-sys-shape-corner-medium)',
                              background: 'var(--md-sys-color-surface-container-highest)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}
                          />
                        </div>
                        <div>
                          <label className="md-typescale-body-large" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Delivery Method
                          </label>
                          <select
                            value={newServiceRequest.delivery_method}
                            onChange={(e) => setNewServiceRequest(prev => ({ ...prev, delivery_method: e.target.value }))}
                            className="md-filled-text-field"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: 'none',
                              borderRadius: 'var(--md-sys-shape-corner-medium)',
                              background: 'var(--md-sys-color-surface-container-highest)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}
                          >
                            <option value="pickup">Pickup at Branch</option>
                            <option value="mail">Mail Delivery</option>
                            <option value="courier">Courier Delivery</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {selectedRequestType === 'statement' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="md-typescale-body-large" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Statement Type
                          </label>
                          <select
                            value={newServiceRequest.statement_type}
                            onChange={(e) => setNewServiceRequest(prev => ({ ...prev, statement_type: e.target.value }))}
                            className="md-filled-text-field"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: 'none',
                              borderRadius: 'var(--md-sys-shape-corner-medium)',
                              background: 'var(--md-sys-color-surface-container-highest)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}
                          >
                            <option value="monthly">Monthly Statement</option>
                            <option value="quarterly">Quarterly Statement</option>
                            <option value="annual">Annual Statement</option>
                            <option value="custom">Custom Date Range</option>
                          </select>
                        </div>
                        <div>
                          <label className="md-typescale-body-large" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Delivery Method
                          </label>
                          <select
                            value={newServiceRequest.delivery_method_statement}
                            onChange={(e) => setNewServiceRequest(prev => ({ ...prev, delivery_method_statement: e.target.value }))}
                            className="md-filled-text-field"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: 'none',
                              borderRadius: 'var(--md-sys-shape-corner-medium)',
                              background: 'var(--md-sys-color-surface-container-highest)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}
                          >
                            <option value="digital">Digital (Email)</option>
                            <option value="physical">Physical (Mail)</option>
                            <option value="both">Both Digital and Physical</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {selectedRequestType === 'loan_info' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="md-typescale-body-large" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Information Type
                          </label>
                          <select
                            value={newServiceRequest.info_type}
                            onChange={(e) => setNewServiceRequest(prev => ({ ...prev, info_type: e.target.value }))}
                            className="md-filled-text-field"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: 'none',
                              borderRadius: 'var(--md-sys-shape-corner-medium)',
                              background: 'var(--md-sys-color-surface-container-highest)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}
                          >
                            <option value="balance">Current Balance</option>
                            <option value="payment_history">Payment History</option>
                            <option value="terms">Loan Terms and Conditions</option>
                            <option value="amortization">Amortization Schedule</option>
                            <option value="full_details">Full Loan Details</option>
                          </select>
                        </div>
                        <div>
                          <label className="md-typescale-body-large" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'block',
                            marginBottom: '8px'
                          }}>
                            Delivery Method
                          </label>
                          <select
                            value={newServiceRequest.delivery_method_loan}
                            onChange={(e) => setNewServiceRequest(prev => ({ ...prev, delivery_method_loan: e.target.value }))}
                            className="md-filled-text-field"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: 'none',
                              borderRadius: 'var(--md-sys-shape-corner-medium)',
                              background: 'var(--md-sys-color-surface-container-highest)',
                              color: 'var(--md-sys-color-on-surface)'
                            }}
                          >
                            <option value="digital">Digital (Email)</option>
                            <option value="physical">Physical (Mail)</option>
                            <option value="in_person">In Person Review</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div style={{ marginBottom: '20px' }}>
                      <label className="md-typescale-body-large" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        display: 'block',
                        marginBottom: '8px'
                      }}>
                        Notes (Optional)
                      </label>
                      <textarea
                        value={newServiceRequest.notes}
                        onChange={(e) => setNewServiceRequest(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes or special instructions..."
                        className="md-filled-text-field"
                        rows="3"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: 'none',
                          borderRadius: 'var(--md-sys-shape-corner-medium)',
                          background: 'var(--md-sys-color-surface-container-highest)',
                          color: 'var(--md-sys-color-on-surface)',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={async () => {
                        if (!newServiceRequest.member_id) {
                          showMessage('error', 'Please select a member');
                          return;
                        }

                        setServiceRequestLoading(true);
                        try {
                          const requestData = {
                            request_type: selectedRequestType,
                            member_id: newServiceRequest.member_id,
                            priority: newServiceRequest.priority,
                            notes: newServiceRequest.notes,
                            ...(() => {
                              switch (selectedRequestType) {
                                case 'checkbook':
                                  return {
                                    quantity: newServiceRequest.quantity,
                                    delivery_method: newServiceRequest.delivery_method,
                                    delivery_address: newServiceRequest.delivery_method !== 'pickup' ? newServiceRequest.delivery_address : '',
                                    special_instructions: newServiceRequest.special_instructions
                                  };
                                case 'statement':
                                  return {
                                    statement_type: newServiceRequest.statement_type,
                                    delivery_method_statement: newServiceRequest.delivery_method_statement,
                                    start_date: newServiceRequest.statement_type === 'custom' ? newServiceRequest.start_date : '',
                                    end_date: newServiceRequest.statement_type === 'custom' ? newServiceRequest.end_date : '',
                                    account_number: newServiceRequest.account_number
                                  };
                                case 'loan_info':
                                  return {
                                    info_type: newServiceRequest.info_type,
                                    delivery_method_loan: newServiceRequest.delivery_method_loan,
                                    loan_account_number: newServiceRequest.loan_account_number
                                  };
                                default:
                                  return {};
                              }
                            })()
                          };

                          await api.post('services/requests/', requestData);
                          showMessage('success', 'Service request created successfully!');
                          setNewServiceRequest({
                            member_id: '',
                            priority: 'normal',
                            notes: '',
                            quantity: 1,
                            delivery_method: 'pickup',
                            delivery_address: '',
                            special_instructions: '',
                            statement_type: 'monthly',
                            delivery_method_statement: 'digital',
                            start_date: '',
                            end_date: '',
                            account_number: '',
                            info_type: 'balance',
                            delivery_method_loan: 'digital',
                            loan_account_number: ''
                          });
                          await fetchServiceRequests();
                          await fetchServiceRequestStats();
                        } catch (error) {
                          const errorMessage = error.response?.data?.error || error.message || 'Failed to create service request';
                          showMessage('error', `Error: ${errorMessage}`);
                        } finally {
                          setServiceRequestLoading(false);
                        }
                      }}
                      disabled={serviceRequestLoading || !newServiceRequest.member_id}
                      className="md-filled-button md-ripple"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: !newServiceRequest.member_id
                          ? 'var(--md-sys-color-surface-container-high)'
                          : 'var(--md-sys-color-primary)',
                        color: !newServiceRequest.member_id
                          ? 'var(--md-sys-color-on-surface-variant)'
                          : 'var(--md-sys-color-on-primary)',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        fontWeight: '600',
                        cursor: !newServiceRequest.member_id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {serviceRequestLoading ? 'Creating...' : 'Create Service Request'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Service Requests */}
              <div>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Recent Service Requests
                </h4>
                <div style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {serviceRequests.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      <p className="md-typescale-body-medium">No service requests yet</p>
                    </div>
                  ) : (
                    serviceRequests.slice(0, 10).map((request) => (
                      <div key={request.id} className="md-list-item" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-surface-container-low)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        border: '1px solid var(--md-sys-color-outline-variant)'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div className="md-typescale-title-small" style={{
                              color: 'var(--md-sys-color-on-surface)',
                              fontWeight: '600'
                            }}>
                              {request.request_type.replace('_', ' ').toUpperCase()} - {request.member_name}
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--md-sys-shape-corner-small)',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: request.status === 'fulfilled' ? 'var(--md-sys-color-secondary-container)' :
                                        request.status === 'approved' ? 'var(--md-sys-color-tertiary-container)' :
                                        request.status === 'pending' ? 'var(--md-sys-color-primary-container)' :
                                        request.status === 'rejected' ? 'var(--md-sys-color-error-container)' :
                                        'var(--md-sys-color-surface-container-high)',
                              color: request.status === 'fulfilled' ? 'var(--md-sys-color-on-secondary-container)' :
                                    request.status === 'approved' ? 'var(--md-sys-color-on-tertiary-container)' :
                                    request.status === 'pending' ? 'var(--md-sys-color-on-primary-container)' :
                                    request.status === 'rejected' ? 'var(--md-sys-color-on-error-container)' :
                                    'var(--md-sys-color-on-surface-variant)'
                            }}>
                              {request.status.toUpperCase()}
                            </div>
                          </div>
                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)',
                            marginBottom: '4px'
                          }}>
                            Created: {new Date(request.created_at).toLocaleString()} • Priority: {request.priority}
                          </div>
                          {request.notes && (
                            <div className="md-typescale-body-small" style={{
                              color: 'var(--md-sys-color-on-surface-variant)'
                            }}>
                              Notes: {request.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                📊 Reports & Analytics
              </h3>

              {/* Report View Mode Selector */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '4px',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  borderRadius: 'var(--md-sys-shape-corner-large)'
                }}>
                  {[
                    { id: 'list', name: 'Reports', icon: '📋' },
                    { id: 'templates', name: 'Templates', icon: '📝' },
                    { id: 'schedules', name: 'Schedules', icon: '⏰' },
                    { id: 'analytics', name: 'Analytics', icon: '📈' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setReportViewMode(mode.id)}
                      className="md-ripple"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: reportViewMode === mode.id ? 'var(--md-sys-color-surface)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        color: reportViewMode === mode.id ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                        fontWeight: reportViewMode === mode.id ? '600' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
                        boxShadow: reportViewMode === mode.id ? 'var(--md-sys-elevation-1)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{mode.icon}</span>
                      <span className="md-typescale-label-large">{mode.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reports List View */}
              {reportViewMode === 'list' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      margin: 0
                    }}>
                      Generated Reports
                    </h4>
                    <button
                      onClick={() => setShowGenerateReport(true)}
                      className="md-filled-button md-ripple"
                      style={{
                        background: 'var(--md-sys-color-primary)',
                        color: 'var(--md-sys-color-on-primary)'
                      }}
                    >
                      Generate New Report
                    </button>
                  </div>

                  {reportsLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <p className="md-typescale-body-medium">Loading reports...</p>
                    </div>
                  ) : reports.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      <p className="md-typescale-body-medium">No reports generated yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reports.map((report) => (
                        <div key={report.id} className="md-list-item" style={{
                          padding: '16px',
                          background: 'var(--md-sys-color-surface-container-low)',
                          borderRadius: 'var(--md-sys-shape-corner-medium)',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          cursor: 'pointer'
                        }} onClick={() => setSelectedReport(report)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div className="md-typescale-title-small" style={{
                                color: 'var(--md-sys-color-on-surface)',
                                fontWeight: '600'
                              }}>
                                {report.title}
                              </div>
                              <div style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: report.status === 'completed' ? 'var(--md-sys-color-secondary-container)' :
                                          report.status === 'generating' ? 'var(--md-sys-color-tertiary-container)' :
                                          report.status === 'failed' ? 'var(--md-sys-color-error-container)' :
                                          'var(--md-sys-color-primary-container)',
                                color: report.status === 'completed' ? 'var(--md-sys-color-on-secondary-container)' :
                                      report.status === 'generating' ? 'var(--md-sys-color-on-tertiary-container)' :
                                      report.status === 'failed' ? 'var(--md-sys-color-on-error-container)' :
                                      'var(--md-sys-color-on-primary-container)'
                              }}>
                                {report.status.toUpperCase()}
                              </div>
                            </div>
                            <div className="md-typescale-body-small" style={{
                              color: 'var(--md-sys-color-on-surface-variant)',
                              marginBottom: '4px'
                            }}>
                              Template: {report.template?.name} • Generated: {new Date(report.generated_at).toLocaleString()}
                            </div>
                            {report.description && (
                              <div className="md-typescale-body-small" style={{
                                color: 'var(--md-sys-color-on-surface-variant)'
                              }}>
                                {report.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Templates View */}
              {reportViewMode === 'templates' && (
                <div>
                  <h4 className="md-typescale-title-medium" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '20px'
                  }}>
                    Report Templates
                  </h4>

                  {reportTemplates.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      <p className="md-typescale-body-medium">No report templates available</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      {reportTemplates.map((template) => (
                        <div key={template.id} className="md-filled-card" style={{
                          padding: '20px',
                          background: 'var(--md-sys-color-surface-container-low)',
                          border: '1px solid var(--md-sys-color-outline-variant)'
                        }}>
                          <div className="md-typescale-title-medium" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            marginBottom: '8px',
                            fontWeight: '600'
                          }}>
                            {template.name}
                          </div>
                          <div className="md-typescale-body-medium" style={{
                            color: 'var(--md-sys-color-on-surface-variant)',
                            marginBottom: '12px'
                          }}>
                            {template.description}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--md-sys-shape-corner-small)',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: 'var(--md-sys-color-primary-container)',
                              color: 'var(--md-sys-color-on-primary-container)'
                            }}>
                              {template.template_type.replace('_', ' ').toUpperCase()}
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--md-sys-shape-corner-small)',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: 'var(--md-sys-color-secondary-container)',
                              color: 'var(--md-sys-color-on-secondary-container)'
                            }}>
                              {template.frequency.toUpperCase()}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedReportTemplate(template.id);
                              setShowGenerateReport(true);
                            }}
                            className="md-filled-button md-ripple"
                            style={{
                              width: '100%',
                              background: 'var(--md-sys-color-primary)',
                              color: 'var(--md-sys-color-on-primary)'
                            }}
                          >
                            Use Template
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Schedules View */}
              {reportViewMode === 'schedules' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      margin: 0
                    }}>
                      Report Schedules
                    </h4>
                    <button
                      onClick={() => setShowCreateSchedule(true)}
                      className="md-filled-button md-ripple"
                      style={{
                        background: 'var(--md-sys-color-secondary)',
                        color: 'var(--md-sys-color-on-secondary)'
                      }}
                    >
                      Create Schedule
                    </button>
                  </div>

                  {reportSchedules.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      <p className="md-typescale-body-medium">No report schedules configured</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reportSchedules.map((schedule) => (
                        <div key={schedule.id} className="md-list-item" style={{
                          padding: '16px',
                          background: 'var(--md-sys-color-surface-container-low)',
                          borderRadius: 'var(--md-sys-shape-corner-medium)',
                          border: '1px solid var(--md-sys-color-outline-variant)'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div className="md-typescale-title-small" style={{
                                color: 'var(--md-sys-color-on-surface)',
                                fontWeight: '600'
                              }}>
                                {schedule.name}
                              </div>
                              <div style={{
                                padding: '4px 8px',
                                borderRadius: 'var(--md-sys-shape-corner-small)',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: schedule.status === 'active' ? 'var(--md-sys-color-secondary-container)' :
                                          schedule.status === 'paused' ? 'var(--md-sys-color-tertiary-container)' :
                                          'var(--md-sys-color-error-container)',
                                color: schedule.status === 'active' ? 'var(--md-sys-color-on-secondary-container)' :
                                      schedule.status === 'paused' ? 'var(--md-sys-color-on-tertiary-container)' :
                                      'var(--md-sys-color-on-error-container)'
                              }}>
                                {schedule.status.toUpperCase()}
                              </div>
                            </div>
                            <div className="md-typescale-body-small" style={{
                              color: 'var(--md-sys-color-on-surface-variant)',
                              marginBottom: '4px'
                            }}>
                              Template: {schedule.template?.name} • Frequency: {schedule.frequency} • Next Run: {new Date(schedule.next_run).toLocaleString()}
                            </div>
                            {schedule.description && (
                              <div className="md-typescale-body-small" style={{
                                color: 'var(--md-sys-color-on-surface-variant)'
                              }}>
                                {schedule.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analytics View */}
              {reportViewMode === 'analytics' && (
                <div>
                  <h4 className="md-typescale-title-medium" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '20px'
                  }}>
                    Report Analytics
                  </h4>

                  {reportAnalytics.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      <p className="md-typescale-body-medium">No analytics data available</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                      {reportAnalytics.map((analytics) => (
                        <div key={analytics.id} className="md-filled-card" style={{
                          padding: '20px',
                          background: 'var(--md-sys-color-surface-container-low)',
                          border: '1px solid var(--md-sys-color-outline-variant)'
                        }}>
                          <div className="md-typescale-title-medium" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            marginBottom: '16px',
                            fontWeight: '600'
                          }}>
                            {analytics.report?.title}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div className="md-filled-card" style={{
                              padding: '12px',
                              background: 'var(--md-sys-color-primary-container)'
                            }}>
                              <div className="md-typescale-body-small" style={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                                marginBottom: '4px'
                              }}>
                                Total Transactions
                              </div>
                              <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                                {analytics.total_transactions}
                              </div>
                            </div>

                            <div className="md-filled-card" style={{
                              padding: '12px',
                              background: 'var(--md-sys-color-secondary-container)'
                            }}>
                              <div className="md-typescale-body-small" style={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                                marginBottom: '4px'
                              }}>
                                Total Amount
                              </div>
                              <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                                {formatCurrencyGHS(analytics.total_amount)}
                              </div>
                            </div>
                          </div>

                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)'
                          }}>
                            Calculated: {new Date(analytics.calculated_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
           )}

           {/* Performance Monitoring Tab */}
           {activeTab === 'performance_monitoring' && (
             <div className="md-filled-card" style={{ padding: '24px' }}>
               <h3 className="md-typescale-title-large" style={{
                 color: 'var(--md-sys-color-on-surface)',
                 marginBottom: '20px'
               }}>
                 📈 Performance Monitoring & Analytics
               </h3>

               {/* Time Range and Metric Type Selectors */}
               <div style={{ marginBottom: '24px' }}>
                 <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                   <div>
                     <label className="md-typescale-body-large" style={{
                       color: 'var(--md-sys-color-on-surface)',
                       display: 'block',
                       marginBottom: '8px'
                     }}>
                       Time Range
                     </label>
                     <select
                       value={selectedTimeRange}
                       onChange={(e) => setSelectedTimeRange(e.target.value)}
                       className="md-filled-text-field"
                       style={{
                         width: '150px',
                         padding: '12px',
                         border: 'none',
                         borderRadius: 'var(--md-sys-shape-corner-medium)',
                         background: 'var(--md-sys-color-surface-container-highest)',
                         color: 'var(--md-sys-color-on-surface)'
                       }}
                     >
                       <option value="1h">Last Hour</option>
                       <option value="24h">Last 24 Hours</option>
                       <option value="7d">Last 7 Days</option>
                       <option value="30d">Last 30 Days</option>
                     </select>
                   </div>
                   <div>
                     <label className="md-typescale-body-large" style={{
                       color: 'var(--md-sys-color-on-surface)',
                       display: 'block',
                       marginBottom: '8px'
                     }}>
                       Metric Type
                     </label>
                     <select
                       value={selectedMetricType}
                       onChange={(e) => setSelectedMetricType(e.target.value)}
                       className="md-filled-text-field"
                       style={{
                         width: '200px',
                         padding: '12px',
                         border: 'none',
                         borderRadius: 'var(--md-sys-shape-corner-medium)',
                         background: 'var(--md-sys-color-surface-container-highest)',
                         color: 'var(--md-sys-color-on-surface)'
                       }}
                     >
                       <option value="response_time">Response Time</option>
                       <option value="throughput">Throughput</option>
                       <option value="error_rate">Error Rate</option>
                       <option value="cpu_usage">CPU Usage</option>
                       <option value="memory_usage">Memory Usage</option>
                       <option value="transaction_volume">Transaction Volume</option>
                     </select>
                   </div>
                 </div>
               </div>

               {performanceLoading ? (
                 <div style={{ textAlign: 'center', padding: '40px' }}>
                   <p className="md-typescale-body-medium">Loading performance data...</p>
                 </div>
               ) : (
                 <>
                   {/* Dashboard Overview Cards */}
                   {performanceData && (
                     <div style={{ marginBottom: '24px' }}>
                       <h4 className="md-typescale-title-medium" style={{
                         color: 'var(--md-sys-color-on-surface)',
                         marginBottom: '16px'
                       }}>
                         System Overview
                       </h4>
                       <div style={{
                         display: 'grid',
                         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                         gap: '12px'
                       }}>
                         <div className="md-filled-card" style={{
                           padding: '16px',
                           background: 'var(--md-sys-color-primary-container)'
                         }}>
                           <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                             Avg Response Time
                           </div>
                           <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                             {performanceData.avg_response_time ? `${performanceData.avg_response_time}ms` : 'N/A'}
                           </div>
                         </div>

                         <div className="md-filled-card" style={{
                           padding: '16px',
                           background: 'var(--md-sys-color-secondary-container)'
                         }}>
                           <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                             Total Transactions
                           </div>
                           <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                             {performanceData.total_transactions || 0}
                           </div>
                         </div>

                         <div className="md-filled-card" style={{
                           padding: '16px',
                           background: 'var(--md-sys-color-tertiary-container)'
                         }}>
                           <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                             Error Rate
                           </div>
                           <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                             {performanceData.error_rate ? `${performanceData.error_rate}%` : '0%'}
                           </div>
                         </div>

                         <div className="md-filled-card" style={{
                           padding: '16px',
                           background: 'var(--md-sys-color-error-container)'
                         }}>
                           <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                             Active Alerts
                           </div>
                           <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                             {performanceAlerts.length}
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {/* System Health Status */}
                   <div style={{ marginBottom: '24px' }}>
                     <h4 className="md-typescale-title-medium" style={{
                       color: 'var(--md-sys-color-on-surface)',
                       marginBottom: '16px'
                     }}>
                       System Health
                     </h4>
                     <div style={{
                       display: 'grid',
                       gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                       gap: '16px'
                     }}>
                       {systemHealth.length === 0 ? (
                         <div style={{
                           padding: '40px 20px',
                           textAlign: 'center',
                           color: 'var(--md-sys-color-on-surface-variant)',
                           gridColumn: '1 / -1'
                         }}>
                           <p className="md-typescale-body-medium">No system health data available</p>
                         </div>
                       ) : (
                         systemHealth.map((health) => (
                           <div key={health.id} className="md-filled-card" style={{
                             padding: '20px',
                             background: health.status === 'healthy' ? 'var(--md-sys-color-secondary-container)' :
                                        health.status === 'warning' ? 'var(--md-sys-color-tertiary-container)' :
                                        'var(--md-sys-color-error-container)',
                             border: '1px solid var(--md-sys-color-outline-variant)'
                           }}>
                             <div className="md-typescale-title-medium" style={{
                               color: 'var(--md-sys-color-on-surface)',
                               marginBottom: '8px',
                               fontWeight: '600'
                             }}>
                               {health.component_name}
                             </div>
                             <div className="md-typescale-body-medium" style={{
                               color: 'var(--md-sys-color-on-surface-variant)',
                               marginBottom: '12px'
                             }}>
                               {health.description}
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div style={{
                                 padding: '4px 8px',
                                 borderRadius: 'var(--md-sys-shape-corner-small)',
                                 fontSize: '12px',
                                 fontWeight: '600',
                                 background: health.status === 'healthy' ? 'var(--md-sys-color-secondary)' :
                                           health.status === 'warning' ? 'var(--md-sys-color-tertiary)' :
                                           'var(--md-sys-color-error)',
                                 color: health.status === 'healthy' ? 'var(--md-sys-color-on-secondary)' :
                                       health.status === 'warning' ? 'var(--md-sys-color-on-tertiary)' :
                                       'var(--md-sys-color-on-error)'
                               }}>
                                 {health.status.toUpperCase()}
                               </div>
                               <div className="md-typescale-body-small" style={{
                                 color: 'var(--md-sys-color-on-surface-variant)'
                               }}>
                                 {new Date(health.last_checked).toLocaleString()}
                               </div>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   </div>

                   {/* Transaction Volume Chart */}
                   <div style={{ marginBottom: '24px' }}>
                     <h4 className="md-typescale-title-medium" style={{
                       color: 'var(--md-sys-color-on-surface)',
                       marginBottom: '16px'
                     }}>
                       Transaction Volume
                     </h4>
                     <div className="md-filled-card" style={{ padding: '20px' }}>
                       {transactionVolume.length === 0 ? (
                         <div style={{
                           padding: '40px 20px',
                           textAlign: 'center',
                           color: 'var(--md-sys-color-on-surface-variant)'
                         }}>
                           <p className="md-typescale-body-medium">No transaction volume data available</p>
                         </div>
                       ) : (
                         <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '8px' }}>
                           {transactionVolume.map((data, index) => (
                             <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                               <div
                                 style={{
                                   width: '100%',
                                   height: `${Math.max((data.volume / Math.max(...transactionVolume.map(d => d.volume))) * 200, 20)}px`,
                                   background: 'var(--md-sys-color-primary)',
                                   borderRadius: 'var(--md-sys-shape-corner-small)  var(--md-sys-shape-corner-small) 0 0',
                                   marginBottom: '8px'
                                 }}
                               />
                               <div className="md-typescale-body-small" style={{
                                 color: 'var(--md-sys-color-on-surface-variant)',
                                 textAlign: 'center'
                               }}>
                                 {data.volume}
                               </div>
                               <div className="md-typescale-body-small" style={{
                                 color: 'var(--md-sys-color-on-surface-variant)',
                                 textAlign: 'center'
                               }}>
                                 {data.time}
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>

                   {/* Performance Alerts */}
                   {performanceAlerts.length > 0 && (
                     <div style={{ marginBottom: '24px' }}>
                       <h4 className="md-typescale-title-medium" style={{
                         color: 'var(--md-sys-color-on-surface)',
                         marginBottom: '16px'
                       }}>
                         ⚠️ Active Alerts
                       </h4>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {performanceAlerts.map((alert) => (
                           <div key={alert.id} className="md-filled-card" style={{
                             padding: '12px',
                             background: alert.severity === 'critical' ? 'var(--md-sys-color-error-container)' :
                                        alert.severity === 'high' ? 'var(--md-sys-color-tertiary-container)' :
                                        'var(--md-sys-color-secondary-container)',
                             border: '1px solid var(--md-sys-color-outline)'
                           }}>
                             <div className="md-typescale-body-medium" style={{ fontWeight: '500' }}>
                               {alert.message}
                             </div>
                             <div className="md-typescale-body-small" style={{
                               color: 'var(--md-sys-color-on-surface-variant)',
                               marginTop: '4px'
                             }}>
                               Severity: {alert.severity} • Type: {alert.alert_type} • {new Date(alert.created_at).toLocaleString()}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Performance Recommendations */}
                   {performanceRecommendations.length > 0 && (
                     <div>
                       <h4 className="md-typescale-title-medium" style={{
                         color: 'var(--md-sys-color-on-surface)',
                         marginBottom: '16px'
                       }}>
                         💡 Optimization Recommendations
                       </h4>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {performanceRecommendations.map((rec) => (
                           <div key={rec.id} className="md-filled-card" style={{
                             padding: '12px',
                             background: 'var(--md-sys-color-primary-container)',
                             border: '1px solid var(--md-sys-color-outline-variant)'
                           }}>
                             <div className="md-typescale-body-medium" style={{ fontWeight: '500' }}>
                               {rec.recommendation}
                             </div>
                             <div className="md-typescale-body-small" style={{
                               color: 'var(--md-sys-color-on-surface-variant)',
                               marginTop: '4px'
                             }}>
                               Priority: {rec.priority} • Impact: {rec.estimated_impact} • {new Date(rec.created_at).toLocaleString()}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </>
               )}
             </div>
           )}

           {/* Security Monitoring Tab */}
           {activeTab === 'security_monitoring' && (
            <div className="md-filled-card" style={{ padding: '24px' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '20px'
              }}>
                🔒 Security Monitoring & Audit Trails
              </h3>

              {/* Time Range Selector */}
              <div style={{ marginBottom: '24px' }}>
                <label className="md-typescale-body-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Time Range
                </label>
                <select
                  value={auditTimeRange}
                  onChange={(e) => setAuditTimeRange(parseInt(e.target.value))}
                  className="md-filled-text-field"
                  style={{
                    width: '200px',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--md-sys-shape-corner-medium)',
                    background: 'var(--md-sys-color-surface-container-highest)',
                    color: 'var(--md-sys-color-on-surface)'
                  }}
                >
                  <option value={1}>Last Hour</option>
                  <option value={24}>Last 24 Hours</option>
                  <option value={168}>Last 7 Days</option>
                  <option value={720}>Last 30 Days</option>
                </select>
              </div>

              {auditLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p className="md-typescale-body-medium">Loading audit data...</p>
                </div>
              ) : !auditData ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p className="md-typescale-body-medium">Unable to load audit data or insufficient permissions</p>
                </div>
              ) : (
                <>
                  {/* Audit Summary Cards */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '16px'
                    }}>
                      Audit Summary
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px'
                    }}>
                      <div className="md-filled-card" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-primary-container)'
                      }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Total Entries
                        </div>
                        <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                          {auditData.summary?.total_entries || 0}
                        </div>
                      </div>

                      <div className="md-filled-card" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-secondary-container)'
                      }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          High Risk Activities
                        </div>
                        <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                          {Object.values(auditData.summary?.by_audit_level || {}).reduce((sum, count) => {
                            return sum + (['HIGH', 'CRITICAL'].includes(count) ? 1 : 0);
                          }, 0)}
                        </div>
                      </div>

                      <div className="md-filled-card" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-tertiary-container)'
                      }}>
                        <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Compliance Flags
                        </div>
                        <div className="md-typescale-title-large" style={{ fontWeight: '600' }}>
                          {auditData.summary?.compliance_flags_count || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Alerts */}
                  {auditData.alerts && auditData.alerts.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 className="md-typescale-title-medium" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        marginBottom: '16px'
                      }}>
                        ⚠️ Security Alerts
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {auditData.alerts.map((alert, index) => (
                          <div key={index} className="md-filled-card" style={{
                            padding: '12px',
                            background: alert.severity === 'CRITICAL' ? 'var(--md-sys-color-error-container)' :
                                       alert.severity === 'HIGH' ? 'var(--md-sys-color-tertiary-container)' :
                                       'var(--md-sys-color-secondary-container)',
                            border: '1px solid var(--md-sys-color-outline)'
                          }}>
                            <div className="md-typescale-body-medium" style={{ fontWeight: '500' }}>
                              {alert.message}
                            </div>
                            <div className="md-typescale-body-small" style={{
                              color: 'var(--md-sys-color-on-surface-variant)',
                              marginTop: '4px'
                            }}>
                              Severity: {alert.severity} • Type: {alert.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Audit Entries */}
                  <div>
                    <h4 className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '16px'
                    }}>
                      Recent Audit Entries
                    </h4>
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {auditData.recent_entries && auditData.recent_entries.length > 0 ? (
                        auditData.recent_entries.map((entry) => (
                          <div key={entry.id} className="md-list-item" style={{
                            padding: '12px',
                            background: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 'var(--md-sys-shape-corner-medium)',
                            border: '1px solid var(--md-sys-color-outline-variant)'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div className="md-typescale-title-small" style={{
                                  color: 'var(--md-sys-color-on-surface)',
                                  fontWeight: '600'
                                }}>
                                  {entry.operation} on {entry.model}
                                </div>
                                <div style={{
                                  padding: '2px 6px',
                                  borderRadius: 'var(--md-sys-shape-corner-small)',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  background: entry.audit_level === 'CRITICAL' ? 'var(--md-sys-color-error-container)' :
                                            entry.audit_level === 'HIGH' ? 'var(--md-sys-color-tertiary-container)' :
                                            entry.audit_level === 'MEDIUM' ? 'var(--md-sys-color-secondary-container)' :
                                            'var(--md-sys-color-primary-container)',
                                  color: entry.audit_level === 'CRITICAL' ? 'var(--md-sys-color-on-error-container)' :
                                        entry.audit_level === 'HIGH' ? 'var(--md-sys-color-on-tertiary-container)' :
                                        entry.audit_level === 'MEDIUM' ? 'var(--md-sys-color-on-secondary-container)' :
                                        'var(--md-sys-color-on-primary-container)'
                                }}>
                                  {entry.audit_level}
                                </div>
                              </div>
                              <div className="md-typescale-body-small" style={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                                marginBottom: '4px'
                              }}>
                                User: {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                              </div>
                              {entry.compliance_flags && entry.compliance_flags.length > 0 && (
                                <div className="md-typescale-body-small" style={{
                                  color: 'var(--md-sys-color-tertiary)',
                                  fontWeight: '500'
                                }}>
                                  Compliance: {entry.compliance_flags.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: 'var(--md-sys-color-on-surface-variant)'
                        }}>
                          <p className="md-typescale-body-medium">No audit entries found for the selected time range</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat Support Tab */}
          {activeTab === 'chat_support' && (
            <Suspense fallback={
              <div className="md-filled-card" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Loading chat support...
                </div>
              </div>
            }>
              <ChatSupportSection />
            </Suspense>
          )}

          {/* Cash Drawer Tab */}
          {activeTab === 'cash_drawer' && (
            <div className="md-elevated-card md-animate-slide-in-right" style={{ animationDelay: '200ms' }}>
              <h3 className="md-typescale-title-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '24px'
              }}>
                💰 Cash Drawer Management
              </h3>

              {/* Current Drawer Status */}
              <div style={{ marginBottom: '24px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Current Status
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div className="md-filled-card" style={{
                    padding: '16px',
                    background: currentDrawer?.status === 'open' ? 'var(--md-sys-color-tertiary-container)' : 'var(--md-sys-color-surface-container-high)'
                  }}>
                    <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Status
                    </div>
                    <div className="md-typescale-title-medium" style={{
                      color: currentDrawer?.status === 'open' ? 'var(--md-sys-color-on-tertiary-container)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: '600'
                    }}>
                      {currentDrawer?.status || 'No Active Drawer'}
                    </div>
                  </div>

                  <div className="md-filled-card" style={{ padding: '16px' }}>
                    <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Current Balance
                    </div>
                    <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                      {currentDrawer ? formatCurrencyGHS(currentDrawer.current_balance) : 'N/A'}
                    </div>
                  </div>

                  <div className="md-filled-card" style={{ padding: '16px' }}>
                    <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Opening Balance
                    </div>
                    <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                      {currentDrawer ? formatCurrencyGHS(currentDrawer.opening_balance) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Actions */}
              <div style={{ marginBottom: '24px' }}>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Actions
                </h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {!currentDrawer || currentDrawer.status === 'closed' ? (
                    <button
                      onClick={() => setShowOpenDrawer(true)}
                      className="md-filled-button md-ripple"
                      style={{
                        background: 'var(--md-sys-color-primary)',
                        color: 'var(--md-sys-color-on-primary)'
                      }}
                    >
                      Open Cash Drawer
                    </button>
                  ) : currentDrawer.status === 'open' ? (
                    <>
                      <button
                        onClick={() => setShowCloseDrawer(true)}
                        className="md-filled-button md-ripple"
                        style={{
                          background: 'var(--md-sys-color-error)',
                          color: 'var(--md-sys-color-on-error)'
                        }}
                      >
                        Close Cash Drawer
                      </button>
                      <button
                        onClick={() => setShowReconcile(true)}
                        className="md-outlined-button md-ripple"
                      >
                        Reconcile
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '16px'
                }}>
                  Recent Cash Transactions
                </h4>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Placeholder for cash transactions */}
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--md-sys-color-on-surface-variant)'
                  }}>
                    <p className="md-typescale-body-medium">No cash transactions yet</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Transactions */}
          <div className="md-elevated-card md-animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            <h4 className="md-typescale-title-medium" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '16px'
            }}>
               Recent Transactions
            </h4>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {(transactions || []).length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--md-sys-color-on-surface-variant)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
                  <p className="md-typescale-body-medium">No transactions yet</p>
                </div>
              ) : (
                (transactions || []).slice(0, 10).map((transaction, index) => (
                  <div key={transaction.id || index} className="md-list-item" style={{
                    padding: '12px',
                    background: 'var(--md-sys-color-surface-container-low)',
                    borderRadius: 'var(--md-sys-shape-corner-medium)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div className="md-typescale-title-small" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        marginBottom: '4px'
                      }}>
                        {transaction.type}
                      </div>
                      <div className="md-typescale-body-small" style={{
                        color: 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="md-typescale-title-small" style={{
                      fontWeight: '600',
                      color: transaction.amount >= 0 
                        ? 'var(--md-sys-color-secondary)' 
                        : 'var(--md-sys-color-error)'
                    }}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrencyGHS(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="md-elevated-card md-animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            <h4 className="md-typescale-title-medium" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '16px'
            }}>
               Notifications
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { message: 'Cash drawer needs reconciliation', type: 'warning' },
                { message: '2 transactions pending manager approval', type: 'info' },
                { message: 'System maintenance at 10 PM', type: 'info' }
              ].map((notification, index) => (
                <div key={index} className="md-filled-card" style={{
                  padding: '12px',
                  background: notification.type === 'warning' 
                    ? 'var(--md-sys-color-tertiary-container)' 
                    : 'var(--md-sys-color-primary-container)',
                  color: notification.type === 'warning' 
                    ? 'var(--md-sys-color-on-tertiary-container)' 
                    : 'var(--md-sys-color-on-primary-container)'
                }}>
                  <p className="md-typescale-body-small">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Open Cash Drawer Modal */}
      {showOpenDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="md-elevated-card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px'
          }}>
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '20px'
            }}>
              Open Cash Drawer
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Opening Balance (GHS)
              </label>
              <input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 className="md-typescale-title-medium" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '12px'
              }}>
                Opening Denominations
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(denominations).map(([denom, count]) => (
                  <div key={denom}>
                    <label style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      fontSize: '12px',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      GHS {denom}
                    </label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setDenominations(prev => ({
                        ...prev,
                        [denom]: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--md-sys-color-outline)',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowOpenDrawer(false);
                  setOpeningBalance('');
                  setDenominations({
                    '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
                    '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                  });
                }}
                className="md-outlined-button md-ripple"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!openingBalance || parseFloat(openingBalance) <= 0) {
                    showMessage('error', 'Please enter a valid opening balance');
                    return;
                  }

                  setDrawerLoading(true);
                  try {
                    const response = await api.post('banking/cash-drawers/open/', {
                      opening_balance: parseFloat(openingBalance),
                      opening_denominations: denominations
                    });

                    showMessage('success', 'Cash drawer opened successfully');
                    setShowOpenDrawer(false);
                    setOpeningBalance('');
                    setDenominations({
                      '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
                      '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                    });
                    await fetchCashDrawers();
                  } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Failed to open cash drawer';
                    showMessage('error', `Error: ${errorMessage}`);
                  } finally {
                    setDrawerLoading(false);
                  }
                }}
                disabled={drawerLoading}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)'
                }}
              >
                {drawerLoading ? 'Opening...' : 'Open Drawer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Cash Drawer Modal */}
      {showCloseDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="md-elevated-card" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '24px'
          }}>
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '20px'
            }}>
              Close Cash Drawer
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Actual Closing Balance (GHS)
              </label>
              <input
                type="number"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0.00"
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 className="md-typescale-title-medium" style={{
                color: 'var(--md-sys-color-on-surface)',
                marginBottom: '12px'
              }}>
                Closing Denominations
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                {Object.entries(denominations).map(([denom, count]) => (
                  <div key={denom}>
                    <label style={{
                      color: 'var(--md-sys-color-on-surface-variant)',
                      fontSize: '12px',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      GHS {denom}
                    </label>
                    <input
                      type="number"
                      value={count}
                      onChange={(e) => setDenominations(prev => ({
                        ...prev,
                        [denom]: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--md-sys-color-outline)',
                        borderRadius: 'var(--md-sys-shape-corner-small)',
                        background: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCloseDrawer(false);
                  setClosingBalance('');
                  setDenominations({
                    '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
                    '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                  });
                }}
                className="md-outlined-button md-ripple"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!closingBalance || parseFloat(closingBalance) < 0) {
                    showMessage('error', 'Please enter a valid closing balance');
                    return;
                  }

                  setDrawerLoading(true);
                  try {
                    const response = await api.post(`banking/cash-drawers/${currentDrawer.id}/close/`, {
                      closing_balance: parseFloat(closingBalance),
                      closing_denominations: denominations
                    });

                    showMessage('success', 'Cash drawer closed successfully');
                    setShowCloseDrawer(false);
                    setClosingBalance('');
                    setDenominations({
                      '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
                      '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
                    });
                    await fetchCashDrawers();
                  } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Failed to close cash drawer';
                    showMessage('error', `Error: ${errorMessage}`);
                  } finally {
                    setDrawerLoading(false);
                  }
                }}
                disabled={drawerLoading}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-error)',
                  color: 'var(--md-sys-color-on-error)'
                }}
              >
                {drawerLoading ? 'Closing...' : 'Close Drawer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="md-elevated-card" style={{
            width: '90%',
            maxWidth: '600px',
            padding: '24px'
          }}>
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '20px'
            }}>
              Generate New Report
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Report Template
              </label>
              <select
                value={selectedReportTemplate}
                onChange={(e) => setSelectedReportTemplate(e.target.value)}
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              >
                <option value="">Select a template...</option>
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.template_type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Report Date
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowGenerateReport(false);
                  setSelectedReportTemplate('');
                  setReportDate(new Date().toISOString().split('T')[0]);
                }}
                className="md-outlined-button md-ripple"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedReportTemplate) {
                    showMessage('error', 'Please select a report template');
                    return;
                  }

                  setReportsLoading(true);
                  try {
                    const response = await api.post('reports/reports/generate/', {
                      template_id: selectedReportTemplate,
                      report_date: reportDate,
                      filters: reportFilters
                    });

                    showMessage('success', 'Report generation started successfully');
                    setShowGenerateReport(false);
                    setSelectedReportTemplate('');
                    setReportDate(new Date().toISOString().split('T')[0]);
                    await fetchReports();
                  } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Failed to generate report';
                    showMessage('error', `Error: ${errorMessage}`);
                  } finally {
                    setReportsLoading(false);
                  }
                }}
                disabled={reportsLoading || !selectedReportTemplate}
                className="md-filled-button md-ripple"
                style={{
                  background: (!selectedReportTemplate)
                    ? 'var(--md-sys-color-surface-container-high)'
                    : 'var(--md-sys-color-primary)',
                  color: (!selectedReportTemplate)
                    ? 'var(--md-sys-color-on-surface-variant)'
                    : 'var(--md-sys-color-on-primary)',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  fontWeight: '600',
                  cursor: (!selectedReportTemplate) ? 'not-allowed' : 'pointer'
                }}
              >
                {reportsLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {showCreateSchedule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="md-elevated-card" style={{
            width: '90%',
            maxWidth: '600px',
            padding: '24px'
          }}>
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '20px'
            }}>
              Create Report Schedule
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Schedule Name
              </label>
              <input
                type="text"
                placeholder="Enter schedule name"
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Report Template
              </label>
              <select
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              >
                <option value="">Select a template...</option>
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.template_type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="md-typescale-body-large" style={{
                color: 'var(--md-sys-color-on-surface)',
                display: 'block',
                marginBottom: '8px'
              }}>
                Frequency
              </label>
              <select
                className="md-filled-text-field"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateSchedule(false)}
                className="md-outlined-button md-ripple"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Implementation for creating schedule
                  showMessage('success', 'Schedule creation feature coming soon');
                  setShowCreateSchedule(false);
                }}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-secondary)',
                  color: 'var(--md-sys-color-on-secondary)'
                }}
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {showReconcile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="md-elevated-card" style={{
            width: '90%',
            maxWidth: '600px',
            padding: '24px'
          }}>
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '20px'
            }}>
              Reconcile Cash Drawer
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Expected Balance
                </div>
                <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                  {currentDrawer ? formatCurrencyGHS(currentDrawer.expected_balance) : 'N/A'}
                </div>
              </div>

              <div className="md-filled-card" style={{ padding: '16px', marginBottom: '16px' }}>
                <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Actual Balance
                </div>
                <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                  {currentDrawer ? formatCurrencyGHS(currentDrawer.actual_balance || currentDrawer.current_balance) : 'N/A'}
                </div>
              </div>

              <div className="md-filled-card" style={{
                padding: '16px',
                background: Math.abs((currentDrawer?.actual_balance || currentDrawer?.current_balance || 0) - (currentDrawer?.expected_balance || 0)) > 0.01
                  ? 'var(--md-sys-color-error-container)'
                  : 'var(--md-sys-color-secondary-container)'
              }}>
                <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Variance
                </div>
                <div className="md-typescale-title-medium" style={{ fontWeight: '600' }}>
                  {currentDrawer ? formatCurrencyGHS(currentDrawer.variance) : 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReconcile(false)}
                className="md-outlined-button md-ripple"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDrawerLoading(true);
                  try {
                    const response = await api.post('banking/cash-reconciliations/', {
                      cash_drawer_id: currentDrawer.id
                    });

                    showMessage('success', 'Cash reconciliation completed successfully');
                    setShowReconcile(false);
                    await fetchCashDrawers();
                  } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Failed to reconcile cash drawer';
                    showMessage('error', `Error: ${errorMessage}`);
                  } finally {
                    setDrawerLoading(false);
                  }
                }}
                disabled={drawerLoading}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-secondary)',
                  color: 'var(--md-sys-color-on-secondary)'
                }}
              >
                {drawerLoading ? 'Reconciling...' : 'Complete Reconciliation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="md-elevated-card" style={{
            width: '90%',
            maxWidth: '600px',
            padding: '24px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '20px'
            }}>
              ⌨️ Keyboard Shortcuts
            </h3>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '12px'
                }}>
                  Navigation
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Switch to Overview</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+O</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Switch to Deposit</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+D</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Switch to Withdrawal</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+W</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Switch to Check Deposit</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+C</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Direct tab navigation</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>1-9</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="md-typescale-title-medium" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '12px'
                }}>
                  Actions
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Toggle Filters</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+F</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Focus Search</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Ctrl+/</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <span className="md-typescale-body-medium">Close Modal/Dialog</span>
                    <kbd style={{ background: 'var(--md-sys-color-surface-container-high)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Escape</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="md-filled-button md-ripple"
                style={{
                  background: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)'
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div className="screen-reader-only" aria-live="polite" aria-atomic="true">
        {announcements.map(announcement => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
      </div>
    </ErrorBoundary>
  );
}

export default CashierDashboard;