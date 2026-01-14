import React, { useState, useEffect, useCallback } from 'react';
import { authService as apiService } from '../services/api';
import { Input } from '../components/ui/Input';
import { formatCurrencyGHS } from '../utils/formatters';
import { sanitizeUserInput } from '../utils/sanitizer';
import { logger } from '../utils/logger';
import './Transactions.css';

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

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      // Build query parameters for enhanced API
      const params = {
        page_size: 50,
        page: 1
      } as Record<string, string | number>;

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
        const dateFrom = new Date();

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
      if (result.success && result.data) {
        setTransactions(result.data.results || []);
        // Adapt PaginatedResponse to the component's expected pagination format if needed
        setPagination({
          current_page: params.page as number || 1,
          total_pages: Math.ceil((result.data.count || 0) / (params.page_size as number || 50)),
          total_count: result.data.count
        });
      } else {
        setTransactions([]);
      }
    } catch (error) {
      logger.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.status, filters.category, filters.search, filters.memberName, filters.tags, filters.sortBy, filters.sortOrder, filters.dateRange]);

  const loadBalanceData = useCallback(async () => {
    try {
      setLoadingBalance(true);
      const result = await apiService.getBalanceInquiry();
      setBalanceData(result);
    } catch (error) {
      logger.error('Failed to load balance data:', error);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
    loadBalanceData();
  }, [loadTransactions, loadBalanceData]);

  const handleExport = async () => {
    try {
      // Use the same parameters as the current transaction load
      const params: Record<string, string | number> = {
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
        const dateFrom = new Date();

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
      logger.error('Failed to export transactions:', error);
      alert('Failed to export transactions. Please try again.');
    }
  };

  // Filter transactions based on current filters
  const _filteredTransactions = transactions.filter(transaction => {
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
    { id: 'all', name: 'All Types', icon: '📊' },
    { id: 'deposit', name: 'Deposits', icon: '💵' },
    { id: 'deposit_daily_susu', name: 'Daily Susu Deposit', icon: '📅' },
    { id: 'deposit_shares', name: 'Shares Deposit', icon: '📈' },
    { id: 'deposit_monthly_contribution', name: 'Monthly Contribution Deposit', icon: '📆' },
    { id: 'withdrawal', name: 'Withdrawals', icon: '🏧' },
    { id: 'withdrawal_daily_susu', name: 'Daily Susu Withdrawal', icon: '📅' },
    { id: 'withdrawal_shares', name: 'Shares Withdrawal', icon: '📈' },
    { id: 'withdrawal_monthly_contribution', name: 'Monthly Contribution Withdrawal', icon: '📆' },
    { id: 'transfer', name: 'Transfers', icon: '↔️' },
    { id: 'payment', name: 'Payments', icon: '💳' }
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
      <div className="transactions-loading">
        <div className="transactions-loading__card">
          <div className="transactions-loading__spinner"></div>
          <p className="transactions-loading__text">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      {/* Balance Inquiry Section */}
      {balanceData && (
        <div className="balance-section">
          <div className="balance-section__header">
            <h2 className="balance-section__title">
              Account Balance Summary
            </h2>
            <button
              onClick={loadBalanceData}
              disabled={loadingBalance}
              className="balance-section__refresh-btn"
            >
              {loadingBalance ? 'Refreshing...' : 'Refresh Balance'}
            </button>
          </div>

          <div className="balance-section__grid">
            <div className="balance-total-card">
              <div className="balance-total-card__label">Total Balance</div>
              <div className="balance-total-card__amount">
                {formatCurrencyGHS(balanceData.total_balance)}
              </div>
            </div>

            {balanceData.accounts.map((account, index) => (
              <div key={index} className="balance-account-card">
                <div className="balance-account-card__header">
                  <div>
                    <div className="balance-account-card__type">
                      {account.account_type}
                    </div>
                    <div className="balance-account-card__number">
                      ****{account.account_number}
                    </div>
                  </div>
                  <span className={`balance-account-card__status ${account.status === 'Active' ? 'balance-account-card__status--active' : 'balance-account-card__status--inactive'}`}>
                    {account.status}
                  </span>
                </div>

                <div className="balance-account-card__balance">
                  {formatCurrencyGHS(account.current_balance)}
                </div>

                <div className="balance-account-card__activity">
                  <span>Recent Deposits: {formatCurrencyGHS(account.recent_activity.total_deposits)}</span>
                  <span>Recent Withdrawals: {formatCurrencyGHS(account.recent_activity.total_withdrawals)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header-section">
        <div className="header-section__top">
          <div className="header-section__title-group">
            <h1>
              Transaction History
            </h1>
            <p>
              View and manage all your financial transactions
            </p>
          </div>
          <div className="header-section__actions">
            {/* Export Options */}
            <div className="header-section__export-options">
              {exportOptions.map((option, index) => (
                <button key={index} className="export-option-btn">
                  <span>{option.icon}</span>
                  {option.format}
                </button>
              ))}
            </div>
            <button className="print-statement-btn">
              Print Statement
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="filters-row">
          {/* Transaction Type Filter */}
          <Input
            as="select"
            label="Transaction Type"
            id="transaction-type-filter"
            title="Filter by transaction type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            {transactionTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </Input>

          {/* Category Filter */}
          <Input
            as="select"
            label="Category"
            id="category-filter"
            title="Filter by category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            {categoryTypes.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Input>

          {/* Status Filter */}
          <Input
            as="select"
            label="Status"
            id="status-filter"
            title="Filter by status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {statusTypes.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </Input>

          {/* Date Range Filter */}
          <Input
            as="select"
            label="Date Range"
            id="date-range-filter"
            title="Filter by date range"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            {dateRanges.map(range => (
              <option key={range.id} value={range.id}>{range.name}</option>
            ))}
          </Input>

          {/* Sort By */}
          <Input
            as="select"
            label="Sort By"
            id="sort-by-filter"
            title="Sort transactions by"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </Input>

          {/* Search */}
          <Input
            label="Search"
            id="search-filter"
            title="Search transactions"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Advanced Filters Row */}
        <div className="advanced-filters-row">
          {/* Member Name Filter */}
          <Input
            label="Member Name"
            id="member-name-filter"
            title="Filter by member name"
            placeholder="Filter by member name..."
            value={filters.memberName}
            onChange={(e) => setFilters({ ...filters, memberName: e.target.value })}
          />

          {/* Tags Filter */}
          <Input
            label="Tags (comma-separated)"
            id="tags-filter"
            title="Filter by tags"
            placeholder="Filter by tags..."
            value={filters.tags}
            onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
          />

          {/* Sort Order */}
          <Input
            as="select"
            label="Sort Order"
            id="sort-order-filter"
            title="Select sort order"
            value={filters.sortOrder}
            onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Input>
        </div>

        {/* Filter Summary */}
        <div className="filter-summary">
          <div className="filter-summary__info">
            Showing {transactions.length} transactions
            {pagination && ` (Page ${pagination.current_page} of ${pagination.total_pages})`}
          </div>
          <div className="filter-summary__actions">
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
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="export-csv-btn"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-table">
        {/* Table Header */}
        <div className="transactions-table__header">
          <div>Description</div>
          <div>Date</div>
          <div>Type</div>
          <div>Category</div>
          <div>Status</div>
          <div className="transactions-table__header-amount">Amount</div>
        </div>

        {/* Table Body */}
        <div className="transactions-table__body">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="transaction-row"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="transaction-row__description">
                  <div
                    className={`transaction-row__icon ${getTransactionThemeClass(transaction.type, transaction.subtype)}`}
                  >
                    {getTransactionIcon(transaction.type, transaction.subtype)}
                  </div>
                  <div>
                    <div className="transaction-row__description-text">
                      {sanitizeUserInput(transaction.description)}
                    </div>
                    <div className="transaction-row__reference">
                      Ref: {transaction.reference || 'N/A'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="transaction-row__date">
                    {transaction.date}
                  </div>
                  <div className="transaction-row__time">
                    {transaction.time || '10:30 AM'}
                  </div>
                </div>

                <div>
                  <span
                    className={`transaction-badge transaction-badge--type ${getTransactionThemeClass(transaction.type, transaction.subtype)}`}
                  >
                    {transaction.subtype ? `${transaction.subtype.replace('_', ' ')} ` : transaction.type}
                  </span>
                </div>

                <div>
                  <span
                    className={`transaction-badge transaction-badge--type ${getCategoryThemeClass(transaction.category)}`}
                  >
                    {transaction.category}
                  </span>
                </div>

                <div>
                  <span
                    className={`transaction-badge ${getStatusThemeClass(transaction.status)}`}
                  >
                    {transaction.status}
                  </span>
                </div>

                <div className={`transaction-row__amount ${transaction.amount >= 0 ? 'transaction-row__amount--positive' : 'transaction-row__amount--negative'}`}>
                  {transaction.amount >= 0 ? '+' : ''}{formatCurrencyGHS(transaction.amount)}
                </div>
              </div>
            ))
          ) : (
            <div className="transactions-empty">
              <div className="transactions-empty__icon"></div>
              <h3 className="transactions-empty__title">
                No transactions found
              </h3>
              <p className="transactions-empty__text">
                {filters.search ? 'Try adjusting your search terms' : 'No transactions match your current filters'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-header__title">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                aria-label="Close transaction details"
                title="Close"
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Amount */}
              <div className="modal-amount-card">
                <div className={`modal-amount-card__value ${selectedTransaction.amount >= 0 ? 'modal-amount-card__value--positive' : 'modal-amount-card__value--negative'}`}>
                  {selectedTransaction.amount >= 0 ? '+' : ''}{formatCurrencyGHS(selectedTransaction.amount)}
                </div>
                <div className="modal-amount-card__info">
                  {selectedTransaction.type.toUpperCase()} • {selectedTransaction.category} • {selectedTransaction.status}
                </div>
              </div>

              {/* Details Grid */}
              <div className="modal-details-grid">
                <div>
                  <div className="modal-detail-item__label">Description</div>
                  <div className="modal-detail-item__value">{sanitizeUserInput(selectedTransaction.description)}</div>
                </div>
                <div>
                  <div className="modal-detail-item__label">Category</div>
                  <div className="modal-detail-item__value">{selectedTransaction.category}</div>
                </div>
                <div>
                  <div className="modal-detail-item__label">Date & Time</div>
                  <div className="modal-detail-item__value">{selectedTransaction.date} • 10:30 AM</div>
                </div>
                <div>
                  <div className="modal-detail-item__label">Status</div>
                  <div className="modal-detail-item__value">{selectedTransaction.status}</div>
                </div>
                <div>
                  <div className="modal-detail-item__label">Transaction ID</div>
                  <div className="modal-detail-item__value modal-detail-item__value--mono">
                    {selectedTransaction.reference || 'TX-001234'}
                  </div>
                </div>
                <div>
                  <div className="modal-detail-item__label">Account</div>
                  <div className="modal-detail-item__value">Primary Savings (****4587)</div>
                </div>
                {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                  <div className="modal-detail-item--full">
                    <div className="modal-detail-item__label">Tags</div>
                    <div className="modal-tags">
                      {selectedTransaction.tags.map((tag, index) => (
                        <span key={index} className="modal-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  className="modal-action-btn modal-action-btn--primary"
                  onClick={async () => {
                    try {
                      const receiptData = await apiService.generateReceipt(selectedTransaction.id);
                      // For now, just show the receipt data in dev console
                      // In a real implementation, this would generate a PDF or printable format
                      logger.debug('[Receipt] Generated:', receiptData);
                      alert('Receipt generated successfully!');
                    } catch (error) {
                      logger.error('[Receipt] Failed to generate:', error);
                      alert('Failed to generate receipt. Please try again.');
                    }
                  }}>
                  Download Receipt
                </button>
                <button className="modal-action-btn modal-action-btn--danger">
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// Helper functions
function getTransactionIcon(type, subtype) {
  const icons = {
    deposit: '💵',
    withdrawal: '🏧',
    transfer: '↔️',
    payment: '💳',
    daily_susu: '📅',
    shares: '📈',
    monthly_contribution: '📆',
    withdrawal_daily_susu: '📅',
    withdrawal_shares: '📈',
    withdrawal_monthly_contribution: '📆',
    default: '💰'
  };
  return icons[subtype] || icons[type] || icons.default;
}

function getTransactionThemeClass(type, subtype) {
  const themes = {
    deposit: 'theme-success',
    withdrawal: 'theme-danger',
    transfer: 'theme-info',
    payment: 'theme-warning',
    daily_susu: 'theme-success',
    shares: 'theme-info',
    monthly_contribution: 'theme-warning',
    withdrawal_daily_susu: 'theme-danger',
    withdrawal_shares: 'theme-danger-alt-1',
    withdrawal_monthly_contribution: 'theme-danger-alt-2',
    default: 'theme-neutral'
  };
  return themes[subtype] || themes[type] || themes.default;
}

function getCategoryThemeClass(category) {
  const themes = {
    income: 'theme-success',
    expense: 'theme-danger',
    transfer: 'theme-info',
    loan: 'theme-warning',
    fee: 'theme-neutral',
    other: 'theme-neutral',
    default: 'theme-neutral'
  };
  return themes[category] || themes.default;
}

function getStatusThemeClass(status) {
  const themes = {
    completed: 'theme-success',
    pending: 'theme-warning',
    failed: 'theme-danger',
    cancelled: 'theme-neutral',
    default: 'theme-neutral'
  };
  return themes[status] || themes.default;
}

export default Transactions;
