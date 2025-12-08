import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrencyGHS } from '../utils/formatters';
import { apiService } from '../services/api';

function TransactionsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: apiService.getTransactions
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading transactions</div>;

  const transactions = data?.data || data || [];

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
         All Financial Transactions
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Reference</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(transactions) && transactions.slice(0, 10).map((transaction, index) => (
              <tr key={index}>
                <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{transaction.reference}</td>
                <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{transaction.type}</td>
                <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{formatCurrencyGHS(transaction.amount)}</td>
                <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{transaction.status}</td>
                <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{new Date(transaction.timestamp).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionsSection;