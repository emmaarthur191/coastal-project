import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.ts';
import { formatCurrencyGHS } from '../utils/formatters';
import { sanitizeUserInput } from '../utils/sanitizer';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    category: 'all',
    dateRange: '7days',
    search: '',
    sortBy: 'timestamp',
    sortOrder: 'desc',
    memberName: '',
    tags: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadBalanceData();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // Build query parameters for enhanced API
      const params = {
        page_size: 50,
        page: 1
      };

      if (filters.type !== 'all') params.type = filters.type;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.memberName) params.member_name = filters.memberName;
      if (filters.tags) params.tags = filters.tags;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.sortOrder) params.sort_order = filters.sortOrder;

      // Handle date range
      if (filters.dateRange !== 'custom') {
        const now = new Date();
        let dateFrom = new Date();

        switch (filters.dateRange) {
          case '7days':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case '30days':
            dateFrom.setDate(now.getDate() - 30);
            break;
          case '90days':
            dateFrom.setDate(now.getDate() - 90);
            break;
          default:
            dateFrom.setDate(now.getDate() - 7);
        }
        params.date_from = dateFrom.toISOString().split('T')[0];
        params.date_to = now.toISOString().split('T')[0];
      }

      const result = await apiService.getTransactions(params);
      setTransactions(result.transactions || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBalanceData = async () => {
    try {
      setLoadingBalance(true);
      const result = await apiService.getBalanceInquiry();
      setBalanceData(result);
    } catch (error) {
      console.error('Failed to load balance data:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleExport = async () => {
    try {
      // Use the same parameters as the current transaction load
      const params = {
        page_size: 10000  // Export all transactions (up to limit)
      };

      if (filters.type !== 'all') params.type = filters.type;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.memberName) params.member_name = filters.memberName;
      if (filters.tags) params.tags = filters.tags;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.sortOrder) params.sort_order = filters.sortOrder;

      // Handle date range
      if (filters.dateRange !== 'custom') {
        const now = new Date();
        let dateFrom = new Date();

        switch (filters.dateRange) {
          case '7days':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case '30days':
            dateFrom.setDate(now.getDate() - 30);
            break;
          case '90days':
            dateFrom.setDate(now.getDate() - 90);
            break;
          default:
            dateFrom.setDate(now.getDate() - 7);
        }
        params.date_from = dateFrom.toISOString().split('T')[0];
        params.date_to = now.toISOString().split('T')[0];
      }

      const response = await apiService.exportTransactions(params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export transactions:', error);
      alert('Failed to export transactions. Please try again.');
    }
  };

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    // Handle subtype filtering
    let matchesType = filters.type === 'all';
    if (!matchesType) {
      if (filters.type.startsWith('deposit_')) {
        matchesType = transaction.type === 'deposit' && transaction.subtype === filters.type.replace('deposit_', '');
      } else if (filters.type.startsWith('withdrawal_')) {
        matchesType = transaction.type === 'withdrawal' && transaction.subtype === filters.type.replace('withdrawal_', '');
      } else {
        matchesType = transaction.type === filters.type;
      }
    }

    const matchesStatus = filters.status === 'all' || transaction.status === filters.status;
    const matchesSearch = transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                          transaction.amount.toString().includes(filters.search);
    return matchesType && matchesStatus && matchesSearch;
  });

  const transactionTypes = [
    { id: 'all', name: 'All Types', icon: '' },
    { id: 'deposit', name: 'Deposits', icon: '' },
    { id: 'deposit_shares', name: 'Shares Deposit', icon: '' },
    { id: 'deposit_member_savings', name: 'Member Savings Deposit', icon: '' },
    { id: 'deposit_daily_savings', name: 'Daily Savings Deposit', icon: '' },
    { id: 'deposit_youth_savings', name: 'Youth Savings Deposit', icon: '' },
    { id: 'withdrawal', name: 'Withdrawals', icon: '' },
    { id: 'withdrawal_member_savings', name: 'Member Savings Withdrawal', icon: '' },
    { id: 'withdrawal_daily_savings', name: 'Daily Savings Withdrawal', icon: '' },
    { id: 'withdrawal_youth_savings', name: 'Youth Savings Withdrawal', icon: '' },
    { id: 'transfer', name: 'Transfers', icon: '↗' },
    { id: 'payment', name: 'Payments', icon: '' }
  ];

  const statusTypes = [
    { id: 'all', name: 'All Status', color: '#6b7280' },
    { id: 'completed', name: 'Completed', color: '#10b981' },
    { id: 'pending', name: 'Pending', color: '#f59e0b' },
    { id: 'failed', name: 'Failed', color: '#ef4444' },
    { id: 'cancelled', name: 'Cancelled', color: '#6b7280' }
  ];

  const categoryTypes = [
    { id: 'all', name: 'All Categories' },
    { id: 'income', name: 'Income' },
    { id: 'expense', name: 'Expense' },
    { id: 'transfer', name: 'Transfer' },
    { id: 'loan', name: 'Loan' },
    { id: 'fee', name: 'Fee' },
    { id: 'other', name: 'Other' }
  ];

  const sortOptions = [
    { id: 'timestamp', name: 'Date' },
    { id: 'amount', name: 'Amount' },
    { id: 'type', name: 'Type' },
    { id: 'description', name: 'Description' }
  ];

  const dateRanges = [
    { id: '7days', name: 'Last 7 Days' },
    { id: '30days', name: 'Last 30 Days' },
    { id: '90days', name: 'Last 90 Days' },
    { id: 'custom', name: 'Custom Range' }
  ];

  const exportOptions = [
    { format: 'PDF', icon: '' },
    { format: 'CSV', icon: '' },
    { format: 'Excel', icon: '' }
  ];

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      {/* Balance Inquiry Section */}
      {balanceData && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{
              margin: 0,
              color: '#1e293b',
              fontSize: '20px',
              fontWeight: '700'
            }}>
              Account Balance Summary
            </h2>
            <button
              onClick={loadBalanceData}
              disabled={loadingBalance}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loadingBalance ? 'not-allowed' : 'pointer',
                opacity: loadingBalance ? 0.6 : 1
              }}
            >
              {loadingBalance ? 'Refreshing...' : 'Refresh Balance'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Balance</div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                {formatCurrencyGHS(balanceData.total_balance)}
              </div>
            </div>

            {balanceData.accounts.map((account, index) => (
              <div key={index} style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      {account.account_type}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      ****{account.account_number}
                    </div>
                  </div>
                  <span style={{
                    background: account.status === 'Active' ? '#d1fae5' : '#fee2e2',
                    color: account.status === 'Active' ? '#065f46' : '#dc2626',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {account.status}
                  </span>
                </div>

                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                  {formatCurrencyGHS(account.current_balance)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Recent Deposits: {formatCurrencyGHS(account.recent_activity.total_deposits)}</span>
                  <span>Recent Withdrawals: {formatCurrencyGHS(account.recent_activity.total_withdrawals)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              color: '#1e293b',
              fontSize: '28px',
              fontWeight: '700'
            }}>
              Transaction History
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#64748b',
              fontSize: '16px'
            }}>
              View and manage all your financial transactions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Export Options */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {exportOptions.map((option, index) => (
                <button key={index} style={{
                  padding: '10px 16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#374151';
                }}>
                  <span>{option.icon}</span>
                  {option.format}
                </button>
              ))}
            </div>
            <button style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(5, 150, 105, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
               Print Statement
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {/* Transaction Type Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Transaction Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {transactionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {categoryTypes.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {statusTypes.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {dateRanges.map(range => (
                <option key={range.id} value={range.id}>{range.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: '#f9fafb'
                }}
              />
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}>
                🔍
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {/* Member Name Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Member Name
            </label>
            <input
              type="text"
              placeholder="Filter by member name..."
              value={filters.memberName}
              onChange={(e) => setFilters({ ...filters, memberName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            />
          </div>

          {/* Tags Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filters.tags}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '14px' }}>
              Sort Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#64748b', fontSize: '14px' }}>
            Showing {transactions.length} transactions
            {pagination && ` (Page ${pagination.current_page} of ${pagination.total_pages})`}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setFilters({
                type: 'all',
                status: 'all',
                category: 'all',
                dateRange: '7days',
                search: '',
                sortBy: 'timestamp',
                sortOrder: 'desc',
                memberName: '',
                tags: ''
              })}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto',
          gap: '16px',
          padding: '20px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          fontWeight: '600',
          color: '#374151',
          fontSize: '14px'
        }}>
          <div>Description</div>
          <div>Date</div>
          <div>Type</div>
          <div>Category</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto',
                  gap: '16px',
                  padding: '20px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: getTransactionColor(transaction.type).background,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: getTransactionColor(transaction.type, transaction.subtype).color
                  }}>
                    {getTransactionIcon(transaction.type, transaction.subtype)}
                  </div>
                  <div>
                    <div style={{
                      color: '#1e293b',
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '2px'
                    }}>
                      {sanitizeUserInput(transaction.description)}
                    </div>
                    <div style={{ 
                      color: '#64748b',
                      fontSize: '12px'
                    }}>
                      Ref: {transaction.reference || 'N/A'}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ 
                    color: '#1e293b',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}>
                    {transaction.date}
                  </div>
                  <div style={{ 
                    color: '#64748b',
                    fontSize: '12px'
                  }}>
                    {transaction.time || '10:30 AM'}
                  </div>
                </div>

                <div>
                  <span style={{
                    background: getTransactionColor(transaction.type, transaction.subtype).background,
                    color: getTransactionColor(transaction.type, transaction.subtype).color,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.subtype ? `${transaction.subtype.replace('_', ' ')}` : transaction.type}
                  </span>
                </div>

                <div>
                  <span style={{
                    background: getCategoryColor(transaction.category).background,
                    color: getCategoryColor(transaction.category).color,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {transaction.category}
                  </span>
                </div>

                <div>
                  <span style={{
                    background: getStatusColor(transaction.status).background,
                    color: getStatusColor(transaction.status).color,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {transaction.status}
                  </span>
                </div>

                <div style={{ 
                  textAlign: 'right',
                  color: transaction.amount >= 0 ? '#059669' : '#dc2626',
                  fontWeight: '700',
                  fontSize: '16px'
                }}>
                  {transaction.amount >= 0 ? '+' : ''}{formatCurrencyGHS(transaction.amount)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              padding: '60px 40px', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                color: '#1e293b',
                fontSize: '20px',
                fontWeight: '600'
              }}>
                No transactions found
              </h3>
              <p style={{ margin: 0, fontSize: '16px' }}>
                {filters.search ? 'Try adjusting your search terms' : 'No transactions match your current filters'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setSelectedTransaction(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h3 style={{ 
                margin: 0, 
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: '700'
              }}>
                Transaction Details
              </h3>
              <button 
                onClick={() => setSelectedTransaction(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Amount */}
              <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ 
                  color: selectedTransaction.amount >= 0 ? '#059669' : '#dc2626',
                  fontSize: '32px',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {selectedTransaction.amount >= 0 ? '+' : ''}{formatCurrencyGHS(selectedTransaction.amount)}
                </div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>
                  {selectedTransaction.type.toUpperCase()} • {selectedTransaction.category} • {selectedTransaction.status}
                </div>
              </div>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Description</div>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{sanitizeUserInput(selectedTransaction.description)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Category</div>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedTransaction.category}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Date & Time</div>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedTransaction.date} • 10:30 AM</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Status</div>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedTransaction.status}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Transaction ID</div>
                  <div style={{ color: '#1e293b', fontWeight: '600', fontFamily: 'monospace' }}>
                    {selectedTransaction.reference || 'TX-001234'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Account</div>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>Primary Savings (****4587)</div>
                </div>
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Tags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {selectedTransaction.tags.map((tag, index) => (
                        <span key={index} style={{
                          background: '#e2e8f0',
                          color: '#374151',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#374151';
                }}
                onClick={async () => {
                  try {
                    const receiptData = await apiService.generateReceipt(selectedTransaction.id);
                    // For now, just show the receipt data in console
                    // In a real implementation, this would generate a PDF or printable format
                    console.log('Receipt data:', receiptData);
                    alert('Receipt generated successfully! Check console for details.');
                  } catch (error) {
                    console.error('Failed to generate receipt:', error);
                    alert('Failed to generate receipt. Please try again.');
                  }
                }}>
                  Download Receipt
                </button>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#374151';
                }}>
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

// Helper functions
function getTransactionIcon(type, subtype) {
  const icons = {
    deposit: '',
    withdrawal: '',
    transfer: '↗',
    payment: '',
    shares: '',
    member_savings: '',
    daily_savings: '',
    youth_savings: '',
    withdrawal_member_savings: '',
    withdrawal_daily_savings: '',
    withdrawal_youth_savings: '',
    default: ''
  };
  return icons[subtype] || icons[type] || icons.default;
}

function getTransactionColor(type, subtype) {
  const colors = {
    deposit: { background: '#d1fae5', color: '#065f46' },
    withdrawal: { background: '#fee2e2', color: '#dc2626' },
    transfer: { background: '#dbeafe', color: '#1e40af' },
    payment: { background: '#fef3c7', color: '#92400e' },
    shares: { background: '#fef3c7', color: '#92400e' },
    member_savings: { background: '#dbeafe', color: '#1e40af' },
    daily_savings: { background: '#d1fae5', color: '#065f46' },
    youth_savings: { background: '#fce7f3', color: '#be185d' },
    withdrawal_member_savings: { background: '#fee2e2', color: '#dc2626' },
    withdrawal_daily_savings: { background: '#fed7d7', color: '#c53030' },
    withdrawal_youth_savings: { background: '#feb2b2', color: '#b91c1c' },
    default: { background: '#f3f4f6', color: '#374151' }
  };
  return colors[subtype] || colors[type] || colors.default;
}

function getCategoryColor(category) {
  const colors = {
    income: { background: '#d1fae5', color: '#065f46' },
    expense: { background: '#fee2e2', color: '#dc2626' },
    transfer: { background: '#dbeafe', color: '#1e40af' },
    loan: { background: '#fef3c7', color: '#92400e' },
    fee: { background: '#f3f4f6', color: '#374151' },
    other: { background: '#f3f4f6', color: '#374151' },
    default: { background: '#f3f4f6', color: '#374151' }
  };
  return colors[category] || colors.default;
}

function getStatusColor(status) {
  const colors = {
    completed: { background: '#d1fae5', color: '#065f46' },
    pending: { background: '#fef3c7', color: '#92400e' },
    failed: { background: '#fee2e2', color: '#dc2626' },
    cancelled: { background: '#f3f4f6', color: '#374151' },
    default: { background: '#f3f4f6', color: '#374151' }
  };
  return colors[status] || colors.default;
}

export default Transactions;