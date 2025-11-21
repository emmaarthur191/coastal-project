import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.ts';
import { formatCurrencyGHS } from '../utils/formatters';

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
        setAccounts(result || []);
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
    { id: 'all', name: 'All Accounts', icon: '', count: accounts.length },
    { id: 'savings', name: 'Savings', icon: '', count: accounts.filter(a => a.type === 'savings').length },
    { id: 'checking', name: 'Checking', icon: '', count: accounts.filter(a => a.type === 'checking').length },
    { id: 'loan', name: 'Loan Accounts', icon: '', count: accounts.filter(a => a.type === 'loan').length },
    { id: 'share', name: 'Shares', icon: '', count: accounts.filter(a => a.type === 'share').length }
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
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading your accounts...</p>
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
              Account Management
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#64748b',
              fontSize: '16px'
            }}>
              View and manage all your credit union accounts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '12px 20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
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
               View Statements
            </button>
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
               Add Account
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by account name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '14px',
              background: '#f9fafb'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            
          </span>
        </div>
      </div>

      {/* Account Type Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {accountTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              style={{
                padding: '16px 20px',
                background: activeTab === type.id ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                color: activeTab === type.id ? 'white' : '#374151',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '160px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== type.id) {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== type.id) {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#374151';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{type.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px' }}>{type.name}</div>
                <div style={{ 
                  fontSize: '12px', 
                  opacity: activeTab === type.id ? 0.9 : 0.6 
                }}>
                  {type.count} accounts
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredAccounts.map((account) => (
          <div key={account.id} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => setExpandedAccount(expandedAccount === account.id ? null : account.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }}>
            {/* Account Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  {account.name}
                </h3>
                <p style={{ 
                  margin: 0, 
                  color: '#64748b',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}>
                  {account.account_number}
                </p>
              </div>
              <div style={{
                background: getAccountTypeColor(account.type).background,
                color: getAccountTypeColor(account.type).color,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {account.type}
              </div>
            </div>

            {/* Balance */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                {formatCurrencyGHS(account.balance)}
              </div>
              <div style={{ 
                color: '#64748b',
                fontSize: '14px'
              }}>
                Available Balance
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button style={{
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '12px',
                fontWeight: '500',
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
              }}>
                Transfer
              </button>
              <button style={{
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#374151';
              }}>
                Statement
              </button>
              <button style={{
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#374151',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#8b5cf6';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#374151';
              }}>
                Details
              </button>
            </div>

            {/* Expanded Details */}
            {expandedAccount === account.id && (
              <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginTop: '16px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>Account Status</div>
                    <div style={{ color: '#059669', fontWeight: '600' }}>Active</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>Interest Rate</div>
                    <div style={{ color: '#1e293b', fontWeight: '600' }}>5.2%</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>Last Transaction</div>
                    <div style={{ color: '#1e293b', fontWeight: '600' }}>2 days ago</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>Overdraft Limit</div>
                    <div style={{ color: '#1e293b', fontWeight: '600' }}>{formatCurrencyGHS(1000)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: '#1e293b',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            No accounts found
          </h3>
          <p style={{ 
            margin: '0 0 24px 0', 
            color: '#64748b',
            fontSize: '16px'
          }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by opening your first account'}
          </p>
          <button style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Open New Account
          </button>
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

// Helper function for account type colors
function getAccountTypeColor(type) {
  const colors = {
    savings: { background: '#d1fae5', color: '#065f46' },
    checking: { background: '#dbeafe', color: '#1e40af' },
    loan: { background: '#fef3c7', color: '#92400e' },
    share: { background: '#e0e7ff', color: '#3730a3' },
    default: { background: '#f3f4f6', color: '#374151' }
  };
  return colors[type] || colors.default;
}

export default Accounts;