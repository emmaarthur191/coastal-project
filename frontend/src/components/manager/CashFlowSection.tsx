import React from 'react';
import GlassCard from '../ui/modern/GlassCard';

interface CashFlowSectionProps {
  cashFlow: {
    inflow: {
      total: number;
      deposits: number;
      loan_repayments: number;
    };
    outflow: {
      total: number;
      withdrawals: number;
      loan_disbursements: number;
    };
    net_cash_flow: number;
    period: string;
  } | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 2
  }).format(amount);
};

const CashFlowSection: React.FC<CashFlowSectionProps> = ({ cashFlow }) => {
  if (!cashFlow) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl animate-spin-slow mb-4">⏳</div>
        <p className="text-gray-500 font-medium">Loading cash flow data...</p>
      </div>
    );
  }

  const isNetPositive = cashFlow.net_cash_flow >= 0;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="m-0 text-2xl font-black text-gray-800">🌊 Cash Flow Analysis</h3>
        <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200">
          📅 {cashFlow.period}
        </span>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Cash Flow */}
        <GlassCard
          className={`
                flex flex-col items-center justify-center p-8 min-h-[220px]
                ${isNetPositive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}
            `}
        >
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
            Net Cash Flow
          </div>
          <div className={`
              text-4xl font-black mb-2
              ${isNetPositive ? 'text-emerald-600' : 'text-red-600'}
          `}>
            {formatCurrency(cashFlow.net_cash_flow)}
          </div>
          <div className={`
              flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full
              ${isNetPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
          `}>
            {isNetPositive ? '📈 Net Positive' : '📉 Net Negative'}
          </div>
        </GlassCard>

        {/* Inflow Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="m-0 text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">📥</span> Total Inflow
            </h4>
            <div className="text-2xl font-black text-emerald-600">
              {formatCurrency(cashFlow.inflow.total)}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 flex flex-col gap-4 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 font-medium">Deposits</span>
                <span className="font-bold text-gray-800">{formatCurrency(cashFlow.inflow.deposits)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(cashFlow.inflow.deposits / cashFlow.inflow.total) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 font-medium">Loan Repayments</span>
                <span className="font-bold text-gray-800">{formatCurrency(cashFlow.inflow.loan_repayments)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(cashFlow.inflow.loan_repayments / cashFlow.inflow.total) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Outflow Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <h4 className="m-0 text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="text-xl">📤</span> Total Outflow
            </h4>
            <div className="text-2xl font-black text-red-600">
              {formatCurrency(cashFlow.outflow.total)}
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 flex flex-col gap-4 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 font-medium">Withdrawals</span>
                <span className="font-bold text-gray-800">{formatCurrency(cashFlow.outflow.withdrawals)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(cashFlow.outflow.withdrawals / cashFlow.outflow.total) * 100 || 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 font-medium">Loan Disbursements</span>
                <span className="font-bold text-gray-800">{formatCurrency(cashFlow.outflow.loan_disbursements)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(cashFlow.outflow.loan_disbursements / cashFlow.outflow.total) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowSection;