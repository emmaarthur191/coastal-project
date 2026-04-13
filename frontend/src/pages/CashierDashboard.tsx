import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, PaginatedResponse } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import './CashierDashboard.css';
import { Transaction } from '../api/models/Transaction';
import { User } from '../api/models/User';

import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Building2, 
  FileText, 
  UserPlus2, 
  Megaphone, 
  CircleDollarSign, 
  Settings, 
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import TellerOperationsHub from '../components/operational/TellerOperationsHub';
import ProfileSettings from '../components/shared/ProfileSettings';

// --- HELPER COMPONENTS ---

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
          <h3 className="text-2xl font-bold text-error-700 mb-2 flex items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6" /> Something went wrong
          </h3>
          <p className="text-error-600 mb-4">We encountered an unexpected error.</p>
          <Button onClick={() => this.setState({ hasError: false, error: null })} variant="danger" className="flex items-center gap-2 mx-auto">
            Try Again <RefreshCw className="w-4 h-4" />
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

  const _hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role || '');
  const isMounted = React.useRef(true);
  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('teller_operations');
  const [initialView] = useState<'loans' | 'cash_advances' | 'refunds' | 'pending-loans'>('cash_advances');
  const [initialShowForm] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [_transactions, _setTransactions] = useState<Transaction[]>([]);
  const [message] = useState({ type: '', text: '' });
  const [globalSearch, setGlobalSearch] = useState('');

  // --- MENU ---
  const tabs = [
    { id: 'teller_operations', name: 'Teller Operations', icon: <Building2 className="w-full h-full" /> },
    { id: 'financial_requests', name: 'Financial Requests', icon: <FileText className="w-full h-full" /> },
    { id: 'account_opening', name: 'Member Onboarding', icon: <UserPlus2 className="w-full h-full" /> },
    { id: 'support', name: 'Support Hub', icon: <Megaphone className="w-full h-full" /> },
    { id: 'my_payslips', name: 'My Payslips', icon: <CircleDollarSign className="w-full h-full" /> },
    { id: 'profile_settings', name: 'Profile Settings', icon: <Settings className="w-full h-full" /> },
    { id: 'messaging', name: 'Staff Messenger', icon: <MessageSquare className="w-full h-full" /> }
  ];

  // --- API CALLS ---
  const fetchMembers = async () => { try { const r = await api.get<PaginatedResponse<User>>('users/members/'); setMembers(r.data.results || []); } catch (e) { console.error(e); } };
  const fetchTransactions = async () => { try { const r = await api.get<PaginatedResponse<Transaction>>('transactions/'); _setTransactions(r.data.results || []); } catch (e) { console.error(e); } };

  // --- EFFECTS ---
  useEffect(() => {
    fetchMembers();
    fetchTransactions();
  }, []);

  // Keyboard Shortcuts (Preserved)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'o': event.preventDefault(); setActiveTab('teller_operations'); break;
          case '/': event.preventDefault(); (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus(); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const announceToScreenReader = (msg: string) => {
    logger.log(msg);
  };

  // --- HANDLERS ---
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    announceToScreenReader(`Switched to ${tabs.find(t => t.id === tabId)?.name} `);
  };

  // --- RENDER CONTENT ---
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'teller_operations': return <ErrorBoundary><TellerOperationsHub mode="cashier" initialTab="deposit" /></ErrorBoundary>;
      case 'financial_requests': return <ErrorBoundary><FinancialRequestsHub mode="staff" initialView={initialView} initialShowForm={initialShowForm} /></ErrorBoundary>;
      case 'account_opening': return <ErrorBoundary><OnboardingHub mode="staff" /></ErrorBoundary>;
      case 'support': return <ErrorBoundary><SupportHub mode="staff" initialTab="complaints" /></ErrorBoundary>;
      case 'my_payslips': return (
        <div className="space-y-6">
          <ErrorBoundary><StaffPayslipViewer /></ErrorBoundary>
        </div>
      );
      case 'profile_settings': return (
        <ErrorBoundary>
          <ProfileSettings user={user} />
        </ErrorBoundary>
      );
      default: return <div className="text-black font-black p-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-300">Select a unified module from the sidebar.</div>;
    }
  };

  return (
    <ErrorBoundary>
      <DashboardLayout
        title="Teller Portal"
        user={user}
        menuItems={tabs}
        activeView={activeTab}
        onNavigate={(id) => {
          if (id === 'messaging') {
            navigate('/messaging');
          } else {
            handleTabChange(id);
          }
        }}
        onLogout={handleLogout}
      >
        <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-900/10">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{tabs.find(t => t.id === activeTab)?.name}</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900 opacity-40 font-black" />
            <input
              placeholder="SEARCH OPERATIONS..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10 pr-4 py-3 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-none w-full transition-all font-black text-slate-900 uppercase text-[10px] tracking-widest placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Toast Notification */}
        {message.text && (
          <div className={`fixed top-24 right-8 px-6 py-4 rounded-2xl shadow-2xl z-50 text-white font-bold animate-in slide-in-from-right duration-300 flex items-center gap-3 ${message.type === 'error' ? 'bg-error-600' : 'bg-success-600'} `}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            {message.text}
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
