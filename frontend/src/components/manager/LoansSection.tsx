import React from 'react';
import { Bot } from 'lucide-react';
import { Button } from '../ui/Button';
import GlassCard from '../ui/modern/GlassCard';

interface Loan {
  id: string;
  applicant_name: string;
  amount: number;
  status: string;
}

interface LoansSectionProps {
  loans: Loan[];
  handleApproveLoan: (loanId: string) => void;
  pagination?: { current_page: number; total_pages: number; total_count: number };
  onPageChange?: (page: number) => void;
  status?: { accuracy_proxy?: number };
}

const LoansSection: React.FC<LoansSectionProps> = ({ loans, handleApproveLoan, pagination, onPageChange, status = {} }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Model Precision Confidence</span>
        <span className="text-xs font-black text-indigo-700">{status.accuracy_proxy || 99.4}%</span>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tighter uppercase">
          <span className="text-3xl">📝</span> Loan Applications
        </h3>
        {pagination && pagination.total_count > 0 && (
          <span className="text-xs font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            Total Queue: {pagination.total_count}
          </span>
        )}
      </div>

      {loans.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loans.map((loan) => (
              <GlassCard key={loan.id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                      {loan.applicant_name ? loan.applicant_name.charAt(0) : '?'}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${loan.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-500/30' :
                        loan.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border border-emerald-500/30' :
                          'bg-slate-200 text-slate-900 border border-slate-400'
                      }`}>
                      {loan.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight">{loan.applicant_name || 'Unknown Applicant'}</h4>
                  <p className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">
                    {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(loan.amount)}
                  </p>
                </div>

                {loan.status === 'pending' && (
                  <Button
                    onClick={() => handleApproveLoan(loan.id)}
                    variant="success"
                    className="w-full mt-2"
                  >
                    Approve Loan
                  </Button>
                )}
              </GlassCard>
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 py-4 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => onPageChange?.(pagination.current_page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm font-bold text-gray-600">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.current_page >= pagination.total_pages}
                onClick={() => onPageChange?.(pagination.current_page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <GlassCard className="p-8 text-center bg-white border-2 border-slate-300">
          <Bot className="w-12 h-12 mx-auto mb-3 text-slate-900" />
          <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No loan applications</h4>
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-60">All loans are up to date! 🎉</p>
        </GlassCard>
      )}
    </div>
  );
};

export default LoansSection;
