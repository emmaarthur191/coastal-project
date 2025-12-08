import React from 'react';
import { PlayfulCard, THEME } from './CashierTheme';
import { formatCurrencyGHS } from '../../utils/formatters';

interface Transaction {
  id: string;
  amount: number;
}

interface OverviewTabProps {
  dailySummary: {
    transactions: number;
    totalAmount: string;
    cashOnHand: string;
    pendingApprovals: number;
  };
  transactions: Transaction[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ dailySummary, transactions }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      <PlayfulCard color="#F8EFBA">
        <h4 style={{ margin: 0, color: THEME.colors.warning }}>Transactions Today</h4>
        <p style={{ fontSize: '32px', fontWeight: '900', margin: '10px 0', color: THEME.colors.text }}>{dailySummary.transactions}</p>
      </PlayfulCard>
      <PlayfulCard color="#55EFC4">
        <h4 style={{ margin: 0, color: '#006266' }}>Total Amount</h4>
        <p style={{ fontSize: '32px', fontWeight: '900', margin: '10px 0', color: '#006266' }}>{dailySummary.totalAmount}</p>
      </PlayfulCard>
      <PlayfulCard color="#74B9FF">
        <h4 style={{ margin: 0, color: '#0984e3' }}>Cash On Hand</h4>
        <p style={{ fontSize: '32px', fontWeight: '900', margin: '10px 0', color: '#0984e3' }}>{dailySummary.cashOnHand}</p>
      </PlayfulCard>
      <PlayfulCard>
        <h4>Recent Transactions</h4>
        {transactions.slice(0, 5).map((tx, i) => (
          <div key={i} style={{ borderBottom: '2px dashed #eee', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
            <span>{tx.id || 'TX-ID'}</span>
            <strong>{formatCurrencyGHS(tx.amount)}</strong>
          </div>
        ))}
      </PlayfulCard>
    </div>
  );
};

export default OverviewTab;