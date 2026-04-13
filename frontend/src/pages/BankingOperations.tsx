import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, apiService as authService, MessageThreadExtended, ReportAnalytics } from '../services/api';
import { useNavigate } from 'react-router-dom';
import type { MonthlyReportData, CategoryReportData, LoginAttemptRecord, AuditLogRecord } from '../types';

import { Button } from '../components/ui/Button';

import { FraudAlert } from '../api/models/FraudAlert';
import SupportHub from '../components/operational/SupportHub';
import { 
  CircleDollarSign, 
  Scale, 
  Banknote, 
  RefreshCcw, 
  Building2, 
  ShieldAlert, 
  MessageSquare, 
  BarChart3,
  LogOut,
  CheckCircle2,
  AlertOctagon,
  X,
  Loader2
} from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

// Modular Components
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SecurityOversight from '../components/operational/SecurityOversight';
import OperationalOverview from '../components/operational/OperationalOverview';
import OperationalMessenger from '../components/operational/OperationalMessenger';
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
  monthlyData: unknown[];
  categoryData: unknown[];
}

function BankingOperations() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('loans');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [fraudAlerts, setFraudAlerts] = useState<ExtendedFraudAlert[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttemptRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | number | null>(null);

  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThreadExtended[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThreadExtended | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const [reportsData, setReportsData] = useState<Partial<ReportsData>>({});

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

      const [threadsRes, fraudRes, reportsRes, loginRes, auditRes] = await Promise.all([
        safeFetch(authService.getMessageThreads()),
        safeFetch(authService.getFraudAlerts()),
        safeFetch(api.get<ReportAnalytics>('reports/analytics/')),
        safeFetch(authService.getLoginAttempts()),
        safeFetch(authService.getAuditLogs())
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
        const res = reportsRes as { data?: { monthly_data?: unknown[], category_data?: unknown[] } };
        setReportsData({
          monthlyData: res.data?.monthly_data || [],
          categoryData: res.data?.category_data || []
        });
      }
      if (loginRes.success) {
        setLoginAttempts(loginRes.data || []);
      }
      if (auditRes.success) {
        setAuditLogs(auditRes.data || []);
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
      if ('error' in res && typeof (res as { error?: string }).error === 'string') {
        throw new Error((res as { error?: string }).error);
      }
      const data = res.data;
      setMessages((Array.isArray(data) ? data : (data as { results?: ExtendedMessage[] })?.results || []) as ExtendedMessage[]);
    } catch (_err) {
      showNotification('error', 'Message failed to send.');
    } finally {
      setIsProcessing(null);
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
          <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Syncing Core Banking...</p>
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
            threads={messageThreads}
            selectedThread={selectedThread as MessageThreadExtended}
            messages={messages}
            newMessage={newMessage}
            onSelectThread={handleSelectThread as unknown as React.ComponentProps<typeof OperationalMessenger>['onSelectThread']}
            onSendMessage={handleSendMessage}
            onNewMessageChange={setNewMessage}
            isProcessing={isProcessing}
          />
        );
      case 'reports':
        return (
          <div className="space-y-8">
            <OperationalOverview
              monthlyData={reportsData.monthlyData as MonthlyReportData[]}
              categoryData={reportsData.categoryData as CategoryReportData[]}
              loading={loading}
            />
          </div>
        );
      case 'fraud-detection':
        return (
          <SecurityOversight
            initialTab="alerts"
            alerts={fraudAlerts}
            loginAttempts={loginAttempts}
            auditLogs={auditLogs}
            onInvestigate={(id) => showNotification('info', `Security check initiated for ${id}`)}
            onConfirmFraud={(id) => authService.reviewFraudAlert(String(id), 'confirmed').then(() => fetchData())}
            onDismissAlert={(id) => authService.reviewFraudAlert(String(id), 'dismissed').then(() => fetchData())}
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
            { id: 'loans', label: 'Loan Apps', icon: <CircleDollarSign className="w-5 h-5" /> },
            { id: 'pending-loans', label: 'Approvals', icon: <Scale className="w-5 h-5" /> },
            { id: 'cash-advances', label: 'Advances', icon: <Banknote className="w-5 h-5" /> },
            { id: 'refunds', label: 'Refunds', icon: <RefreshCcw className="w-5 h-5" /> },
            { id: 'accounts', label: 'Accounts', icon: <Building2 className="w-5 h-5" /> },
            { id: 'fraud-detection', label: 'Security', icon: <ShieldAlert className="w-5 h-5" /> },
            { id: 'messaging', label: 'Messaging', icon: <MessageSquare className="w-5 h-5" /> },
            { id: 'reports', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> }
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
              <span className={`transition-colors ${activeView === item.id ? 'text-emerald-600' : 'text-slate-400'}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50 bg-slate-50/50">
          <Button variant="danger" className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2" onClick={handleLogout}>
            Terminal Exit <LogOut className="w-4 h-4" />
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
                {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                <p className="font-bold text-sm tracking-tight">{notification.text}</p>
             </div>
             <button onClick={() => setNotification(null)} className="opacity-50 hover:opacity-100 font-black p-1" aria-label="Close notification" title="Close notification">
               <X className="w-4 h-4" />
             </button>
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
