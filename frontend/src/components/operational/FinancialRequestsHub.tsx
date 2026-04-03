import React, { useState, useEffect, useCallback } from 'react';
import { api, apiService, CashAdvanceExtended, RefundExtended, LoanExtended, Account } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { formatCurrencyGHS } from '../../utils/formatters';

interface FinancialRequestsHubProps {
  mode: 'staff' | 'manager';
  initialView?: 'loans' | 'cash_advances' | 'refunds' | 'pending-loans' | 'reports';
  // Optional pre-fetched data (to maintain compatibility with BankingOperations)
  loans?: LoanExtended[];
  pendingLoans?: LoanExtended[];
  cashAdvances?: CashAdvanceExtended[];
  refunds?: RefundExtended[];
  accounts?: Account[];
}

const FinancialRequestsHub: React.FC<FinancialRequestsHubProps> = ({ 
  mode, 
  initialView = 'loans',
  loans: initialLoans,
  pendingLoans: initialPendingLoans,
  cashAdvances: initialCashAdvances,
  refunds: initialRefunds,
  accounts: initialAccounts
}) => {
  const [activeTab, setActiveTab] = useState(initialView);
  const [loans, setLoans] = useState<LoanExtended[]>(initialLoans || []);
  const [pendingLoans, setPendingLoans] = useState<LoanExtended[]>(initialPendingLoans || []);
  const [advances, setAdvances] = useState<CashAdvanceExtended[]>(initialCashAdvances || []);
  const [refunds, setRefunds] = useState<RefundExtended[]>(initialRefunds || []);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts || []);
  
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New Loan Form State
  const [newLoan, setNewLoan] = useState({ amount: '', purpose: '', term_months: '12', account: '' });
  const [advanceForm, setAdvanceForm] = useState({ member_id: '', amount: '', reason: '' });

  const fetchAccounts = useCallback(async () => {
    if (mode === 'staff' && accounts.length === 0) {
        const accRes = await apiService.getAccounts();
        if (accRes.success && accRes.data) setAccounts(accRes.data);
    }
  }, [mode, accounts.length]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!initialLoans || activeTab !== initialView) {
        fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'loans' || activeTab === 'pending-loans') {
        const res = await apiService.getLoans();
        if (res.success && res.data) {
            // Handle both array and paginated response
            const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
            setLoans(data);
            setPendingLoans(data.filter((l: any) => l.status === 'pending'));
        }
      } else if (activeTab === 'cash_advances') {
        const res = await api.get<any>('banking/cash-advances/');
        setAdvances(res.data?.results || res.data || []);
      } else if (activeTab === 'refunds') {
        const res = await api.get<any>('banking/refunds/');
        setRefunds(res.data?.results || res.data || []);
      }
      
      if (mode === 'staff' && accounts.length === 0) {
          const accRes = await apiService.getAccounts();
          if (accRes.success && accRes.data) setAccounts(accRes.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiService.createLoan(newLoan);
    if (res.success) {
      toast.success('Loan application submitted');
      setShowForm(false);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to submit loan');
    }
    setLoading(false);
  };

  const handleApproveLoan = async (id: number | string) => {
    setProcessingId(id);
    const res = await apiService.approveLoan(id);
    if (res.success) {
      toast.success('Loan Approved');
      fetchData();
    } else {
      toast.error(res.error || 'Approval failed');
    }
    setProcessingId(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'loans':
      case 'pending-loans':
        const displayLoans = activeTab === 'pending-loans' ? pendingLoans : loans;
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4">Borrower</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  {mode === 'manager' && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="text-white font-medium">{loan.borrower_name || `User ${loan.user}`}</div>
                      <div className="text-[10px] text-gray-400">{loan.purpose}</div>
                    </td>
                    <td className="p-4 text-white font-bold">{formatCurrencyGHS(parseFloat(loan.amount))}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${loan.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                        {loan.status}
                      </span>
                    </td>
                    {mode === 'manager' && loan.status === 'pending' && (
                      <td className="p-4 text-right">
                        <Button size="sm" onClick={() => handleApproveLoan(loan.id)} disabled={processingId === loan.id}>
                           Approve
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'cash_advances':
        return (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
              <thead className="text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  {mode === 'manager' && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {advances.map(a => (
                  <tr key={a.id} className="hover:bg-white/5">
                    <td className="p-4 text-white font-medium">CA-{a.id}</td>
                    <td className="p-4 text-white font-bold">{formatCurrencyGHS(parseFloat(a.amount || '0'))}</td>
                    <td className="p-4">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'refunds':
        return (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
              <thead className="text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {refunds.map(r => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="p-4 text-white font-medium">REF-{String(r.id).slice(-6)}</td>
                    <td className="p-4 text-white font-bold">{formatCurrencyGHS(r.requested_amount || 0)}</td>
                    <td className="p-4">
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'reports':
        return (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
            <h5 className="text-xl font-bold text-white mb-2">Financial Reports Engine</h5>
            <p className="text-gray-400 max-w-sm mx-auto">This portal aggregates real-time data across all account branches. Use the Filter panel below for deep-dive analysis.</p>
            <div className="mt-6 flex justify-center gap-4">
               <Button variant="secondary" size="sm">Export CSV</Button>
               <Button variant="primary" size="sm">View Visualizations</Button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap p-1 bg-white/5 rounded-xl border border-white/5">
          {['loans', 'cash_advances', 'refunds', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-coastal-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        {mode === 'staff' && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
             {showForm ? 'Cancel' : 'New Request ➕'}
          </Button>
        )}
      </div>

      {showForm && mode === 'staff' && (
          <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">New Request</h3>
              {/* Simplified form for demonstration, ideally split by activeTab */}
              <p className="text-gray-400 text-sm">Please select a tab above and fill the corresponding portal form.</p>
          </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h4 className="font-bold text-gray-300 uppercase text-xs tracking-widest">{activeTab.replace('-', ' ')} Queue</h4>
          <button onClick={fetchData} className="text-[10px] text-coastal-primary font-bold hover:underline">RE-SYNC</button>
        </div>
        {renderTabContent()}
      </GlassCard>
    </div>
  );
};

export default FinancialRequestsHub;
