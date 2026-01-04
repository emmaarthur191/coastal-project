import React from 'react';
import { formatCurrencyGHS } from '../utils/formatters';

function InterestSection({ interestData }) {
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
         Interest Calculations
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{formatCurrencyGHS(interestData.total_loan_balance)}</div>
          <div style={{ color: '#64748b' }}>Total Loan Balance</div>
        </div>
        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{formatCurrencyGHS(interestData.calculated_interest)}</div>
          <div style={{ color: '#64748b' }}>Calculated Interest ({interestData.interest_rate * 100}%)</div>
        </div>
      </div>
    </div>
  );
}

export default InterestSection;
