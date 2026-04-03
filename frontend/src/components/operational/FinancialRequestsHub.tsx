import { LoanExtended as Loan, Account, CashAdvance, Refund } from '../../services/api';
import { CashAdvanceStatusEnum } from '../../api/models/CashAdvanceStatusEnum';
import { RefundStatusEnum } from '../../api/models/RefundStatusEnum';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface FinancialRequestsHubProps {
  view: 'loans' | 'cash-advances' | 'refunds' | 'pending-loans';
  loans?: Loan[];
  pendingLoans?: Loan[];
  cashAdvances?: CashAdvance[];
  refunds?: Refund[];
  accounts?: Account[];
  isProcessing?: string | number | null;

  // Handlers
  onApproveLoan?: (id: number | string) => void;
  onRejectLoan?: (id: number | string) => void;
  onApproveCashAdvance?: (id: number | string) => void;
  onRejectCashAdvance?: (id: number | string) => void;
  onApproveRefund?: (id: number | string) => void;
  onRejectRefund?: (id: number | string) => void;

  // Form State / Handlers (Simplified for extraction)
  newLoan?: { amount: string, purpose: string, term_months: string, account: string };
  setNewLoan?: (val: any) => void;
  handleCreateLoan?: () => void;
}

const FinancialRequestsHub: React.FC<FinancialRequestsHubProps> = ({
  view,
  loans = [],
  pendingLoans = [],
  cashAdvances = [],
  refunds = [],
  accounts = [],
  isProcessing = null,
  onApproveLoan,
  onRejectLoan,
  onApproveCashAdvance,
  onRejectCashAdvance,
  onApproveRefund,
  onRejectRefund,
  newLoan,
  setNewLoan,
  handleCreateLoan
}) => {

  const renderLoans = () => (
    <div className="space-y-6">
      {newLoan && setNewLoan && handleCreateLoan && (
        <GlassCard className="p-6 border-t-[6px] border-t-emerald-600">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Apply for a Loan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              type="number"
              placeholder="0.00"
              label="Loan Amount"
              value={newLoan.amount}
              onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
            />
            <Input
              type="text"
              placeholder="e.g. Business expansion"
              label="Purpose"
              value={newLoan.purpose}
              onChange={(e) => setNewLoan({ ...newLoan, purpose: e.target.value })}
            />
            <Input
              type="number"
              placeholder="e.g. 12"
              label="Term (months)"
              value={newLoan.term_months}
              onChange={(e) => setNewLoan({ ...newLoan, term_months: e.target.value })}
            />
            <div>
              <label htmlFor="loan-account" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Account</label>
              <select
                id="loan-account"
                title="Select Account"
                value={newLoan.account}
                onChange={(e) => setNewLoan({ ...newLoan, account: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50 text-sm"
              >
                <option value="">Select Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.account_type_display} - {account.account_number}</option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={handleCreateLoan} className="mt-4 w-full md:w-auto" variant="primary">
            Apply for Loan 💰
          </Button>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Active Loans</h3>
        {loans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400">No active loans found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => (
              <div key={loan.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group">
                <h4 className="text-2xl font-black text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                  ${loan.amount?.toLocaleString()}
                </h4>
                <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{loan.purpose}</p>
                <div className="flex justify-between items-center">
                  <span className={`
                    px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${loan.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    loan.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {loan.status}
                  </span>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    {loan.term_months}mo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );

  const renderPendingLoans = () => (
    <GlassCard className="p-6 border-t-[6px] border-t-orange-500">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Pending Loan Approvals</h3>
      <div className="space-y-4">
        {pendingLoans.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No pending loan approvals.</p>
        ) : (
          pendingLoans.map((loan) => (
            <div key={loan.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-orange-200 transition-colors">
              <div className="mb-4 md:mb-0">
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  ${loan.amount?.toLocaleString()} <span className="font-normal text-gray-500 text-sm">for {loan.borrower_name || loan.applicant || 'Unknown'}</span>
                </h4>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">🎯 {loan.purpose}</span>
                  <span className="flex items-center gap-1">📅 {new Date(loan.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  size="sm"
                  onClick={() => onApproveLoan?.(loan.id)}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve ✅
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1 md:flex-none"
                  onClick={() => onRejectLoan?.(loan.id)}
                >
                  Reject ❌
                </Button>
              </div>
            </div>
          )
        ))}
      </div>
    </GlassCard>
  );

  const renderCashAdvances = () => (
    <GlassCard className="p-6 border-t-[6px] border-t-amber-500">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Cash Advance Requests</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cashAdvances.length === 0 ? (
          <p className="col-span-full text-gray-400 text-center py-12">No cash advance requests found.</p>
        ) : (
          cashAdvances.map((advance) => (
            <div key={advance.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col hover:border-amber-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-2xl font-black text-gray-800">
                    ${parseFloat(advance.amount || '0').toLocaleString()}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Requested: {new Date(advance.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`
                  px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter
                  ${advance.status === CashAdvanceStatusEnum.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                    advance.status === CashAdvanceStatusEnum.PENDING ? 'bg-amber-100 text-amber-700' :
                    advance.status === CashAdvanceStatusEnum.REJECTED ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                `}>
                  {advance.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-6 line-clamp-3 bg-gray-50 p-2 rounded-lg italic">"{advance.reason || 'No reason provided'}"</p>

              {advance.status === CashAdvanceStatusEnum.PENDING && (
                <div className="flex gap-2 pt-4 border-t border-gray-50 mt-auto">
                  <Button
                    className="flex-1 text-[10px] h-9"
                    size="sm"
                    onClick={() => onApproveCashAdvance?.(advance.id)}
                    disabled={isProcessing === advance.id}
                  >
                    {isProcessing === advance.id ? 'Processing...' : 'Approve ✅'}
                  </Button>
                  <Button
                    className="flex-1 text-[10px] h-9"
                    variant="danger"
                    size="sm"
                    onClick={() => onRejectCashAdvance?.(advance.id)}
                    disabled={isProcessing === advance.id}
                  >
                    {isProcessing === advance.id ? 'Processing...' : 'Reject ❌'}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );

  const renderRefunds = () => (
    <GlassCard className="p-6 border-t-[6px] border-t-blue-500">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Transaction Refund Requests</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {refunds.length === 0 ? (
          <p className="col-span-full text-gray-400 text-center py-12">No refund requests found.</p>
        ) : (
          refunds.map((refund) => (
            <div key={refund.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-2xl font-black text-gray-800">
                    ${parseFloat(refund.amount || '0').toLocaleString()}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Ref ID: {(refund as any).transaction_id || (refund as any).transaction || 'N/A'}</p>
                </div>
                <span className={`
                  px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter
                  ${refund.status === RefundStatusEnum.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                    refund.status === RefundStatusEnum.PENDING ? 'bg-amber-100 text-amber-700' :
                    refund.status === RefundStatusEnum.REJECTED ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                `}>
                  {refund.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-6 line-clamp-3 bg-gray-50 p-2 rounded-lg italic">"{refund.reason || 'No reason provided'}"</p>

              {refund.status === RefundStatusEnum.PENDING && (
                <div className="flex gap-2 pt-4 border-t border-gray-50 mt-auto">
                  <Button
                    className="flex-1 text-[10px] h-9"
                    size="sm"
                    onClick={() => onApproveRefund?.(refund.id)}
                    disabled={isProcessing === refund.id}
                  >
                    {isProcessing === refund.id ? '...' : 'Approve ✅'}
                  </Button>
                  <Button
                    className="flex-1 text-[10px] h-9"
                    variant="danger"
                    size="sm"
                    onClick={() => onRejectRefund?.(refund.id)}
                    disabled={isProcessing === refund.id}
                  >
                    {isProcessing === refund.id ? '...' : 'Reject ❌'}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );

  switch (view) {
    case 'loans': return renderLoans();
    case 'pending-loans': return renderPendingLoans();
    case 'cash-advances': return renderCashAdvances();
    case 'refunds': return renderRefunds();
    default: return null;
  }
};

export default FinancialRequestsHub;
