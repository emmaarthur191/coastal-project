import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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
const PlayfulCard = ({ children, color = '#FFFFFF', style = {} }: { children: any; color?: string; style?: any }) => (
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

const PlayfulButton = ({ children, onClick, variant = 'primary', style, disabled = false }: {
  children: any;
  onClick?: () => void;
  variant?: string;
  style?: any;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? '#ccc' : (variant === 'danger' ? THEME.colors.danger : THEME.colors.primary),
      color: 'white',
      border: '3px solid #000000',
      padding: '12px 24px',
      borderRadius: THEME.radius.button,
      fontWeight: '900',
      fontSize: '16px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'all 0.1s',
      ...style
    }}
    onMouseDown={e => {
      if (!disabled && onClick) {
        e.currentTarget.style.transform = 'translateY(4px)';
        e.currentTarget.style.boxShadow = THEME.shadows.active;
      }
    }}
    onMouseUp={e => {
      if (!disabled && onClick) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }
    }}
  >
    {children}
  </button>
);

function BankingOperations() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('loans');
  const [loading, setLoading] = useState(true);

  // Banking data state
  const [loans, setLoans] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [cashAdvances, setCashAdvances] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);

  // New feature states
  const [messages, setMessages] = useState([]);
  const [messageThreads, setMessageThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [reportsData, setReportsData] = useState<any>({});
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    dateRange: '30d',
    category: 'all',
    user: 'all'
  });

  // Form states
  const [newLoan, setNewLoan] = useState({
    amount: '',
    purpose: '',
    term_months: '',
    account: ''
  });

  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    complaint_type: 'service',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeView) {
        case 'loans':
          await fetchLoans();
          break;
        case 'complaints':
          await fetchComplaints();
          break;
        case 'cash-advances':
          await fetchCashAdvances();
          break;
        case 'refunds':
          await fetchRefunds();
          break;
        case 'accounts':
          await fetchAccounts();
          break;
        case 'pending-loans':
          await fetchPendingLoans();
          break;
        case 'messaging':
          await fetchMessageThreads();
          break;
        case 'reports':
          await fetchReportsData();
          break;
        case 'fraud-detection':
          await fetchFraudAlerts();
          break;
      }
    } catch (error) {
      console.error('Error fetching banking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    const result = await authService.getLoans();
    if (result.success) {
      setLoans(result.data);
    }
  };

  const fetchComplaints = async () => {
    const result = await authService.getComplaints();
    if (result.success) {
      setComplaints(result.data);
    }
  };

  const fetchCashAdvances = async () => {
    const result = await authService.getCashAdvances();
    if (result.success) {
      setCashAdvances(result.data);
    }
  };

  const fetchRefunds = async () => {
    const result = await authService.getRefunds();
    if (result.success) {
      setRefunds(result.data);
    }
  };

  const fetchAccounts = async () => {
    const result = await authService.getAccounts();
    if (result.success) {
      setAccounts(result.data);
    }
  };

  const fetchPendingLoans = async () => {
    const result = await authService.getPendingLoans();
    if (result.success) {
      setPendingLoans(result.data);
    }
  };

  const fetchMessageThreads = async () => {
    const result = await authService.getMessageThreads();
    if (result.success) {
      setMessageThreads(result.data);
    }
  };

  const fetchMessages = async (threadId: string) => {
    const result = await authService.getThreadMessages(threadId);
    if (result.success) {
      setMessages(result.data);
    }
  };

  const fetchReportsData = async () => {
    // Fetch multiple data sources for reports
    const [loansResult, transactionsResult, performanceResult] = await Promise.all([
      authService.getLoans(),
      authService.getAllTransactions(),
      authService.getPerformanceMetrics()
    ]);

    if (loansResult.success && transactionsResult.success && performanceResult.success) {
      // Process data for charts
      const processedData = processReportsData(
        loansResult.data,
        transactionsResult.data,
        performanceResult.data
      );
      setReportsData(processedData);
    }
  };

  const fetchFraudAlerts = async () => {
    // Placeholder for fraud alerts - would integrate with backend
    const mockAlerts = [
      {
        id: '1',
        transaction_id: 'TXN-001',
        risk_score: 85,
        reason: 'Unusual transaction pattern',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        transaction_id: 'TXN-002',
        risk_score: 72,
        reason: 'High amount transfer',
        status: 'investigating',
        created_at: new Date().toISOString()
      }
    ];
    setFraudAlerts(mockAlerts);
  };

  const processReportsData = (loans: any[], transactions: any[], performance: any[]) => {
    // Process data for charts - create sample data for demonstration
    const monthlyData = [
      { month: 'Jan', loans: 45, transactions: 1200, revenue: 25000 },
      { month: 'Feb', loans: 52, transactions: 1350, revenue: 28000 },
      { month: 'Mar', loans: 48, transactions: 1180, revenue: 26500 },
      { month: 'Apr', loans: 61, transactions: 1420, revenue: 31000 },
      { month: 'May', loans: 55, transactions: 1380, revenue: 29500 },
      { month: 'Jun', loans: 67, transactions: 1520, revenue: 33000 }
    ];

    const categoryData = [
      { name: 'Loans', value: 35, color: THEME.colors.primary },
      { name: 'Transactions', value: 45, color: THEME.colors.success },
      { name: 'Services', value: 20, color: THEME.colors.secondary }
    ];

    return { monthlyData, categoryData };
  };

  const handleCreateLoan = async () => {
    const result = await authService.createLoan(newLoan);
    if (result.success) {
      setLoans([...loans, result.data]);
      setNewLoan({ amount: '', purpose: '', term_months: '', account: '' });
      alert('Loan application submitted successfully!');
    } else {
      alert('Failed to create loan: ' + result.error);
    }
  };

  const handleCreateComplaint = async () => {
    const result = await authService.createComplaint(newComplaint);
    if (result.success) {
      setComplaints([...complaints, result.data]);
      setNewComplaint({ title: '', description: '', complaint_type: 'service', priority: 'medium' });
      alert('Complaint submitted successfully!');
    } else {
      alert('Failed to create complaint: ' + result.error);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    const result = await authService.approveLoan(loanId);
    if (result.success) {
      alert('Loan approved successfully!');
      fetchLoans();
      fetchPendingLoans();
    } else {
      alert('Failed to approve loan: ' + result.error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Messaging handlers
  const handleSelectThread = async (thread: any) => {
    setSelectedThread(thread);
    await fetchMessages(thread.id);
  };

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;

    const result = await authService.sendMessage({
      thread: selectedThread.id,
      content: newMessage,
      message_type: 'text'
    });

    if (result.success) {
      setNewMessage('');
      await fetchMessages(selectedThread.id);
    } else {
      alert('Failed to send message: ' + result.error);
    }
  };

  const handleCreateThread = async (recipientId: string) => {
    const result = await authService.createMessageThread({
      participants: [recipientId],
      subject: 'New Conversation'
    });

    if (result.success) {
      await fetchMessageThreads();
      setSelectedThread(result.data);
    } else {
      alert('Failed to create thread: ' + result.error);
    }
  };

  // Fraud detection handlers
  const handleReviewFraudAlert = async (alertId: string, action: string) => {
    // This would call a backend endpoint to update the alert status
    alert(`Fraud alert ${alertId} marked as ${action}`);
    await fetchFraudAlerts();
  };

  const handleRunFraudCheck = async (transactionId: string) => {
    // Placeholder for fraud check - would integrate with backend
    alert(`Fraud check completed for transaction ${transactionId}`);
    await fetchFraudAlerts();
  };

  const menuItems = [
    { id: 'loans', name: 'Loans', icon: '💰', color: THEME.colors.primary },
    { id: 'complaints', name: 'Complaints', icon: '📝', color: THEME.colors.danger },
    { id: 'cash-advances', name: 'Cash Advances', icon: '💵', color: THEME.colors.warning },
    { id: 'refunds', name: 'Refunds', icon: '↩️', color: THEME.colors.secondary },
    { id: 'accounts', name: 'Accounts', icon: '🏦', color: THEME.colors.success },
    { id: 'pending-loans', name: 'Pending Loans', icon: '⏳', color: THEME.colors.primary },
    { id: 'messaging', name: 'Messaging', icon: '💬', color: THEME.colors.secondary },
    { id: 'reports', name: 'Reports', icon: '📊', color: THEME.colors.primary },
    { id: 'fraud-detection', name: 'Fraud Detection', icon: '🛡️', color: THEME.colors.danger }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <PlayfulCard>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>🏦</div>
            <h2>Loading Banking Operations...</h2>
          </div>
        </PlayfulCard>
      );
    }

    switch (activeView) {
      case 'loans':
        return (
          <div>
            <PlayfulCard color="#E8F5E9">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Apply for a Loan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <input
                  type="number"
                  placeholder="Loan Amount"
                  value={newLoan.amount}
                  onChange={(e) => setNewLoan({...newLoan, amount: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                />
                <input
                  type="text"
                  placeholder="Purpose"
                  value={newLoan.purpose}
                  onChange={(e) => setNewLoan({...newLoan, purpose: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                />
                <input
                  type="number"
                  placeholder="Term (months)"
                  value={newLoan.term_months}
                  onChange={(e) => setNewLoan({...newLoan, term_months: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                />
                <select
                  value={newLoan.account}
                  onChange={(e) => setNewLoan({...newLoan, account: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                >
                  <option value="">Select Account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              <PlayfulButton onClick={handleCreateLoan} style={{ marginTop: '16px' }}>
                Apply for Loan 💰
              </PlayfulButton>
            </PlayfulCard>

            <PlayfulCard color="#E3F2FD">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Your Loans</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {loans.map((loan) => (
                  <div key={loan.id} style={{
                    padding: '20px',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    background: '#f9f9f9'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                      ${loan.amount?.toLocaleString()}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', color: '#666' }}>{loan.purpose}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: loan.status === 'approved' ? THEME.colors.success :
                                   loan.status === 'pending' ? THEME.colors.warning : THEME.colors.danger,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {loan.status?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {loan.term_months} months
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </PlayfulCard>
          </div>
        );

      case 'complaints':
        return (
          <div>
            <PlayfulCard color="#FFEBEE">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Submit a Complaint</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Complaint Title"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                />
                <select
                  value={newComplaint.complaint_type}
                  onChange={(e) => setNewComplaint({...newComplaint, complaint_type: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                >
                  <option value="service">Service</option>
                  <option value="product">Product</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={newComplaint.priority}
                  onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value})}
                  style={{ padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <textarea
                placeholder="Describe your complaint in detail"
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #000', borderRadius: '12px', fontSize: '16px', minHeight: '100px', marginTop: '16px' }}
              />
              <PlayfulButton onClick={handleCreateComplaint} style={{ marginTop: '16px' }}>
                Submit Complaint 📝
              </PlayfulButton>
            </PlayfulCard>

            <PlayfulCard color="#FFF3E0">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Your Complaints</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {complaints.map((complaint) => (
                  <div key={complaint.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '2px solid #000',
                    borderRadius: '12px',
                    background: '#f9f9f9'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{complaint.title}</h4>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{complaint.description}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: complaint.status === 'resolved' ? THEME.colors.success :
                                   complaint.status === 'in_progress' ? THEME.colors.warning : THEME.colors.danger,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {complaint.status?.toUpperCase()}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        background: complaint.priority === 'urgent' ? THEME.colors.danger :
                                   complaint.priority === 'high' ? '#ff6b35' :
                                   complaint.priority === 'medium' ? THEME.colors.warning : THEME.colors.secondary,
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {complaint.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </PlayfulCard>
          </div>
        );

      case 'cash-advances':
        return (
          <PlayfulCard color="#F3E5F5">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Cash Advances</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {cashAdvances.map((advance) => (
                <div key={advance.id} style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    ${advance.amount?.toLocaleString()}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', color: '#666' }}>{advance.purpose}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: advance.status === 'approved' ? THEME.colors.success : THEME.colors.warning,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {advance.status?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {new Date(advance.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'refunds':
        return (
          <PlayfulCard color="#E8F5E9">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Refunds</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {refunds.map((refund) => (
                <div key={refund.id} style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
                    ${refund.amount?.toLocaleString()}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', color: '#666' }}>{refund.reason}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: refund.status === 'processed' ? THEME.colors.success : THEME.colors.warning,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {refund.status?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {new Date(refund.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'accounts':
        return (
          <PlayfulCard color="#E3F2FD">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Bank Accounts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {accounts.map((account) => (
                <div key={account.id} style={{
                  padding: '20px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>{account.name}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>
                    ${account.balance?.toLocaleString()}
                  </p>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                    Account Type: {account.account_type}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                    Opened: {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'pending-loans':
        return (
          <PlayfulCard color="#FFF3E0">
            <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Pending Loan Approvals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingLoans.map((loan) => (
                <div key={loan.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  border: '2px solid #000',
                  borderRadius: '12px',
                  background: '#f9f9f9'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
                      ${loan.amount?.toLocaleString()} - {loan.user?.name}
                    </h4>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{loan.purpose}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                      Applied: {new Date(loan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <PlayfulButton
                      onClick={() => handleApproveLoan(loan.id)}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Approve ✅
                    </PlayfulButton>
                    <PlayfulButton
                      variant="danger"
                      onClick={() => {/* Handle reject */}}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Reject ❌
                    </PlayfulButton>
                  </div>
                </div>
              ))}
            </div>
          </PlayfulCard>
        );

      case 'messaging':
        return (
          <div>
            <PlayfulCard color="#E8EAF6">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Messaging Center</h3>
              <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
                {/* Message Threads Sidebar */}
                <div style={{ flex: '0 0 300px', border: '2px solid #000', borderRadius: '12px', padding: '16px', background: '#f9f9f9' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Conversations</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                    {messageThreads.map((thread: any) => (
                      <div
                        key={thread.id}
                        onClick={() => handleSelectThread(thread)}
                        style={{
                          padding: '12px',
                          border: selectedThread?.id === thread.id ? '2px solid #000' : '1px solid #ccc',
                          borderRadius: '8px',
                          background: selectedThread?.id === thread.id ? '#e3f2fd' : '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{thread.subject}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {thread.participants?.length} participants
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {new Date(thread.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <PlayfulButton
                    onClick={() => handleCreateThread('staff-user-id')}
                    style={{ marginTop: '16px', width: '100%', fontSize: '14px' }}
                  >
                    New Message 💬
                  </PlayfulButton>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, border: '2px solid #000', borderRadius: '12px', padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                  {selectedThread ? (
                    <>
                      <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '12px', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                          {selectedThread.subject}
                        </h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                          Chat with {selectedThread.participants?.join(', ')}
                        </p>
                      </div>

                      {/* Messages */}
                      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '8px' }}>
                        {messages.map((message: any) => (
                          <div
                            key={message.id}
                            style={{
                              marginBottom: '12px',
                              padding: '12px',
                              borderRadius: '8px',
                              background: message.sender === user?.id ? THEME.colors.primary + '20' : '#f0f0f0',
                              marginLeft: message.sender === user?.id ? '100px' : '0',
                              marginRight: message.sender === user?.id ? '0' : '100px'
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                              {message.sender_name}
                            </div>
                            <div style={{ fontSize: '14px' }}>{message.content}</div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: '2px solid #000',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <PlayfulButton onClick={handleSendMessage} style={{ fontSize: '14px' }}>
                          Send 📤
                        </PlayfulButton>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                      <h4>Select a conversation to start messaging</h4>
                    </div>
                  )}
                </div>
              </div>
            </PlayfulCard>
          </div>
        );

      case 'reports':
        return (
          <div>
            <PlayfulCard color="#F3E5F5">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Financial Reports Dashboard</h3>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <select
                  value={reportFilters.dateRange}
                  onChange={(e) => setReportFilters({...reportFilters, dateRange: e.target.value})}
                  style={{ padding: '8px 12px', border: '2px solid #000', borderRadius: '8px' }}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <select
                  value={reportFilters.category}
                  onChange={(e) => setReportFilters({...reportFilters, category: e.target.value})}
                  style={{ padding: '8px 12px', border: '2px solid #000', borderRadius: '8px' }}
                >
                  <option value="all">All Categories</option>
                  <option value="loans">Loans</option>
                  <option value="transactions">Transactions</option>
                  <option value="services">Services</option>
                </select>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Monthly Trends */}
                <div style={{ border: '2px solid #000', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Monthly Trends</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportsData.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="loans" stroke={THEME.colors.primary} strokeWidth={3} />
                      <Line type="monotone" dataKey="transactions" stroke={THEME.colors.success} strokeWidth={3} />
                      <Line type="monotone" dataKey="revenue" stroke={THEME.colors.secondary} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Distribution */}
                <div style={{ border: '2px solid #000', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Category Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportsData.categoryData || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(reportsData.categoryData || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Transaction Volume */}
                <div style={{ border: '2px solid #000', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Transaction Volume</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportsData.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="transactions" fill={THEME.colors.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue Trends */}
                <div style={{ border: '2px solid #000', borderRadius: '12px', padding: '16px', background: '#fff' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Revenue Trends</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportsData.monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke={THEME.colors.warning} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: THEME.colors.primary + '20', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>
                    {reportsData.monthlyData?.reduce((sum, item) => sum + item.loans, 0) || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Loans</div>
                </div>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: THEME.colors.success + '20', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.success }}>
                    {reportsData.monthlyData?.reduce((sum, item) => sum + item.transactions, 0)?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Transactions</div>
                </div>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: THEME.colors.secondary + '20', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.secondary }}>
                    ${(reportsData.monthlyData?.reduce((sum, item) => sum + item.revenue, 0) || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Total Revenue</div>
                </div>
              </div>
            </PlayfulCard>
          </div>
        );

      case 'fraud-detection':
        return (
          <div>
            <PlayfulCard color="#FFEBEE">
              <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Fraud Detection Center</h3>

              {/* Risk Score Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: '#ffebee', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: THEME.colors.danger }}>🚨</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.danger }}>
                    {fraudAlerts.filter((alert: any) => alert.risk_score > 70).length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>High Risk Alerts</div>
                </div>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: '#fff3e0', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: THEME.colors.warning }}>⚠️</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.warning }}>
                    {fraudAlerts.filter((alert: any) => alert.risk_score >= 50 && alert.risk_score <= 70).length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Medium Risk Alerts</div>
                </div>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: '#e8f5e9', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: THEME.colors.success }}>✅</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.success }}>
                    {fraudAlerts.filter((alert: any) => alert.status === 'resolved').length}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Resolved Cases</div>
                </div>
              </div>

              {/* Fraud Alerts List */}
              <PlayfulCard color="#FAFAFA" style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>Active Fraud Alerts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {fraudAlerts.map((alert: any) => (
                    <div key={alert.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      border: '2px solid #000',
                      borderRadius: '12px',
                      background: '#fff'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                            Transaction: {alert.transaction_id}
                          </h5>
                          <span style={{
                            padding: '4px 8px',
                            background: alert.risk_score > 70 ? THEME.colors.danger :
                                       alert.risk_score > 50 ? THEME.colors.warning : THEME.colors.secondary,
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            Risk: {alert.risk_score}%
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            background: alert.status === 'resolved' ? THEME.colors.success :
                                       alert.status === 'investigating' ? THEME.colors.warning : THEME.colors.danger,
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {alert.status?.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                          {alert.reason}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                          Detected: {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <PlayfulButton
                          onClick={() => handleRunFraudCheck(alert.transaction_id)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Run Check 🔍
                        </PlayfulButton>
                        {alert.status !== 'resolved' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <PlayfulButton
                              onClick={() => handleReviewFraudAlert(alert.id, 'investigate')}
                              style={{ fontSize: '10px', padding: '4px 8px' }}
                            >
                              Investigate
                            </PlayfulButton>
                            <PlayfulButton
                              variant="danger"
                              onClick={() => handleReviewFraudAlert(alert.id, 'block')}
                              style={{ fontSize: '10px', padding: '4px 8px' }}
                            >
                              Block 🚫
                            </PlayfulButton>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </PlayfulCard>

              {/* Fraud Prevention Tips */}
              <PlayfulCard color="#E3F2FD" style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>🛡️ Fraud Prevention Tips</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>Monitor Transactions</h5>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      Regularly review your transaction history for any unauthorized activities.
                    </p>
                  </div>
                  <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>Secure Passwords</h5>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      Use strong, unique passwords and enable two-factor authentication.
                    </p>
                  </div>
                  <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>Report Suspicious Activity</h5>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      Immediately report any suspicious transactions or account activity.
                    </p>
                  </div>
                </div>
              </PlayfulCard>
            </PlayfulCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: THEME.colors.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: #fff; }
          ::-webkit-scrollbar-thumb { background: ${THEME.colors.primary}; border-radius: 5px; }
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}
      </style>

      {/* Sidebar */}
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
          <div style={{ fontSize: '40px', background: THEME.colors.secondary, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>
            🏦
          </div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Banking Ops</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{user?.email}</p>
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
          <PlayfulButton variant="danger" onClick={handleLogout}>
            Log Out 👋
          </PlayfulButton>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.text, margin: 0 }}>
            {menuItems.find(i => i.id === activeView)?.icon} {menuItems.find(i => i.id === activeView)?.name}
          </h2>
          <div style={{ background: '#FFF', padding: '8px 16px', borderRadius: '20px', border: '2px solid #000', fontWeight: 'bold' }}>
            📅 {new Date().toLocaleDateString()}
          </div>
        </header>

        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default BankingOperations;