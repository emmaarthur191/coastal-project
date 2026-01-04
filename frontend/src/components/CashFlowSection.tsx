import { formatCurrencyGHS } from '../utils/formatters';

interface CashFlowData {
  inflows?: number;
  outflows?: number;
  expenses?: number;
  net?: number;
  commissions?: number;
  inflow_breakdown?: Record<string, number>;
  outflow_breakdown?: Record<string, number>;
  summary?: Record<string, unknown>;
  period?: { start_date: string; end_date: string };
}

function CashFlowSection({ cashFlow }: { cashFlow: CashFlowData }) {
  const inflowBreakdown = cashFlow.inflow_breakdown || {};
  const outflowBreakdown = cashFlow.outflow_breakdown || {};
  const _summary = cashFlow.summary || {};

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        color: '#1e293b',
        fontSize: '20px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        Cash Flow Analysis
      </h3>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ textAlign: 'center', padding: '20px', background: '#dcfce7', borderRadius: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>{formatCurrencyGHS(cashFlow.inflows || 0)}</div>
          <div style={{ color: '#166534', fontWeight: '600' }}>Total Inflows</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: '#fecaca', borderRadius: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{formatCurrencyGHS(cashFlow.outflows || cashFlow.expenses || 0)}</div>
          <div style={{ color: '#dc2626', fontWeight: '600' }}>Total Outflows</div>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', background: cashFlow.net >= 0 ? '#dcfce7' : '#fecaca', borderRadius: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: cashFlow.net >= 0 ? '#166534' : '#dc2626' }}>{formatCurrencyGHS(cashFlow.net || 0)}</div>
          <div style={{ color: cashFlow.net >= 0 ? '#166534' : '#dc2626', fontWeight: '600' }}>Net Cash Flow</div>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Inflows Breakdown */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #86efac'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            color: '#166534',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Cash Inflows Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inflowBreakdown.deposits > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Deposits</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.deposits)}</span>
              </div>
            )}
            {inflowBreakdown.loan_repayments > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Loan Repayments</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.loan_repayments)}</span>
              </div>
            )}
            {inflowBreakdown.interest_income > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Interest Income</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.interest_income)}</span>
              </div>
            )}
            {inflowBreakdown.service_charges > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Service Charges</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.service_charges)}</span>
              </div>
            )}
            {inflowBreakdown.fees > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Transaction Fees</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.fees)}</span>
              </div>
            )}
            {inflowBreakdown.transfers_in > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}>↗ Transfers In</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.transfers_in)}</span>
              </div>
            )}
            {cashFlow.commissions > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Commissions</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(cashFlow.commissions)}</span>
              </div>
            )}
            {inflowBreakdown.other > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #bbf7d0' }}>
                <span style={{ color: '#166534', fontWeight: '500' }}> Other Income</span>
                <span style={{ color: '#166534', fontWeight: '700' }}>{formatCurrencyGHS(inflowBreakdown.other)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Outflows Breakdown */}
        <div style={{
          background: '#fef2f2',
          borderRadius: '12px',
          padding: '20px',
          border: '2px solid #fca5a5'
        }}>
          <h4 style={{
            margin: '0 0 16px 0',
            color: '#dc2626',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Cash Outflows Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {outflowBreakdown.withdrawals > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                <span style={{ color: '#dc2626', fontWeight: '500' }}> Withdrawals</span>
                <span style={{ color: '#dc2626', fontWeight: '700' }}>{formatCurrencyGHS(outflowBreakdown.withdrawals)}</span>
              </div>
            )}
            {outflowBreakdown.loan_disbursements > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                <span style={{ color: '#dc2626', fontWeight: '500' }}> Loan Disbursements</span>
                <span style={{ color: '#dc2626', fontWeight: '700' }}>{formatCurrencyGHS(outflowBreakdown.loan_disbursements)}</span>
              </div>
            )}
            {outflowBreakdown.transfers_out > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                <span style={{ color: '#dc2626', fontWeight: '500' }}>↙ Transfers Out</span>
                <span style={{ color: '#dc2626', fontWeight: '700' }}>{formatCurrencyGHS(outflowBreakdown.transfers_out)}</span>
              </div>
            )}
            {outflowBreakdown.expenses > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fecaca' }}>
                <span style={{ color: '#dc2626', fontWeight: '500' }}> Operating Expenses</span>
                <span style={{ color: '#dc2626', fontWeight: '700' }}>{formatCurrencyGHS(outflowBreakdown.expenses)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Information */}
      {cashFlow.period && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          Period: {new Date(cashFlow.period.start_date).toLocaleDateString()} - {new Date(cashFlow.period.end_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default CashFlowSection;
