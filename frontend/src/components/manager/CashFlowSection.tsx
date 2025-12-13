import React from 'react';
import { THEME } from './ManagerTheme';

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
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>⏳</div>
        <p>Loading cash flow data...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isNetPositive = cashFlow.net_cash_flow >= 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>🌊 Cash Flow Analysis</h3>
        <span style={{
          background: THEME.colors.secondary,
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '700'
        }}>
          📅 {cashFlow.period}
        </span>
      </div>

      {/* Main Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Net Cash Flow */}
        <div style={{
          background: isNetPositive ? THEME.colors.bg : '#ffebee',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: `2px solid ${isNetPositive ? THEME.colors.success : THEME.colors.danger}`,
          boxShadow: THEME.shadows.card,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px'
        }}>
          <div style={{ fontSize: '16px', color: '#666', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
            Net Cash Flow
          </div>
          <div style={{
            fontSize: '42px',
            fontWeight: '900',
            color: isNetPositive ? THEME.colors.success : THEME.colors.danger
          }}>
            {formatCurrency(cashFlow.net_cash_flow)}
          </div>
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '700',
            color: isNetPositive ? THEME.colors.success : THEME.colors.danger
          }}>
            {isNetPositive ? '📈 Net Positive' : '📉 Net Negative'}
          </div>
        </div>

        {/* Inflow Card */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: THEME.colors.success }}>
              📥 Total Inflow
            </h4>
            <div style={{ fontSize: '24px', fontWeight: '900' }}>
              {formatCurrency(cashFlow.inflow.total)}
            </div>
          </div>

          <div style={{ borderTop: '2px dashed #eee', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Deposits</span>
              <span style={{ fontWeight: '700' }}>{formatCurrency(cashFlow.inflow.deposits)}</span>
            </div>
            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(cashFlow.inflow.deposits / cashFlow.inflow.total) * 100 || 0}%`,
                background: THEME.colors.success
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Loan Repayments</span>
              <span style={{ fontWeight: '700' }}>{formatCurrency(cashFlow.inflow.loan_repayments)}</span>
            </div>
            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(cashFlow.inflow.loan_repayments / cashFlow.inflow.total) * 100 || 0}%`,
                background: THEME.colors.info
              }} />
            </div>
          </div>
        </div>

        {/* Outflow Card */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: THEME.colors.danger }}>
              📤 Total Outflow
            </h4>
            <div style={{ fontSize: '24px', fontWeight: '900' }}>
              {formatCurrency(cashFlow.outflow.total)}
            </div>
          </div>

          <div style={{ borderTop: '2px dashed #eee', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Withdrawals</span>
              <span style={{ fontWeight: '700' }}>{formatCurrency(cashFlow.outflow.withdrawals)}</span>
            </div>
            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(cashFlow.outflow.withdrawals / cashFlow.outflow.total) * 100 || 0}%`,
                background: THEME.colors.danger
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Loan Disbursements</span>
              <span style={{ fontWeight: '700' }}>{formatCurrency(cashFlow.outflow.loan_disbursements)}</span>
            </div>
            <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(cashFlow.outflow.loan_disbursements / cashFlow.outflow.total) * 100 || 0}%`,
                background: THEME.colors.warning
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowSection;