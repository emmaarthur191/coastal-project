import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api, apiService } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';
import { AxiosError } from 'axios';
import { logger } from '../../utils/logger';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileCheck, 
  Search, 
  Database, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface TellerOperationsHubProps {
  mode: 'cashier' | 'mobile_banker';
  initialTab?: string;
}

// Inner Interfaces
interface Transaction {
  id: string;
  reference_number: string;
  transaction_type: string;
  amount: string;
  status: string;
  timestamp: string;
  description: string;
  from_account?: { account_number: string } | null;
  to_account?: { account_number: string } | null;
}

interface CashDrawer {
  id: string;
  status: string;
  opening_balance: number;
  current_balance: number;
  closing_balance?: number;
  opened_at: string;
  closed_at?: string;
  opened_by: string;
}

interface Account {
  id: string | number;
  account_number: string;
  balance: string | number;
  account_type: string;
  status: string;
  user?: {
    full_name: string;
    first_name?: string;
    last_name?: string;
  };
}

const TellerOperationsHub: React.FC<TellerOperationsHubProps> = ({ mode, initialTab = 'deposit' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Forms State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMemberId, setDepositMemberId] = useState('');

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMemberId, setWithdrawalMemberId] = useState('');

  const [checkAmount, setCheckAmount] = useState('');
  const [checkMemberId, setCheckMemberId] = useState('');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Search State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    reference: '', member: '', type: '', status: '', date_from: '', date_to: '', min_amount: '', max_amount: ''
  });
  const [_searchPagination, setSearchPagination] = useState({ total_pages: 1, total_count: 0, current_page: 1 });
  const [_selectedTx, _setSelectedTx] = useState<Transaction | null>(null);
 
   // Account Closure State
   const [closureAccountNumber, setClosureAccountNumber] = useState('');
   const [foundAccount, setFoundAccount] = useState<Account | null>(null);
   const [closureReason, setClosureReason] = useState('');

  // Cash Drawer State
  const [_cashDrawers, setCashDrawers] = useState<CashDrawer[]>([]);
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [showOpenDrawer, setShowOpenDrawer] = useState(false);
  const [showCloseDrawer, setShowCloseDrawer] = useState(false);

  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [denominations, _setDenominations] = useState({
      '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
      '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
  });

  const showToast = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Shared submit mechanism (deposit/withdraw uses this)
  const processTransaction = async (e: React.FormEvent, type: 'Deposit' | 'Withdrawal') => {
    e.preventDefault();
    const amount = type === 'Deposit' ? depositAmount : withdrawalAmount;
    const memberId = type === 'Deposit' ? depositMemberId : withdrawalMemberId;

    if (!memberId || !amount || parseFloat(amount) <= 0) {
      showToast('error', 'Invalid input'); return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'mobile_banker'
          ? (type === 'Deposit' ? 'operations/process-deposit/' : 'operations/process-withdrawal/')
          : 'transactions/process/'; // legacy fallback if we keep transactions/process/

      await api.post(endpoint, {
        member_id: memberId,
        amount: parseFloat(amount),
        type,
        account_type: 'daily_susu'
      });
      showToast('success', `${type} Success!`);
      if (type === 'Deposit') { setDepositAmount(''); setDepositMemberId(''); }
      else { setWithdrawalAmount(''); setWithdrawalMemberId(''); }
    } catch (error) {
      if (error instanceof AxiosError) {
        showToast('error', error.response?.data?.message || error.response?.data?.error || `${type} failed`);
      } else {
        showToast('error', `${type} failed`);
      }
    } finally {
      setLoading(false);
    }
  };

  const processCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkMemberId || !checkAmount || !frontImage) { showToast('error', 'Missing fields'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('member_id', checkMemberId);
      formData.append('amount', checkAmount);
      formData.append('account_type', 'daily_susu');
      formData.append('front_image', frontImage);
      if (backImage) formData.append('back_image', backImage);

      const r = await api.post<{ transaction_id: string }>('check-deposits/process-check-deposit/', formData);
      showToast('success', `Check Deposited! ID: ${r.data.transaction_id}`);
      setCheckAmount(''); setCheckMemberId(''); setFrontImage(null); setBackImage(null);
    } catch (error) {
        if (error instanceof AxiosError) showToast('error', error.response?.data?.error || 'Check deposit failed');
        else showToast('error', 'Check deposit failed');
    } finally { setLoading(false); }
  };

  const handleAccountLookup = async (accNum: string) => {
    setClosureAccountNumber(accNum);
    if (accNum.length < 5) {
      setFoundAccount(null);
      return;
    }
    try {
      const res = await api.get(`banking/accounts/?search=${accNum}`);
      const data = res.data as { results?: Account[] };
      const accounts = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
      if (accounts.length > 0) {
        const match = accounts.find((a: Account) => a.account_number === accNum) || accounts[0];
        setFoundAccount(match);
      } else {
        setFoundAccount(null);
      }
    } catch (_err) {
      setFoundAccount(null);
    }
  };

  const handleCloseAccount = async () => {
    if (!foundAccount || !closureReason) {
      showToast('error', 'Please select a valid account and provide a reason');
      return;
    }
    setLoading(true);
    try {
      await apiService.closeAccount(foundAccount.id, { reason: closureReason });
      showToast('success', 'Closure request submitted for manager approval');
      setClosureAccountNumber('');
      setFoundAccount(null);
      setClosureReason('');
    } catch (_error) {
      showToast('error', 'Failed to initiate closure');
    } finally {
      setLoading(false);
    }
  };

  // Search Logic
  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
        const params = new URLSearchParams();
        Object.entries(searchFilters).forEach(([key, value]) => { if (value) params.append(key, value); });
        params.append('page', page.toString());

        const res = await api.get<{results: Transaction[], count: number}>(`transactions/search/?${params.toString()}`);
        const data = res.data;
        setTransactions(data?.results || []);
        setSearchPagination({
            total_pages: Math.ceil((data?.count || 0) / 20),
            total_count: data?.count || 0,
            current_page: page
        });
    } catch (_error) {
        setTransactions([]);
    } finally { setLoading(false); }
  }, [searchFilters]);

  // Cash Drawer Logic
  const fetchCashDrawers = useCallback(async () => {
    try {
        const response = await api.get<{results?: CashDrawer[]}>('banking/cash-drawers/');
        const data = response.data?.results || response.data;
        const drawersArray = Array.isArray(data) ? data : [];
        setCashDrawers(drawersArray);
        const openDrawer = drawersArray.find((drawer: CashDrawer) => drawer.status === 'open');
        setCurrentDrawer(openDrawer || (drawersArray.length > 0 ? drawersArray[0] : null));
    } catch (_error) {
        logger.error('Drawer error', _error);
    }
  }, []);

  const openDrawerSubmit = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) return showToast('error', 'Invalid balance');
    setLoading(true);
    try {
        await api.post('banking/cash-drawers/open/', { opening_balance: parseFloat(openingBalance) });
        showToast('success', 'Drawer opened');
        setShowOpenDrawer(false); setOpeningBalance(''); fetchCashDrawers();
    } catch (_e) { showToast('error', 'Failed to open drawer'); }
    finally { setLoading(false); }
  };

  const closeDrawerSubmit = async () => {
    if (!closingBalance || parseFloat(closingBalance) < 0) return showToast('error', 'Invalid balance');
    setLoading(true);
    try {
        await api.post(`banking/cash-drawers/${currentDrawer?.id}/close/`, {
            closing_balance: parseFloat(closingBalance), denominations
        });
        showToast('success', 'Drawer closed');
        setShowCloseDrawer(false); setClosingBalance(''); fetchCashDrawers();
    } catch (_e) { showToast('error', 'Failed to close drawer'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
     if (activeTab === 'drawer') fetchCashDrawers();
     if (activeTab === 'search') handleSearch();
  }, [activeTab, fetchCashDrawers, handleSearch]);


  return (
    <div className="space-y-6">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-24 right-8 px-6 py-4 rounded-xl shadow-xl z-50 text-white font-bold animate-in slide-in-from-right duration-300 flex items-center gap-3 ${message.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { id: 'deposit', label: 'Deposit', icon: <ArrowDownCircle className="w-4 h-4" /> },
          { id: 'withdrawal', label: 'Withdraw', icon: <ArrowUpCircle className="w-4 h-4" /> },
          { id: 'check', label: 'Check Deposit', icon: <FileCheck className="w-4 h-4" /> },

          ...(mode === 'cashier' ? [
             { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" /> },
             { id: 'drawer', label: 'Cash Drawer', icon: <Database className="w-4 h-4" /> },
             { id: 'closure', label: 'Account Closure', icon: <Lock className="w-4 h-4" /> },
           ] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={`Switch to ${tab.label} view`}
            aria-label={`View ${tab.label}`}
            className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary-600 text-primary-700 bg-primary-50/50' : 'border-transparent text-slate-900 hover:text-black hover:bg-slate-50 opacity-60 hover:opacity-100'}`}
          >
            <span className="mr-2" aria-hidden="true">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'deposit' && (
        <GlassCard className="max-w-xl mx-auto p-8 border-t-[6px] border-t-primary-500">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tighter">New Deposit</h2>
            <form onSubmit={(e) => processTransaction(e, 'Deposit')} className="space-y-6">
                <Input label="Member ID" value={depositMemberId} onChange={e => setDepositMemberId(e.target.value)} required />
                <Input label="Amount (GHS)" type="number" step="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required className="text-2xl font-bold text-emerald-600" />
                <Button 
                    type="submit" 
                    variant="success" 
                    className="w-full py-4 text-lg" 
                    disabled={loading}
                    title="Confirm and process cash deposit"
                >
                    {loading ? 'Processing...' : 'Confirm Deposit'}
                </Button>
            </form>
        </GlassCard>
      )}

      {activeTab === 'withdrawal' && (
        <GlassCard className="max-w-xl mx-auto p-8 border-t-[6px] border-t-accent-500">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tighter">New Withdrawal</h2>
            <form onSubmit={(e) => processTransaction(e, 'Withdrawal')} className="space-y-6">
                <Input label="Member ID" value={withdrawalMemberId} onChange={e => setWithdrawalMemberId(e.target.value)} required />
                <Input label="Amount (GHS)" type="number" step="0.01" value={withdrawalAmount} onChange={e => setWithdrawalAmount(e.target.value)} required className="text-2xl font-bold text-red-600" />
                <Button 
                    type="submit" 
                    variant="danger" 
                    className="w-full py-4 text-lg" 
                    disabled={loading}
                    title="Confirm and process cash withdrawal"
                >
                    {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </Button>
            </form>
        </GlassCard>
      )}

      {activeTab === 'check' && (
        <GlassCard className="max-w-3xl mx-auto p-8 border-t-[6px] border-t-amber-500">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tighter">Process Check</h2>
            <form onSubmit={processCheck} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Member ID" value={checkMemberId} onChange={e => setCheckMemberId(e.target.value)} required />
                    <Input label="Amount" type="number" value={checkAmount} onChange={e => setCheckAmount(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="file" 
                        title="Front Image Input" 
                        aria-label="Upload Front Image" 
                        ref={frontInputRef} 
                        className="hidden" 
                        onChange={e => setFrontImage(e.target.files?.[0] || null)} 
                    />
                    <div 
                        role="button"
                        tabIndex={0}
                        title="Click to upload front of check"
                        aria-label="Upload Front Image"
                        className="border-2 border-dashed border-slate-400 p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors font-black text-slate-900 uppercase text-xs" 
                        onClick={() => frontInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') frontInputRef.current?.click(); }}
                    >
                        {frontImage ? <span className="flex items-center justify-center gap-2 text-emerald-600">Front Selected <CheckCircle2 className="w-4 h-4" /></span> : 'Upload Front Image'}
                    </div>
                    <input 
                        type="file" 
                        title="Back Image Input" 
                        aria-label="Upload Back Image" 
                        ref={backInputRef} 
                        className="hidden" 
                        onChange={e => setBackImage(e.target.files?.[0] || null)} 
                    />
                    <div 
                        role="button"
                        tabIndex={0}
                        title="Click to upload back of check"
                        aria-label="Upload Back Image"
                        className="border-2 border-dashed border-slate-400 p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors font-black text-slate-900 uppercase text-xs" 
                        onClick={() => backInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') backInputRef.current?.click(); }}
                    >
                        {backImage ? <span className="flex items-center justify-center gap-2 text-emerald-600">Back Selected <CheckCircle2 className="w-4 h-4" /></span> : 'Upload Back Image'}
                    </div>
                </div>
                <Button 
                    type="submit" 
                    variant="warning" 
                    className="w-full py-4" 
                    disabled={loading}
                    title="Submit check for processing"
                >
                    {loading ? 'Processing...' : 'Submit Check'}
                </Button>
            </form>
        </GlassCard>
      )}

      {activeTab === 'search' && mode === 'cashier' && (
        <GlassCard>
            <div className="grid grid-cols-4 gap-4 mb-4">
                <Input label="Reference" value={searchFilters.reference} onChange={e => setSearchFilters({...searchFilters, reference: e.target.value})} />
                <Input label="Type" value={searchFilters.type} onChange={e => setSearchFilters({...searchFilters, type: e.target.value})} />
                <Button 
                    variant="primary" 
                    onClick={() => handleSearch(1)} 
                    className="mt-6"
                    title="Search transactions with applied filters"
                >
                    Search
                </Button>
            </div>
            <table className="w-full text-sm text-left">
                <thead><tr className="bg-gray-100"><th className="p-2">Ref</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Status</th></tr></thead>
                <tbody>
                    {transactions.map(tx => (
                        <tr key={tx.id} className="border-b">
                            <td className="p-2">{tx.reference_number}</td>
                            <td className="p-2">{tx.transaction_type}</td>
                            <td className="p-2">{formatCurrencyGHS(parseFloat(tx.amount || '0'))}</td>
                            <td className="p-2">{tx.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </GlassCard>
      )}



      {activeTab === 'drawer' && mode === 'cashier' && (
        <GlassCard>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Cash Drawer Management</h3>
                <div>
                     {!currentDrawer || currentDrawer.status !== 'open' ? (
                         <Button variant="success" onClick={() => setShowOpenDrawer(true)}>Open Drawer</Button>
                     ) : (
                         <Button variant="danger" onClick={() => setShowCloseDrawer(true)}>Close Drawer</Button>
                     )}
                </div>
            </div>

            {showOpenDrawer && (
                <div className="p-4 border rounded bg-gray-50 mb-4">
                    <Input label="Opening Balance" type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} />
                    <Button 
                        onClick={openDrawerSubmit} 
                        disabled={loading} 
                        className="mt-2"
                        title="Confirm opening the cash drawer"
                    >
                        Confirm Open
                    </Button>
                </div>
            )}

            {showCloseDrawer && (
                <div className="p-4 border rounded bg-gray-50 mb-4">
                    <Input label="Closing Balance" type="number" value={closingBalance} onChange={e => setClosingBalance(e.target.value)} />
                    <Button 
                        onClick={closeDrawerSubmit} 
                        disabled={loading} 
                        className="mt-2"
                        title="Confirm closing the cash drawer"
                    >
                        Confirm Close
                    </Button>
                </div>
            )}

            {currentDrawer && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded mt-4">
                    <div>Status: <strong>{currentDrawer.status}</strong></div>
                    <div>Current Balance: <strong>{formatCurrencyGHS(currentDrawer.current_balance)}</strong></div>
                </div>
            )}
        </GlassCard>
      )}
       {activeTab === 'closure' && mode === 'cashier' && (
        <GlassCard className="max-w-2xl mx-auto p-8 border-t-[6px] border-t-accent-600">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center tracking-tighter">Terminate Account</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-black text-slate-900 uppercase ml-1 mb-2">Search Account Number</label>
                    <Input 
                        placeholder="Enter 10-digit account number" 
                        value={closureAccountNumber} 
                        onChange={e => handleAccountLookup(e.target.value)} 
                        className="text-xl font-mono tracking-widest"
                    />
                </div>

                {foundAccount && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in zoom-in duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase block mb-1">Account Holder</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    {foundAccount.user?.full_name || foundAccount.user?.first_name + ' ' + foundAccount.user?.last_name}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-blue-500 uppercase block mb-1">Current Balance</span>
                                <span className="text-lg font-black text-emerald-600">
                                    {formatCurrencyGHS(parseFloat(String(foundAccount.balance || '0')))}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase block mb-1">Type</span>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                                    {foundAccount.account_type?.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-blue-500 uppercase block mb-1">Status</span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                                    {foundAccount.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase ml-1">Reason for Closure</label>
                    <textarea 
                        className="w-full h-24 p-4 rounded-xl border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-800 dark:text-white font-medium"
                        placeholder="State reason for permanent termination..."
                        value={closureReason}
                        onChange={e => setClosureReason(e.target.value)}
                    />
                </div>

                <Button 
                    variant="danger" 
                    className="w-full py-4 text-lg font-bold shadow-lg shadow-red-500/20"
                    disabled={loading || !foundAccount}
                    onClick={handleCloseAccount}
                >
                    {loading ? 'Processing Termination...' : 'Permanently Close Account'}
                </Button>
                
                <p className="text-[10px] text-slate-400 text-center italic mt-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" /> Caution: This action is permanent and will settle all remaining balances before closure.
                </p>
            </div>
        </GlassCard>
      )}

    </div>
  );
};

export default TellerOperationsHub;
