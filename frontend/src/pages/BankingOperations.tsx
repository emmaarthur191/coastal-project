import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, apiService as authService, LoanExtended as Loan, MessageThreadExtended, ReportAnalytics } from '../services/api';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Complaint } from '../api/models/Complaint';
import { CashAdvance } from '../api/models/CashAdvance';
import { Refund } from '../api/models/Refund';
import { Account } from '../api/models/Account';
import { FraudAlert } from '../api/models/FraudAlert';
import SupportHub from '../components/operational/SupportHub';
import ErrorBoundary from '../components/ErrorBoundary';

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

  const [fraudAlerts, setFraudAlerts] = useState<ExtendedFraudAlert[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | number | null>(null);

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

  const showNotification = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const safeFetch = async <T,>(p: Promise<T>) => p.catch(e => ({ success: false, error: String(e), data: undefined } as unknown as T));

      const [threadsRes, fraudRes, reportsRes] = await Promise.all([
        safeFetch(authService.getMessageThreads()),
        safeFetch(authService.getFraudAlerts()),
        safeFetch(api.get<ReportAnalytics>('reports/analytics/'))
      ]);

      if (threadsRes.success) {
        const data = threadsRes.data;
        setMessageThreads((Array.isArray(data) ? data : (data as { results?: MessageThreadExtended[] })?.results || []) as MessageThreadExtended[]);
      }
      if (fraudRes.success) {
        const data = fraudRes.data;
        setFraudAlerts((Array.isArray(data) ? data : (data as { results?: ExtendedFraudAlert[] })?.results || []) as ExtendedFraudAlert[]);
      }
      if (reportsRes) {
        const data = (reportsRes as any).data || reportsRes;
        setReportsData({
            monthlyData: data.monthly_data || [],
            categoryData: data.category_data || []
        });
      }
    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        return <FinancialRequestsHub mode="manager" initialView="loans" />;
      case 'pending-loans':
        return <FinancialRequestsHub mode="manager" initialView="pending-loans" />;
      case 'cash-advances':
        return <FinancialRequestsHub mode="manager" initialView="cash_advances" />;
      case 'refunds':
        return <FinancialRequestsHub mode="manager" initialView="refunds" />;
      case 'complaints':
        return <SupportHub mode="manager" initialTab="complaints" />;
      case 'accounts': 
        return <ErrorBoundary><AdministrativeHub initialTab="accounts" /></ErrorBoundary>;
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
