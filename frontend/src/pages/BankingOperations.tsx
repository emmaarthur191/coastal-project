import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService as authService, LoanExtended as Loan, MessageThreadExtended } from '../services/api';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Complaint } from '../api/models/Complaint';
import { CashAdvance } from '../api/models/CashAdvance';
import { Refund } from '../api/models/Refund';
import { Account } from '../api/models/Account';
import { FraudAlert } from '../api/models/FraudAlert';
import { Priority5f3Enum } from '../api/models/Priority5f3Enum';

// Modular Components
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SecurityOversight from '../components/operational/SecurityOversight';
import OperationalOverview from '../components/operational/OperationalOverview';
import OperationalMessenger from '../components/operational/OperationalMessenger';
import OperationalReports, { ReportParams } from '../components/operational/OperationalReports';
import AdministrativeHub from '../components/operational/AdministrativeHub';

interface ExtendedFraudAlert extends FraudAlert {
  transaction_id?: string;
}

interface ExtendedMessage {
  id: string | number;
  content: string;
  is_me: boolean;
  sender_name?: string;
  created_at: string;
}

interface ReportsData {
  monthlyData: any[];
  categoryData: any[];
}

function BankingOperations() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('loans');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Banking data state
  const [loans, setLoans] = useState<Loan[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);

  // Messaging state
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThreadExtended[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThreadExtended | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Reports & Analytics state
  const [reportsData, setReportsData] = useState<Partial<ReportsData>>({});
  const [reportParams, setReportParams] = useState<ReportParams>({
    type: 'transactions',
    format: 'pdf',
    date_from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0]
  });

  const [fraudAlerts, setFraudAlerts] = useState<ExtendedFraudAlert[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | number | null>(null);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  const [newLoan, setNewLoan] = useState({
    amount: '',
    purpose: '',
    term_months: '',
    account: ''
  });

  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    description: '',
    category: 'service',
    priority: 'medium'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const safeFetch = async <T,>(p: Promise<T>) => p.catch(e => ({ success: false, error: String(e), data: undefined } as unknown as T));

      const [
        loansRes, complaintsRes, advancesRes, refundsRes, accountsRes,
        pendingLoansRes, threadsRes, fraudRes
      ] = await Promise.all([
        safeFetch(authService.getLoans()),
        safeFetch(authService.getComplaints()),
        safeFetch(authService.getCashAdvances()),
        safeFetch(authService.getRefunds()),
        safeFetch(authService.getAccounts()),
        safeFetch(authService.getPendingLoans()),
        safeFetch(authService.getMessageThreads()),
        safeFetch(authService.getFraudAlerts())
      ]);

      if (loansRes.success) {
        const data = loansRes.data;
        setLoans((Array.isArray(data) ? data : data?.results || []) as Loan[]);
      }
      if (complaintsRes.success) {
        const data = complaintsRes.data;
        setComplaints((Array.isArray(data) ? data : data?.results || []) as Complaint[]);
      }
      if (advancesRes.success) {
        const data = advancesRes.data;
        setCashAdvances((Array.isArray(data) ? data : data?.results || []) as CashAdvance[]);
      }
      if (refundsRes.success) {
        const data = refundsRes.data;
        setRefunds((Array.isArray(data) ? data : data?.results || []) as Refund[]);
      }
      if (accountsRes.success) setAccounts(accountsRes.data || []);
      if (pendingLoansRes.success) {
        const data = pendingLoansRes.data;
        setPendingLoans((Array.isArray(data) ? data : data?.results || []) as Loan[]);
      }
      if (threadsRes.success) {
        const data = threadsRes.data;
        setMessageThreads((Array.isArray(data) ? data : data?.results || []) as MessageThreadExtended[]);
      }
      if (fraudRes.success) {
        const data = fraudRes.data;
        setFraudAlerts((Array.isArray(data) ? data : data?.results || []) as any[]);
      }

    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLoan = async () => {
    if (!newLoan.amount || !newLoan.purpose || !newLoan.account) {
      showNotification('error', 'Please fill all mandatory loan fields.');
      return;
    }
    try {
      await authService.createLoan(newLoan);
      showNotification('success', 'Loan application submitted for review.');
      setNewLoan({ amount: '', purpose: '', term_months: '', account: '' });
      fetchData();
    } catch (err) {
      showNotification('error', 'Loan submission failed. Verify account standing.');
    }
  };

  const handleCreateComplaint = async () => {
    try {
      await authService.createComplaint(newComplaint);
      showNotification('success', 'Complaint logged in the priority queue.');
      setNewComplaint({ subject: '', description: '', category: 'service', priority: 'medium' });
      fetchData();
    } catch (err) {
      showNotification('error', 'Complaint submission failed.');
    }
  };

  const handleApproveCashAdvance = async (id: number | string) => {
    setIsProcessing(id);
    try {
      const res = await authService.reviewCashAdvance(id, 'approved');
      if (res.success) {
        alert('Cash advance approved!');
        fetchData();
      } else {
        alert(`Failed: ${res.error}`);
      }
    } finally { setIsProcessing(null); }
  };

  const handleRejectCashAdvance = async (id: number | string) => {
    setIsProcessing(id);
    try {
      await authService.reviewCashAdvance(String(id), 'rejected');
      showNotification('info', 'Cash advance request rejected.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Rejection failed.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleApproveRefund = async (id: number | string) => {
    setIsProcessing(id);
    try {
      const res = await authService.reviewRefund(id, 'approved');
      if (res.success) {
        alert('Refund approved!');
        fetchData();
      } else {
        alert(`Failed: ${res.error}`);
      }
    } finally { setIsProcessing(null); }
  };

  const handleRejectRefund = async (id: number | string) => {
    setIsProcessing(id);
    try {
      await authService.reviewRefund(String(id), 'rejected');
      showNotification('info', 'Refund request denied.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Rejection failed.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleApproveLoan = async (id: number | string) => {
    try {
      await authService.reviewLoan(String(id), 'approved');
      showNotification('success', 'Loan approved. Portfolio updated.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Approval failed.');
    }
  };

  const handleRejectLoan = async (id: number | string) => {
    try {
      await authService.reviewLoan(String(id), 'rejected');
      showNotification('info', 'Loan application rejected.');
      fetchData();
    } catch (err) {
      showNotification('error', 'Rejection failed.');
    }
  };

  const handleSelectThread = async (thread: MessageThreadExtended) => {
    setSelectedThread(thread);
    const res = await authService.getThreadMessages(String(thread.id));
    if (res.success) {
      const data = res.data;
      setMessages((Array.isArray(data) ? data : (data as { results?: ExtendedMessage[] })?.results || []) as ExtendedMessage[]);
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
        const data = res.data;
        setMessages((Array.isArray(data) ? data : (data as { results?: ExtendedMessage[] })?.results || []) as ExtendedMessage[]);
      }
    } catch (err) {
      showNotification('error', 'Message failed to send.');
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
        link.setAttribute('download', `Staff-Report-${reportParams.type}.${reportParams.format}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      } else {
        alert(`Report failed: ${res.error || 'Unknown error'}`);
      }
    } finally { setIsProcessing(null); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Syncing Core Banking...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'loans':
        return (
          <FinancialRequestsHub
            view="loans"
            loans={loans}
            accounts={accounts}
            newLoan={newLoan}
            setNewLoan={setNewLoan}
            handleCreateLoan={handleCreateLoan}
          />
        );
      case 'pending-loans':
        return (
          <FinancialRequestsHub
            view="pending-loans"
            pendingLoans={pendingLoans}
            onApproveLoan={handleApproveLoan}
            onRejectLoan={handleRejectLoan}
          />
        );
      case 'cash-advances':
        return (
          <FinancialRequestsHub
            view="cash-advances"
            cashAdvances={cashAdvances}
            isProcessing={isProcessing}
            onApproveCashAdvance={handleApproveCashAdvance}
            onRejectCashAdvance={handleRejectCashAdvance}
          />
        );
      case 'refunds':
        return (
          <FinancialRequestsHub
            view="refunds"
            refunds={refunds}
            isProcessing={isProcessing}
            onApproveRefund={handleApproveRefund}
            onRejectRefund={handleRejectRefund}
          />
        );
      case 'complaints':
        return (
          <AdministrativeHub
            view="complaints"
            complaints={complaints}
            onCreateComplaint={(c) => {
              setNewComplaint({ subject: c.subject, description: c.description, category: c.category, priority: c.priority });
              handleCreateComplaint();
            }}
            loading={loading}
          />
        );
      case 'accounts':
        return (
          <AdministrativeHub
            view="accounts"
            accounts={accounts}
            loading={loading}
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
      case 'fraud-detection':
        return (
          <SecurityOversight
            view="alerts"
            alerts={fraudAlerts}
            onInvestigate={(id) => showNotification('info', `Security check initiated for ${id}`)}
            onConfirmFraud={(id) => showNotification('error', `Fraud confirmed for transaction ${id}`)}
            onDismissAlert={(id) => showNotification('success', `Alert ${id} dismissed`)}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
        <div className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-200">C</div>
            <div>
              <h1 className="font-primary font-black text-slate-800 text-lg leading-none">Coastal</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Operational Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'loans', label: 'Loan Apps', icon: '💰' },
            { id: 'pending-loans', label: 'Approvals', icon: '⚖️' },
            { id: 'cash-advances', label: 'Advances', icon: '💵' },
            { id: 'refunds', label: 'Refunds', icon: '🔄' },
            { id: 'accounts', label: 'Accounts', icon: '🏦' },
            { id: 'fraud-detection', label: 'Security', icon: '🛡️' },
            { id: 'messaging', label: 'Messaging', icon: '💬' },
            { id: 'reports', label: 'Analytics', icon: '📊' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all
                ${activeView === item.id
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 border border-transparent'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <Button variant="danger" className="w-full h-12 rounded-2xl text-xs font-black uppercase tracking-widest" onClick={handleLogout}>
            Terminal Exit 🚪
          </Button>
        </div>
      </aside>

      {/* Main Experience */}
      <main className="flex-1 p-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
              Operational <span className="text-emerald-600">Sync.</span>
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Secure Internal Terminal • Node: AMER-SE-01</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-white p-3 px-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-xs font-black text-slate-600 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </header>

        {/* Global Notifications */}
        {notification && (
          <div className={`p-4 rounded-2xl mb-8 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' :
            notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
          }`}>
             <div className="flex items-center gap-3">
                <span className="text-xl">{notification.type === 'success' ? '✅' : '🚨'}</span>
                <p className="font-bold text-sm tracking-tight">{notification.text}</p>
             </div>
             <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100 font-black px-2">×</button>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default BankingOperations;
