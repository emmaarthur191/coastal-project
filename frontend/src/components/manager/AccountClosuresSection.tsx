import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { AccountsService } from '../../api/services/AccountsService';
import type { AccountClosureRequest } from '../../api/models/AccountClosureRequest';

interface AccountClosuresSectionProps {
    onRefreshDashboard?: () => void;
}

const AccountClosuresSection: React.FC<AccountClosuresSectionProps> = ({ onRefreshDashboard }) => {
    const [requests, setRequests] = useState<AccountClosureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const statusFilter = filter === 'all' ? undefined : filter;
            const response = await AccountsService.apiBankingAccountClosuresList(statusFilter);

            setRequests(response.results || []);
        } catch (err: unknown) {
            console.error('Failed to fetch closure requests:', err);
            setError('Failed to load account closure requests');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (id: number) => {
        if (!confirm('Are you sure you want to approve this account closure? This action is irreversible.')) {
            return;
        }

        try {
            setActionLoading(true);
            await AccountsService.apiBankingAccountClosuresApproveCreate(id);
            alert('Account closure approved successfully.');
            fetchRequests();
            onRefreshDashboard?.();
        } catch (err: unknown) {
            console.error('Failed to approve closure:', err);
            alert('Failed to approve account closure.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Please enter the reason for rejection:');
        if (!reason) return;

        try {
            setActionLoading(true);
            await AccountsService.apiBankingAccountClosuresRejectCreate(id, { reason });
            alert('Account closure request rejected.');
            fetchRequests();
            onRefreshDashboard?.();
        } catch (err: unknown) {
            console.error('Failed to reject closure:', err);
            alert('Failed to reject account closure.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Account Closure Requests</h2>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === status
                                ? 'bg-red-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <GlassCard className="p-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">No account closure requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3 pl-2">ID</th>
                                    <th className="pb-3">Client Name</th>
                                    <th className="pb-3">Account Number</th>
                                    <th className="pb-3">Balance</th>
                                    <th className="pb-3">Reason</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3 text-right pr-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 pl-2 text-sm font-mono text-slate-600">#{request.id}</td>
                                        <td className="py-3 text-sm font-semibold text-slate-800 dark:text-white">{request.customer_name}</td>
                                        <td className="py-3 text-sm font-mono text-slate-600">{request.account_number}</td>
                                        <td className="py-3 text-sm font-bold text-red-600">GHS {request.final_balance}</td>
                                        <td className="py-3 text-sm text-slate-600">
                                            {request.closure_reason === 'other' ? request.other_reason : request.closure_reason}
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right pr-2">
                                            {request.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(request.id)}
                                                        disabled={actionLoading}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request.id)}
                                                        disabled={actionLoading}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                            {request.status !== 'pending' && (
                                                <span className="text-xs text-slate-400 italic">Processed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default AccountClosuresSection;
