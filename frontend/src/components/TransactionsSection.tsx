import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrencyGHS } from '../utils/formatters';
import { apiService } from '../services/api';
import './TransactionsSection.css';

function TransactionsSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const result = await apiService.getTransactions();
      return result.data?.results || [];
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading transactions</div>;

  const transactions = data || [];

  return (
    <div className="transactions-container">
      <h3 className="transactions-header">
        All Financial Transactions
      </h3>
      <div className="table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(transactions) && transactions.slice(0, 10).map((transaction, index) => (
              <tr key={index}>
                <td>{transaction.id}</td>
                <td>{transaction.transaction_type}</td>
                <td>{formatCurrencyGHS(transaction.amount)}</td>
                <td>{transaction.status}</td>
                <td>{new Date(transaction.timestamp).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionsSection;
