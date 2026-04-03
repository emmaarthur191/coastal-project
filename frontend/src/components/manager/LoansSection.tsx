import React from 'react';
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
}

const LoansSection: React.FC<LoansSectionProps> = ({ loans, handleApproveLoan, pagination, onPageChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-3xl">📝</span> Loan Applications
        </h3>
        {pagination && pagination.total_count > 0 && (
          <span className="text-sm font-medium text-gray-500">
            Total: {pagination.total_count}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        loan.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                      {loan.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-gray-900 mb-1">{loan.applicant_name || 'Unknown Applicant'}</h4>
                  <p className="text-2xl font-black text-gray-900 mb-4">
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
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-6xl mb-6 animate-bounce">📝</div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">No loan applications</h4>
          <p className="text-gray-500">All loans are up to date! 🎉</p>
        </GlassCard>
      )}
    </div>
  );
};

export default LoansSection;
