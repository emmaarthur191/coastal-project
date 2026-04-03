import React, { useState, useEffect, useCallback } from 'react';
import { AccountOpeningsService } from '../api/services/AccountOpeningsService';
import type { AccountOpeningRequest } from '../api/models/AccountOpeningRequest';
import { authService } from '../services/api';

type ViewMode = 'pending' | 'approved' | 'active' | 'all';

interface Account {
  id: number;
  account_number: string;
  account_type?: string;
  balance?: string | number;
  is_active?: boolean;
  customer_name?: string;
  user?: { id: string | number; full_name: string; email: string; phone?: string };
  created_at: string | null;
}

interface AccountSummaryData {
  total_accounts: number;
  active_accounts: number;
  total_balance: number;
  recent_accounts: number;
}

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
};

const AccountsTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('pending');

  // ── Opening requests state ───────────────────────────────────────────────
  const [requests, setRequests] = useState<AccountOpeningRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccountOpeningRequest | null>(null);

  // ── Active accounts state ────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummaryData | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Fetch opening requests ───────────────────────────────────────────────
  const fetchRequests = useCallback(async (status?: 'pending' | 'approved' | 'rejected' | 'completed') => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const res = await AccountOpeningsService.apiBankingAccountOpeningsList(
        undefined, undefined, undefined, status
      );
      setRequests(res.results || []);
    } catch (e) {
      setRequestsError(e instanceof Error ? e.message : 'Failed to load requests');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  // ── Fetch active accounts ────────────────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const [acctRes, summaryRes] = await Promise.all([
        authService.getStaffAccounts(),
        authService.getStaffAccountsSummary(),
      ]);
      if (acctRes.success) setAccounts(acctRes.data || []);
      if (summaryRes.success) setSummary(summaryRes.data as AccountSummaryData);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode === 'pending')   fetchRequests('pending');
    else if (viewMode === 'approved') fetchRequests('approved');
    else if (viewMode === 'all')  fetchRequests(undefined);
    else if (viewMode === 'active') fetchAccounts();
  }, [viewMode, fetchRequests, fetchAccounts]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async (req: AccountOpeningRequest) => {
    if (!confirm(`Approve account for ${req.first_name || ''} ${req.last_name || ''}?`)) return;
    setActionLoading(true);
    try {
      await AccountOpeningsService.apiBankingAccountOpeningsApproveCreate(req.id!, req);
      fetchRequests('pending');
    } catch (e) {
      alert('Approval failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (req: AccountOpeningRequest) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await AccountOpeningsService.apiBankingAccountOpeningsRejectCreate(req.id!, { ...req, rejection_reason: reason });
      fetchRequests('pending');
    } catch (e) {
      alert('Rejection failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (req: AccountOpeningRequest) => {
    if (!confirm(`Dispatch login credentials for ${req.first_name || ''} ${req.last_name || ''}?`)) return;
    setActionLoading(true);
    try {
      await AccountOpeningsService.apiBankingAccountOpeningsDispatchCredentialsCreate(req.id!, req);
      fetchRequests('approved');
    } catch (e) {
      alert('Dispatch failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);

  // ── Tabs config ──────────────────────────────────────────────────────────
  const tabs: { id: ViewMode; label: string; badge?: number }[] = [
    { id: 'pending',  label: '🕐 Pending Approval', badge: viewMode === 'pending' ? requests.length : undefined },
    { id: 'approved', label: '✉️ Awaiting Credentials', badge: viewMode === 'approved' ? requests.length : undefined },
    { id: 'active',   label: '🏦 Active Accounts' },
    { id: 'all',      label: '📋 All Requests' },
  ];

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedRequest) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedRequest(null)}
          className="text-blue-600 hover:underline flex items-center gap-2 text-sm font-semibold"
        >
          ← Back to List
        </button>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Request #{selectedRequest.id} — {selectedRequest.full_name || `${selectedRequest.first_name} ${selectedRequest.last_name}`}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[selectedRequest.status || ''] || ''}`}>
              {selectedRequest.status === 'approved' ? 'Awaiting Credentials Dispatch' : (selectedRequest.status || 'Unknown')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Contact</h4>
              <p><span className="text-gray-500">Email:</span> {selectedRequest.email || 'N/A'}</p>
              <p><span className="text-gray-500">Phone:</span> {selectedRequest.phone_number}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Account Details</h4>
              <p><span className="text-gray-500">Type:</span> {selectedRequest.account_type}</p>
              <p><span className="text-gray-500">Card:</span> {selectedRequest.card_type || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Identification</h4>
              <p><span className="text-gray-500">ID Type:</span> {selectedRequest.id_type}</p>
              <p><span className="text-gray-500">ID Number:</span> {selectedRequest.id_number || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Submission</h4>
              <p><span className="text-gray-500">Submitted:</span> {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          {/* Stage 1 Actions */}
          {selectedRequest.status === 'pending' && (
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => handleApprove(selectedRequest)}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Processing…' : '✅ Approve & Create Account'}
              </button>
              <button
                onClick={() => handleReject(selectedRequest)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                ❌ Reject
              </button>
            </div>
          )}

          {/* Stage 2 Actions */}
          {selectedRequest.status === 'approved' && (
            <div className="pt-4 border-t">
              <button
                onClick={() => handleDispatch(selectedRequest)}
                disabled={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Dispatching…' : '✉️ Dispatch Login Credentials'}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                This will generate a temporary password and send login details via SMS.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h2>
      </div>

      {/* Summary cards (shown for active tab) */}
      {viewMode === 'active' && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: summary.total_accounts, color: 'bg-indigo-50 text-indigo-700' },
            { label: 'Active', value: summary.active_accounts, color: 'bg-green-50 text-green-700' },
            { label: 'Total Balance', value: formatCurrency(summary.total_balance), color: 'bg-blue-50 text-blue-700' },
            { label: 'New (30d)', value: summary.recent_accounts, color: 'bg-purple-50 text-purple-700' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl p-5 ${c.color}`}>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-sm mt-1 font-medium">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setViewMode(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === t.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
            }`}
          >
            {t.label}
            {t.badge !== undefined && (
              <span className="ml-2 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Opening request list (pending / approved / all) ── */}
      {viewMode !== 'active' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
          {requestsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
            </div>
          ) : requestsError ? (
            <div className="p-6 text-center text-red-600">{requestsError}</div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No {viewMode === 'all' ? '' : viewMode} requests found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Account Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">#{req.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {req.full_name || `${req.first_name || ''} ${req.last_name || 'Unknown'}`}
                      </div>
                      <div className="text-xs text-gray-400">{req.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{req.account_type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[req.status || ''] || 'bg-gray-100 text-gray-600'}`}>
                        {req.status === 'approved' ? 'Awaiting Dispatch' : (req.status || 'Unknown')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-blue-600 hover:underline text-sm font-semibold mr-3"
                      >
                        View
                      </button>
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={actionLoading}
                            className="text-green-600 hover:underline text-sm font-semibold mr-3 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={actionLoading}
                            className="text-red-600 hover:underline text-sm font-semibold disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() => handleDispatch(req)}
                          disabled={actionLoading}
                          className="text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded text-sm font-semibold disabled:opacity-50"
                        >
                          Dispatch
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Active accounts list ── */}
      {viewMode === 'active' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b dark:border-slate-700 flex gap-3">
            <input
              type="text"
              placeholder="Search by account number, name or email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {accountsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Account #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {accounts
                  .filter(a =>
                    !searchTerm ||
                    a.account_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900 dark:text-white">{a.account_number}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{a.customer_name ?? a.user?.full_name ?? 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{a.user?.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{a.account_type}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(Number(a.balance) || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${a.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountsTab;
