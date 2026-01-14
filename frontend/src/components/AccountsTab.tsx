import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';

interface Account {
  id: string;
  account_number: string;
  account_type: string;  // Backend returns account_type, not type
  balance: string | number;  // Backend returns string
  is_active: boolean;  // Backend returns is_active, not status
  user?: {  // Backend returns user, not owner (made optional for safety)
    id: string;
    full_name: string;  // Backend returns full_name, not first_name/last_name
    email: string;
    phone?: string;
  };
  created_at: string | null;
}

interface AccountSummary {
  total_accounts: number;
  active_accounts: number;
  total_balance: number;
  recent_accounts: number;
}

const AccountsTab: React.FC = () => {


  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAccounts();
    loadSummary();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await authService.getStaffAccounts();
      if (response.success) {
        // Handle paginated response structure
        const responseData = response.data || {};
        const accountsList = Array.isArray(responseData) ? responseData : ((responseData as { results?: Account[] }).results || []);
        setAccounts(accountsList as Account[]);
      } else {
        setError(response.error || 'Failed to load accounts');
      }
    } catch {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {

      const response = await authService.getStaffAccountsSummary();

      if (response.success) {
        setSummary(response.data as AccountSummary);

      } else {
        console.warn('AccountsTab: Failed to load summary:', response.error);
      }
    } catch (err) {
      console.error('AccountsTab: Exception loading summary:', err);
      // Summary is optional, don't show error
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === '' ||
      account.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.user?.full_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (account.user?.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && account.is_active) ||
      (statusFilter === 'inactive' && !account.is_active);

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH');
  };

  if (loading) {

    return (
      <div className="flex justify-center items-center h-48 bg-blue-600 text-white p-5 rounded-lg">
        <div className="animate-pulse font-semibold">Loading accounts...</div>
      </div>
    );
  }

  if (error) {

    return (
      <div className="bg-red-600 text-white p-5 border-4 border-red-800 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Error Loading Accounts</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Accounts</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.total_accounts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Accounts</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.active_accounts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(summary.total_balance)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Recent (30 days)</dt>
                    <dd className="text-lg font-medium text-gray-900">{summary.recent_accounts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">Search accounts</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by account number, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                name="status-filter"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Accounts ({filteredAccounts.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredAccounts.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              {accounts.length === 0 ? 'No accounts found.' : 'No accounts match your search criteria.'}
            </li>
          ) : (
            filteredAccounts.map((account) => (
              <li key={account.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {account.account_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {account.user?.full_name ?? 'Unknown'} • {account.user?.email ?? 'No email'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(account.balance) || 0)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {account.account_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="text-sm text-gray-500 mt-1">
                        Created {account.created_at ? formatDate(account.created_at) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default AccountsTab;
