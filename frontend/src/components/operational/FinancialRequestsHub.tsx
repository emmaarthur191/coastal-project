import React, { useState, useEffect, useCallback } from 'react';
import { apiService, CashAdvanceExtended, RefundExtended, LoanExtended, Account, CreateLoanData, Report } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import { formatCurrencyGHS } from '../../utils/formatters';
import { 
  CircleDollarSign, 
  Scale, 
  Banknote, 
  RefreshCcw, 
  BarChart3, 
  PlusCircle, 
  CheckCircle2, 
  X,
  FileText,
  Download,
  AlertOctagon,
  Clock,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import MemberSearch from '../shared/MemberSearch';
import './FinancialRequestsHub.css';

interface FinancialRequestsHubProps {
  mode: 'staff' | 'manager';
  initialView?: 'loans' | 'cash_advances' | 'refunds' | 'pending-loans' | 'reports';
  initialShowForm?: boolean;
  initialSubTab?: string;
  // Optional pre-fetched data (to maintain compatibility with BankingOperations)
  loans?: LoanExtended[];
  cashAdvances?: CashAdvanceExtended[];
  refunds?: RefundExtended[];
  accounts?: Account[];
}

interface PersonalData {
  dob: string;
  digital_address: string;
  town: string;
  city: string;
}

interface NOKData {
  name: string;
  relationship: string;
  id_type: string;
  id_number: string;
  contact_number: string;
  address: string;
}

interface GuarantorData {
  name: string;
  relationship: string;
  id_type: string;
  id_number: string;
  contact_number: string;
  address: string;
  occupation: string;
}

interface LoanSubmissionData {
  user: number;
  amount: number;
  purpose: string;
  term_months: number;
  interest_rate: number;
  id_type: string;
  id_number: string;
  verification_notes?: string;
  
  // Expanded fields for backend parity
  personal: PersonalData;
  nok1: NOKData;
  nok2: NOKData;
  guarantor1: GuarantorData;
  guarantor2: GuarantorData;
}

const FinancialRequestsHub: React.FC<FinancialRequestsHubProps> = ({ 
  mode, 
  initialView = 'loans',
  initialShowForm = false,
  loans: initialLoans,
  cashAdvances: initialCashAdvances,
  refunds: initialRefunds,
  accounts: initialAccounts
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'cash_advances' | 'refunds' | 'pending-loans' | 'reports'>(
    mode === 'staff' && initialView === 'reports' ? 'loans' : initialView
  );
  const [loans, setLoans] = useState<LoanExtended[]>(initialLoans || []);
  const [advances, setAdvances] = useState<CashAdvanceExtended[]>(initialCashAdvances || []);
  const [refunds, setRefunds] = useState<RefundExtended[]>(initialRefunds || []);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts || []);
  
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | number | null>(null);
  const [showForm, setShowForm] = useState(initialShowForm || false);

  // Form Wizard State
  const [loanStep, setLoanStep] = useState(1);

  // New Request State (Strict Typing)
  const [selectedMember, setSelectedMember] = useState<{ id: string | number; full_name: string } | null>(null);
  const [verificationData, setVerificationData] = useState({ id_type: 'ghana_card', id_number: '', notes: '' });
  
  const [loanFormData, setLoanFormData] = useState<Omit<LoanSubmissionData, 'user' | 'id_type' | 'id_number' | 'verification_notes'>>({
    amount: 0,
    purpose: '',
    term_months: 12,
    interest_rate: 1.5,
    personal: { dob: '', digital_address: '', town: '', city: '' },
    nok1: { name: '', relationship: '', id_type: 'ghana_card', id_number: '', contact_number: '', address: '' },
    nok2: { name: '', relationship: '', id_type: 'ghana_card', id_number: '', contact_number: '', address: '' },
    guarantor1: { name: '', relationship: '', id_type: 'ghana_card', id_number: '', contact_number: '', address: '', occupation: '' },
    guarantor2: { name: '', relationship: '', id_type: 'ghana_card', id_number: '', contact_number: '', address: '', occupation: '' },
  });

  const [advanceForm, setAdvanceForm] = useState({ amount: '', reason: '', repayment_date: '' });
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '', transaction_id: '', description: '' });

  // Reporting State
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    type: 'loans',
    format: 'pdf',
    date_from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0]
  });

  // View Expansion State
  const [showAllPendingLoans, setShowAllPendingLoans] = useState(false);
  const [showAllApprovedLoans, setShowAllApprovedLoans] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (mode === 'staff' && accounts.length === 0) {
        const accRes = await apiService.getAccounts();
        if (accRes.success && accRes.data) setAccounts(accRes.data);
    }
  }, [mode, accounts.length]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'loans' || activeTab === 'pending-loans') {
        const res = await apiService.getLoans();
        if (res.success && res.data) {
            setLoans(res.data);
        }
      } else if (activeTab === 'cash_advances') {
        const res = await apiService.getCashAdvances();
        if (res.success && res.data) {
          setAdvances(res.data);
        }
      } else if (activeTab === 'refunds') {
        const res = await apiService.getRefunds();
        if (res.success && res.data) {
          setRefunds(res.data);
        }
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
  }, [activeTab, accounts.length, mode]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await apiService.getReports();
      if (res.success && res.data) {
        setRecentReports(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch reports:', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

  useEffect(() => {
    if (!initialLoans || activeTab !== initialView) {
        fetchData();
    }
  }, [activeTab, fetchData, initialLoans, initialView]);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error('Please select a member first');
      return;
    }
    if (loanStep < 4) {
      setLoanStep(loanStep + 1);
      return;
    }
    if (!verificationData.id_number) {
      toast.error('Identity verification (ID Number) is required.');
      return;
    }

    setLoading(true);
    const submission = {
      user: Number(selectedMember.id),
      amount: loanFormData.amount,
      purpose: loanFormData.purpose,
      term_months: loanFormData.term_months,
      interest_rate: loanFormData.interest_rate,
      date_of_birth: loanFormData.personal.dob,
      digital_address: loanFormData.personal.digital_address,
      town: loanFormData.personal.town,
      city: loanFormData.personal.city,
      id_type: verificationData.id_type,
      id_number: verificationData.id_number,
      verification_notes: verificationData.notes,
      
      // Next of Kin 1
      next_of_kin_1_name: loanFormData.nok1.name,
      next_of_kin_1_relationship: loanFormData.nok1.relationship,
      next_of_kin_1_phone: loanFormData.nok1.contact_number,
      next_of_kin_1_address: loanFormData.nok1.address,
      
      // Guarantor 1
      guarantor_1_name: loanFormData.guarantor1.name,
      guarantor_1_id_type: loanFormData.guarantor1.id_type,
      guarantor_1_id_number: loanFormData.guarantor1.id_number,
      guarantor_1_phone: loanFormData.guarantor1.contact_number,
      guarantor_1_address: loanFormData.guarantor1.address,
    };

    const res = await apiService.createLoan(submission as CreateLoanData);
    if (res.success) {
      toast.success('Loan application submitted on behalf of ' + selectedMember.full_name);
      setShowForm(false);
      setSelectedMember(null);
      setLoanStep(1);
      setVerificationData({ id_type: 'ghana_card', id_number: '', notes: '' });
      fetchData();
    } else {
      toast.error(res.error || 'Failed to submit loan');
    }
    setLoading(false);
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error('Please select a member first');
      return;
    }

    setLoading(true);
    const res = await apiService.createCashAdvance({
      ...advanceForm,
      user: Number(selectedMember.id),
      id_type: verificationData.id_type,
      id_number: verificationData.id_number,
      verification_notes: verificationData.notes
    });
    if (res.success) {
      toast.success('Cash advance requested for ' + selectedMember.full_name);
      setShowForm(false);
      setSelectedMember(null);
      setVerificationData({ id_type: 'ghana_card', id_number: '', notes: '' });
      fetchData();
    } else {
      toast.error(res.error || 'Failed to submit advance');
    }
    setLoading(false);
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.error('Please select a member first');
      return;
    }

    setLoading(true);
    const res = await apiService.createRefund({
      ...refundForm,
      user: Number(selectedMember.id),
      id_type: verificationData.id_type,
      id_number: verificationData.id_number,
      verification_notes: verificationData.notes
    });
    if (res.success) {
      toast.success('Refund request submitted for ' + selectedMember.full_name);
      setShowForm(false);
      setSelectedMember(null);
      setVerificationData({ id_type: 'ghana_card', id_number: '', notes: '' });
      fetchData();
    } else {
      toast.error(res.error || 'Failed to submit refund');
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
      const errorMsg = res.error || 'Approval failed';
      if (errorMsg.includes('no active accounts')) {
        toast.error('Disbursement Failed: Customer has no active accounts. Activate an account first.', { duration: 5000 });
      } else {
        toast.error(errorMsg);
      }
    }
    setProcessingId(null);
  };

  const handleApproveAdvance = async (id: number | string) => {
    setProcessingId(id);
    const res = await apiService.approveCashAdvance(id);
    if (res.success) {
      toast.success('Cash advance approved successfully');
      fetchData();
    } else {
      toast.error(res.error || 'Failed to approve cash advance');
    }
    setProcessingId(null);
  };

  const handleApproveRefund = async (id: number | string) => {
    setProcessingId(id);
    const res = await apiService.approveRefund(id);
    if (res.success) {
      toast.success('Refund request approved successfully');
      fetchData();
    } else {
      toast.error(res.error || 'Failed to approve refund');
    }
    setProcessingId(null);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    const loadingToast = toast.loading(`Generating ${reportFilters.type.toUpperCase()} report...`);
    try {
      const res = await apiService.generateOperationalReport({
        type: reportFilters.type,
        format: reportFilters.format as 'pdf' | 'csv',
        date_from: reportFilters.date_from,
        date_to: reportFilters.date_to
      });

      if (res.success && res.data) {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Coastal_${reportFilters.type}_Report_${new Date().toISOString().split('T')[0]}.${reportFilters.format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Report generated successfully', { id: loadingToast });
        fetchReports();
      } else {
        toast.error(res.error || 'Failed to generate report', { id: loadingToast });
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error during report generation', { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {

      case 'pending-loans': {
          const pending = loans.filter(l => l.status === 'pending');

          return (
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-coastal-primary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                    Pending Loan Approval Queue
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {pending.length} Requests Awaiting
                  </span>
                </div>
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="text-black font-black uppercase text-[10px] tracking-wider border-b border-slate-200 bg-slate-50/50">
                      <tr>
                        <th className="p-4">Borrower</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pending.length > 0 ? (
                        <>
                          {(showAllPendingLoans ? pending : pending.slice(0, 5)).map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="text-black font-bold">{loan.borrower_name || `User ${loan.user}`}</div>
                                <div className="text-[10px] text-slate-600 font-bold">{loan.purpose}</div>
                              </td>
                              <td className="p-4 text-black font-black">{formatCurrencyGHS(parseFloat(loan.amount))}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600 flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" /> PENDING REVIEW
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <Button size="sm" onClick={() => handleApproveLoan(loan.id)} disabled={processingId === loan.id}>
                                  {processingId === loan.id ? 'Processing...' : 'Approve'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {pending.length > 5 && (
                            <tr>
                              <td colSpan={4} className="p-0">
                                <button
                                  onClick={() => setShowAllPendingLoans(!showAllPendingLoans)}
                                  className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-amber-600/60 hover:text-amber-600 transition-colors bg-amber-50/30"
                                >
                                  {showAllPendingLoans ? 'Show Fewer Requests' : `View All Pending Requests (${pending.length})`}
                                </button>
                              </td>
                            </tr>
                          )}
                        </>
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 italic font-medium">
                            No pending loan applications found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          );
      }

      case 'loans': {
          const approved = loans.filter(l => l.status === 'approved');

          return (
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-coastal-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Approved Loans Portfolio
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {approved.length} Active Records
                  </span>
                </div>
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="text-black font-black uppercase text-[10px] tracking-wider border-b border-slate-200 bg-slate-50/50">
                      <tr>
                        <th className="p-4">Borrower</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4 text-right">Approval Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approved.length > 0 ? (
                        <>
                          {(showAllApprovedLoans ? approved : approved.slice(0, 5)).map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="text-black font-bold">{loan.borrower_name || `User ${loan.user}`}</div>
                                <div className="text-[10px] text-slate-600 font-bold">{loan.purpose}</div>
                              </td>
                              <td className="p-4 text-black font-black">{formatCurrencyGHS(parseFloat(loan.amount))}</td>
                              <td className="p-4 text-right text-[10px] text-slate-500 font-bold">
                                {new Date(loan.updated_at || '').toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                          {approved.length > 5 && (
                            <tr>
                              <td colSpan={3} className="p-0">
                                <button
                                  onClick={() => setShowAllApprovedLoans(!showAllApprovedLoans)}
                                  className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-emerald-600/60 hover:text-emerald-600 transition-colors bg-emerald-50/30"
                                >
                                  {showAllApprovedLoans ? 'Show Fewer Records' : `View All Approved Records (${approved.length})`}
                                </button>
                              </td>
                            </tr>
                          )}
                        </>
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400 italic font-medium">
                            No approved loans currently in the system
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          );
      }


      case 'cash_advances': {
        const pending = advances.filter(a => a.status === 'pending');
        const processed = advances.filter(a => a.status !== 'pending');

        return (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-coastal-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  Pending Advances
                </h3>
              </div>
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="text-black font-black uppercase text-[10px] tracking-wider border-b border-slate-200 bg-slate-50/50">
                    <tr>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      {mode === 'manager' && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pending.length > 0 ? pending.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-black font-bold">CA-{a.id}</td>
                        <td className="p-4 text-black font-black">{formatCurrencyGHS(parseFloat(a.amount || '0'))}</td>
                        <td className="p-4">
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600">
                            PENDING
                          </span>
                        </td>
                        {mode === 'manager' && (
                          <td className="p-4 text-right">
                            <Button size="sm" onClick={() => handleApproveAdvance(a.id)} disabled={processingId === a.id}>
                              {processingId === a.id ? 'Processing...' : 'Approve'}
                            </Button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={mode === 'manager' ? 4 : 3} className="p-8 text-center text-slate-400 italic font-medium">
                          No pending cash advances
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="opacity-80">
              <div className="flex items-center justify-between mb-4 px-1 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Advance History</h3>
              </div>
              <div className="overflow-x-auto bg-white/50 rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3 pl-4">Reference</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processed.length > 0 ? processed.map(a => (
                      <tr key={a.id} className="transition-colors grayscale hover:grayscale-0">
                        <td className="p-3 pl-4 text-slate-600 font-bold text-xs">CA-{a.id}</td>
                        <td className="p-3 text-slate-500 font-black text-xs">{formatCurrencyGHS(parseFloat(a.amount || '0'))}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${
                            a.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {a.status === 'approved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-400 italic text-xs">
                          No history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      }
      case 'refunds': {
        const pending = refunds.filter(r => r.status === 'pending');
        const processed = refunds.filter(r => r.status !== 'pending');

        return (
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-coastal-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  Pending Refunds
                </h3>
              </div>
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="text-black font-black uppercase text-[10px] tracking-wider border-b border-slate-200 bg-slate-50/50">
                    <tr>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      {mode === 'manager' && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pending.length > 0 ? pending.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-black font-bold">REF-{String(r.id).slice(-6)}</td>
                        <td className="p-4 text-black font-black">{formatCurrencyGHS(r.requested_amount || 0)}</td>
                        <td className="p-4">
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-600">
                            PENDING
                          </span>
                        </td>
                        {mode === 'manager' && (
                          <td className="p-4 text-right">
                            <Button size="sm" onClick={() => handleApproveRefund(r.id)} disabled={processingId === r.id}>
                              {processingId === r.id ? 'Processing...' : 'Approve'}
                            </Button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={mode === 'manager' ? 4 : 3} className="p-8 text-center text-slate-400 italic font-medium">
                          No pending refunds
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="opacity-80">
              <div className="flex items-center justify-between mb-4 px-1 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Refund History</h3>
              </div>
              <div className="overflow-x-auto bg-white/50 rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3 pl-4">Reference</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processed.length > 0 ? processed.map(r => (
                      <tr key={r.id} className="transition-colors grayscale hover:grayscale-0">
                        <td className="p-3 pl-4 text-slate-600 font-bold text-xs">REF-{String(r.id).slice(-6)}</td>
                        <td className="p-3 text-slate-500 font-black text-xs">{formatCurrencyGHS(r.requested_amount || 0)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${
                            r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {r.status === 'approved' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-400 italic text-xs">
                          No history found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      }
      case 'reports':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Unified Command Dock */}
            <section className="reporting-command-dock">
              <div className="reporting-dock-header">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-white mb-0.5">On-Demand Financial Reporting</h3>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Authorized Personnel Only • Encrypted Registry</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                {/* Report Type */}
                <div className="md:col-span-3 reporting-field-group">
                  <label className="reporting-label">Report Domain</label>
                  <div className="reporting-input-wrapper">
                    <select 
                      title="Select Report Domain"
                      value={reportFilters.type}
                      onChange={e => setReportFilters({...reportFilters, type: e.target.value})}
                      className="reporting-select"
                    >
                      <option value="loans">Loan Portfolio Summary</option>
                      <option value="cash_advances">Cash Advance Registry</option>
                      <option value="refunds">Refund Activity Log</option>
                      <option value="profit_summary">Profit & Loss Overview</option>
                      <option value="expenses">Operational Expenses</option>
                    </select>
                  </div>
                </div>

                {/* Format Toggle */}
                <div className="md:col-span-2 reporting-field-group">
                  <label className="reporting-label">Export Format</label>
                  <div className="format-toggle">
                    <button 
                      onClick={() => setReportFilters({...reportFilters, format: 'pdf'})}
                      className={`format-toggle-btn ${reportFilters.format === 'pdf' ? 'active' : ''}`}
                    >
                      Adobe PDF
                    </button>
                    <button 
                      onClick={() => setReportFilters({...reportFilters, format: 'csv'})}
                      className={`format-toggle-btn ${reportFilters.format === 'csv' ? 'active' : ''}`}
                    >
                      Excel CSV
                    </button>
                  </div>
                </div>

                {/* Date Range Group */}
                <div className="md:col-span-4 grid grid-cols-2 gap-4">
                  <div className="reporting-field-group">
                    <label className="reporting-label">Start Date</label>
                    <div className="reporting-input-wrapper">
                      <input 
                        type="date" 
                        title="Start Date"
                        value={reportFilters.date_from}
                        onChange={e => setReportFilters({...reportFilters, date_from: e.target.value})}
                        className="reporting-date-input" 
                      />
                    </div>
                  </div>
                  <div className="reporting-field-group">
                    <label className="reporting-label">End Date</label>
                    <div className="reporting-input-wrapper">
                      <input 
                        type="date" 
                        title="End Date"
                        value={reportFilters.date_to}
                        onChange={e => setReportFilters({...reportFilters, date_to: e.target.value})}
                        className="reporting-date-input" 
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="md:col-span-3 h-full pb-[1px]">
                  <button 
                    className="reporting-btn-primary w-full h-[46px]"
                    onClick={handleGenerateReport}
                    disabled={generating}
                  >
                    {generating ? 'Processing Engine...' : 'Export Now'}
                    {!generating && <FileDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
                 <ShieldCheck className="w-3 h-3 text-slate-600" />
                 <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">All reports are automatically watermarked and logged for security auditing.</p>
              </div>
            </section>

            {/* History Table */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
               <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recent Reports Engine Registry</h3>
                  </div>
                  <button 
                    onClick={fetchReports} 
                    className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                  >
                    Refresh List
                  </button>
                </div>

                <div className="min-h-[300px]">
                  {recentReports.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
                        <tr>
                          <th className="p-4 px-6">Domain Type</th>
                          <th className="p-4">Generated Timestamp</th>
                          <th className="p-4">Format</th>
                          <th className="p-4 text-right px-6">Command</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentReports.slice(0, 10).map((report, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                            <td className="p-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                                </div>
                                <span className="font-black text-slate-900 capitalize tracking-tight">
                                  {report.report_type?.replace(/_/g, ' ') || 'Financial Summary'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-500 font-bold text-xs font-mono">
                              {new Date(report.created_at).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase border border-slate-200">
                                {report.format?.toUpperCase() || 'PDF'}
                              </span>
                            </td>
                            <td className="p-4 text-right px-6">
                              <a 
                                href={report.file_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                              >
                                Download
                                <Download className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40 grayscale">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archived Reporting Registry Empty</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Coastal AutoTech Cryptographic Audit Trail Active</p>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">v2.4.0 Engine</p>
                </div>
            </section>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap p-1 bg-black/5 rounded-xl border border-black/5">
          {(['loans', 'cash_advances', 'refunds', 'reports'] as const)
            .filter(tab => mode === 'manager' || tab !== 'reports')
            .map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              title={`Switch to ${tab.replace('_', ' ')} view`}
              aria-label={`View ${tab.replace('_', ' ')}`}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-coastal-primary text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab === 'loans' && <CircleDollarSign className="w-3.5 h-3.5" />}
              {tab === 'cash_advances' && <Banknote className="w-3.5 h-3.5" />}
              {tab === 'refunds' && <RefreshCcw className="w-3.5 h-3.5" />}
              {tab === 'reports' && <BarChart3 className="w-3.5 h-3.5" />}
              {tab.replace('_', ' ')}
            </button>
          ))}
          {mode === 'manager' && (
            <button
               onClick={() => setActiveTab('pending-loans')}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pending-loans' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Scale className="w-3.5 h-3.5" /> Pending Loans
            </button>
          )}
        </div>
        {mode === 'staff' && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
             {showForm ? 'Cancel Request' : 'New Request'}
             {!showForm && <PlusCircle className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {showForm && mode === 'staff' && (
        <GlassCard className="p-6 border-black/10 overflow-visible">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">New Operational Request</h3>
            <span className="text-[10px] font-black bg-coastal-primary/10 text-coastal-primary px-3 py-1 rounded-full uppercase">Maker-Checker Protocol</span>
          </div>

          <MemberSearch 
            onSelect={(member) => setSelectedMember(member.id ? member : null)}
            label="1. Identity Verification"
            placeholder="Search customer by name, email or account number..."
          />

          {selectedMember && (
            <div className="mt-8 pt-8 border-t border-black/5 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="mb-6 space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">2. Identity Verification Progress</label>
                 <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <p className="text-sm font-bold text-slate-700">Initiating for <span className="text-emerald-600 underline font-black">{selectedMember.full_name}</span></p>
                 </div>

                 <GlassCard className="p-4 bg-slate-50/50 border-slate-200">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Physical ID Check</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">ID Type</label>
                            <select 
                                value={verificationData.id_type} 
                                onChange={e => setVerificationData({...verificationData, id_type: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold"
                                title="Identity Document Type"
                            >
                                <option value="ghana_card">Ghana Card</option>
                                <option value="passport">Passport</option>
                                <option value="voters_id">Voter's ID</option>
                                <option value="drivers_license">Driver's License</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">ID Number</label>
                            <Input 
                                value={verificationData.id_number} 
                                onChange={e => setVerificationData({...verificationData, id_number: e.target.value})}
                                placeholder="Enter physical ID number..."
                                className="text-xs"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Verification Notes</label>
                        <Input 
                            value={verificationData.notes} 
                            onChange={e => setVerificationData({...verificationData, notes: e.target.value})}
                            placeholder="e.g. ID matches system, address verified visually."
                            className="text-xs italic"
                        />
                    </div>
                 </GlassCard>

                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pt-2 mb-2">3. Request Category: {activeTab.replace('_', ' ')}</label>
               </div>

               {activeTab === 'loans' && (
                 <form onSubmit={handleCreateLoan} className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`h-1 flex-1 rounded-full ${loanStep >= s ? 'bg-coastal-primary' : 'bg-slate-200'}`} />
                        ))}
                    </div>

                    {loanStep === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h4 className="text-xs font-black text-slate-900 uppercase">Step 1: Personal & ID Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Date of Birth</label>
                                    <Input type="date" value={loanFormData.personal.dob} onChange={e => setLoanFormData({...loanFormData, personal: {...loanFormData.personal, dob: e.target.value}})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Digital Address (GPS)</label>
                                    <Input value={loanFormData.personal.digital_address} onChange={e => setLoanFormData({...loanFormData, personal: {...loanFormData.personal, digital_address: e.target.value}})} placeholder="GA-123-4567" required />
                                </div>
                                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Town</label>
                                        <Input value={loanFormData.personal.town} onChange={e => setLoanFormData({...loanFormData, personal: {...loanFormData.personal, town: e.target.value}})} required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">City</label>
                                        <Input value={loanFormData.personal.city} onChange={e => setLoanFormData({...loanFormData, personal: {...loanFormData.personal, city: e.target.value}})} required />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loanStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                             <h4 className="text-xs font-black text-slate-900 uppercase">Step 2: Financial Details</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Loan Amount (GHS)</label>
                                    <Input type="number" value={loanFormData.amount} onChange={e => setLoanFormData({...loanFormData, amount: Number(e.target.value)})} placeholder="0.00" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Term (Months)</label>
                                    <select 
                                        value={loanFormData.term_months} 
                                        onChange={e => setLoanFormData({...loanFormData, term_months: Number(e.target.value)})}
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold h-[42px]"
                                        title="Select Loan Term"
                                        aria-label="Select Loan Term"
                                    >
                                        <option value="6">6 Months</option>
                                        <option value="12">12 Months</option>
                                        <option value="24">24 Months</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Interest Rate (%)</label>
                                    <Input type="number" step="0.1" value={loanFormData.interest_rate} onChange={e => setLoanFormData({...loanFormData, interest_rate: Number(e.target.value)})} required />
                                </div>
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Purpose of Loan</label>
                                <Input value={loanFormData.purpose} onChange={e => setLoanFormData({...loanFormData, purpose: e.target.value})} placeholder="e.g. Business Expansion" required />
                             </div>
                        </div>
                    )}

                    {loanStep === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                             <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Step 3: Next of Kin (NOK 1)</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Full Name</label>
                                    <Input value={loanFormData.nok1.name} onChange={e => setLoanFormData({...loanFormData, nok1: {...loanFormData.nok1, name: e.target.value}})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Relationship</label>
                                    <Input value={loanFormData.nok1.relationship} onChange={e => setLoanFormData({...loanFormData, nok1: {...loanFormData.nok1, relationship: e.target.value}})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Contact Number</label>
                                    <Input value={loanFormData.nok1.contact_number} onChange={e => setLoanFormData({...loanFormData, nok1: {...loanFormData.nok1, contact_number: e.target.value}})} required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Home Address</label>
                                    <Input value={loanFormData.nok1.address} onChange={e => setLoanFormData({...loanFormData, nok1: {...loanFormData.nok1, address: e.target.value}})} required />
                                </div>
                             </div>
                        </div>
                    )}

                    {loanStep === 4 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                             <h4 className="text-xs font-black text-slate-900 uppercase">Step 4: Primary Guarantor</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Guarantor Name</label>
                                    <Input value={loanFormData.guarantor1.name} onChange={e => setLoanFormData({...loanFormData, guarantor1: {...loanFormData.guarantor1, name: e.target.value}})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Occupation / Employer</label>
                                    <Input value={loanFormData.guarantor1.occupation} onChange={e => setLoanFormData({...loanFormData, guarantor1: {...loanFormData.guarantor1, occupation: e.target.value}})} required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Contact Number</label>
                                    <Input value={loanFormData.guarantor1.contact_number} onChange={e => setLoanFormData({...loanFormData, guarantor1: {...loanFormData.guarantor1, contact_number: e.target.value}})} required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Home Address</label>
                                    <Input value={loanFormData.guarantor1.address} onChange={e => setLoanFormData({...loanFormData, guarantor1: {...loanFormData.guarantor1, address: e.target.value}})} required />
                                </div>
                             </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-black/5">
                        {loanStep > 1 && (
                            <Button type="button" variant="secondary" onClick={() => setLoanStep(loanStep - 1)} className="flex-1 font-black uppercase">
                                Back
                            </Button>
                        )}
                        <Button type="submit" className="flex-1 font-black uppercase" disabled={loading}>
                            {loanStep < 4 ? 'Continue' : (loading ? 'Processing...' : 'Submit Final Application')}
                        </Button>
                    </div>
                 </form>
               )}

               {activeTab === 'cash_advances' && (
                 <form onSubmit={handleCreateAdvance} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Advance Amount (GHS)</label>
                        <Input 
                            type="number" 
                            value={advanceForm.amount} 
                            onChange={e => setAdvanceForm({...advanceForm, amount: e.target.value})} 
                            placeholder="0.00"
                            required 
                        />
                        </div>
                        <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Expected Repayment Date</label>
                        <Input 
                            type="date" 
                            value={advanceForm.repayment_date} 
                            onChange={e => setAdvanceForm({...advanceForm, repayment_date: e.target.value})} 
                            required 
                        />
                        </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Reason for Advance</label>
                      <Input 
                         value={advanceForm.reason} 
                         onChange={e => setAdvanceForm({...advanceForm, reason: e.target.value})} 
                         placeholder="Emergency funds, petty cash, etc."
                         required 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full font-black uppercase py-4" 
                      disabled={loading}
                      title="Submit new cash advance request"
                    >
                      {loading ? 'Processing...' : 'Request Cash Advance'}
                    </Button>
                 </form>
               )}

               {activeTab === 'refunds' && (
                 <form onSubmit={handleCreateRefund} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Transaction ID (Reference)</label>
                            <Input 
                                value={refundForm.transaction_id} 
                                onChange={e => setRefundForm({...refundForm, transaction_id: e.target.value})} 
                                placeholder="TRX-123456"
                                required 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Refund Amount (GHS)</label>
                            <Input 
                                type="number" 
                                value={refundForm.amount} 
                                onChange={e => setRefundForm({...refundForm, amount: e.target.value})} 
                                placeholder="0.00"
                                required 
                            />
                        </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block">Description of Claim</label>
                      <Input 
                         value={refundForm.description} 
                         onChange={e => setRefundForm({...refundForm, description: e.target.value})} 
                         placeholder="Incorrect charge, double deduction, etc."
                         required 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full font-black uppercase py-4" 
                      disabled={loading}
                      title="Submit new refund request"
                    >
                      {loading ? 'Processing...' : 'Submit Refund Request'}
                    </Button>
                 </form>
               )}
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden border-black/5">
        <div className="p-4 border-b border-black/5 bg-black/5 flex justify-between items-center">
          <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] ml-1">{activeTab.replace('-', ' ')} Queue</h4>
          <button 
            onClick={fetchData} 
            className="text-[10px] text-coastal-primary font-black uppercase tracking-widest hover:underline"
            title="Synchronize real-time financial data"
            aria-label="Refresh Queue"
          >
            RE-SYNC HUB
          </button>
        </div>
        <div className="p-2">
          {renderTabContent()}
        </div>
      </GlassCard>
    </div>
  );
};

export default FinancialRequestsHub;
