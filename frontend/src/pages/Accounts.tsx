import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { formatCurrencyGHS } from '../utils/formatters';
import './Accounts.css';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAccount, setExpandedAccount] = useState(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const result = await apiService.getAccounts();
        if (result.success) {
          setAccounts(result.data || []);
        } else {
          console.error('Failed to load accounts:', result.error);
          setAccounts([]);
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
  }, []);

  // Filter accounts based on active tab and search
  const filteredAccounts = accounts.filter(account => {
    const matchesTab = activeTab === 'all' || account.type === activeTab;
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_number.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  const accountTypes = [
    { id: 'all', name: 'All Accounts', icon: '📊', count: accounts.length },
    { id: 'daily_susu', name: 'Daily Susu', icon: '📅', count: accounts.filter(a => a.type === 'daily_susu').length },
    { id: 'shares', name: 'Shares', icon: '📈', count: accounts.filter(a => a.type === 'shares').length },
    { id: 'monthly_contribution', name: 'Monthly Contribution', icon: '📆', count: accounts.filter(a => a.type === 'monthly_contribution').length }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-box">
          <div className="spinner"></div>
          <p className="loading-text">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounts-page">
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <div>
            <h1 className="header-title">
              Account Management
            </h1>
            <p className="header-subtitle">
              View and manage all your credit union accounts
            </p>
          </div>
          <div className="action-buttons">
            <button className="btn-view-statements">
              View Statements
            </button>
            <button className="btn-add-account">
              Add Account
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by account name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">
            {/* Icon placeholder if needed, or keeping empty span as in original code */}
          </span>
        </div>
      </div>

      {/* Account Type Tabs */}
      <div className="tabs-container">
        <div className="tabs-scroll-area">
          {accountTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              className={`tab-btn ${activeTab === type.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{type.icon}</span>
              <div className="tab-text-container">
                <div className="tab-name">{type.name}</div>
                <div className="tab-count">
                  {type.count} accounts
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="accounts-grid">
        {filteredAccounts.map((account) => (
          <div
            key={account.id}
            className="account-card"
            onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}
          >
            {/* Account Header */}
            <div className="account-header">
              <div>
                <h3 className="account-name-h3">
                  {account.name}
                </h3>
                <p className="account-number-p">
                  {account.account_number}
                </p>
              </div>
              <div className={`account-badge ${account.type}`}>
                {account.type}
              </div>
            </div>

            {/* Balance */}
            <div className="balance-section">
              <div className="balance-amount">
                {formatCurrencyGHS(account.balance)}
              </div>
              <div className="balance-label">
                Available Balance
              </div>
            </div>

            {/* Quick Actions */}
            <div className="account-actions">
              <button className="action-btn transfer">
                Transfer
              </button>
              <button className="action-btn statement">
                Statement
              </button>
              <button className="action-btn details">
                Details
              </button>
            </div>

            {/* Expanded Details */}
            {expandedAccount === account.id && (
              <div className="expanded-details">
                <div className="details-grid">
                  <div className="detail-item">
                    <div className="detail-label">Account Status</div>
                    <div className="detail-value active">Active</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Interest Rate</div>
                    <div className="detail-value">5.2%</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Last Transaction</div>
                    <div className="detail-value">2 days ago</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Overdraft Limit</div>
                    <div className="detail-value">{formatCurrencyGHS(1000)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3 className="empty-title">
            No accounts found
          </h3>
          <p className="empty-text">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by opening your first account'}
          </p>
          <button className="empty-btn">
            Open New Account
          </button>
        </div>
      )}
    </div>
  );
}

export default Accounts;
