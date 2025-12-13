import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { THEME } from './ManagerTheme';

interface Transaction {
  id: number;
  amount: string | number;
  transaction_type: string;
  description: string;
  status: string;
  timestamp: string;
  from_account?: any;
  to_account?: any;
}

const TransactionsSection: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await authService.getAllTransactions();
      if (response.success) {
        const txData = Array.isArray(response.data) ? response.data :
          (response.data?.results || []);
        setTransactions(txData);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return THEME.colors.success;
      case 'pending': return THEME.colors.warning;
      case 'failed': return THEME.colors.danger;
      case 'cancelled': return '#95a5a6';
      default: return THEME.colors.secondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'transfer': return '🔄';
      case 'payment': return '💳';
      case 'fee': return '📋';
      default: return '💵';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filter.type === 'all' || tx.transaction_type === filter.type;
    const matchesStatus = filter.status === 'all' || tx.status === filter.status;
    const matchesSearch = filter.search === '' ||
      tx.description.toLowerCase().includes(filter.search.toLowerCase()) ||
      tx.id.toString().includes(filter.search);
    return matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>⏳</div>
        <p>Loading transactions...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>💸 All Transactions</h3>
        <button
          onClick={fetchTransactions}
          style={{
            padding: '10px 20px',
            background: THEME.colors.primary,
            color: '#fff',
            border: '2px solid #000',
            borderRadius: THEME.radius.button,
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: THEME.shadows.button
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: THEME.radius.card,
        border: '2px solid #000',
        boxShadow: THEME.shadows.card,
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Search</label>
          <input
            type="text"
            placeholder="ID or description..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #000',
              borderRadius: THEME.radius.input,
              fontFamily: "'Nunito', sans-serif"
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Type</label>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #000',
              borderRadius: THEME.radius.input,
              fontFamily: "'Nunito', sans-serif"
            }}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="transfer">Transfer</option>
            <option value="payment">Payment</option>
            <option value="fee">Fee</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Status</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #000',
              borderRadius: THEME.radius.input,
              fontFamily: "'Nunito', sans-serif"
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <div style={{ fontSize: '24px', fontWeight: '900' }}>{filteredTransactions.length}</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Transactions</div>
        </div>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '24px', fontWeight: '900' }}>
            {filteredTransactions.filter(t => t.status === 'completed').length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Completed</div>
        </div>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
          <div style={{ fontSize: '24px', fontWeight: '900' }}>
            {filteredTransactions.filter(t => t.status === 'pending').length}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Pending</div>
        </div>
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
          <div style={{ fontSize: '20px', fontWeight: '900' }}>
            {formatCurrency(
              filteredTransactions
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0)
            )}
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total Volume</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{
        background: '#fff',
        borderRadius: THEME.radius.card,
        border: '2px solid #000',
        boxShadow: THEME.shadows.card,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: THEME.colors.bg, borderBottom: '2px solid #000' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900' }}>ID</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900' }}>Type</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900' }}>Amount</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900' }}>Description</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '900' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <p>No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, index) => (
                  <tr
                    key={tx.id}
                    style={{
                      borderBottom: '1px solid #e0e0e0',
                      background: index % 2 === 0 ? '#fff' : '#fafafa',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#fff' : '#fafafa'}
                  >
                    <td style={{ padding: '16px', fontWeight: '700' }}>#{tx.id}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '20px', marginRight: '8px' }}>{getTypeIcon(tx.transaction_type)}</span>
                      {tx.transaction_type}
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700', color: THEME.colors.success }}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.description || 'No description'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: getStatusColor(tx.status),
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsSection;