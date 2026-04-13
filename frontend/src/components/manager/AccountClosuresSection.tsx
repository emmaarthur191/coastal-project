import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { BankingService } from '../../api/services/BankingService';
import type { AccountClosureRequest } from '../../api/models/AccountClosureRequest';

interface AccountClosuresSectionProps {
    onRefreshDashboard?: () => void;
}

const AccountClosuresSection: React.FC<AccountClosuresSectionProps> = ({ onRefreshDashboard }) => {
    const [requests, setRequests] = useState<AccountClosureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, _setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            _setError(null);

            const statusFilter = filter === 'all' ? undefined : filter;
            const response = await BankingService.bankingAccountClosuresList(undefined, undefined, statusFilter);

            setRequests(response.results || []);
        } catch (err: unknown) {
            console.error('Failed to fetch closure requests:', err);
            _setError('Failed to load account closure requests');
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
            // Approve detail actions often need an empty request body or the object itself
            // The SDK says: bankingAccountClosuresApproveCreate(id, requestBody)
            // We'll pass an empty object cast to AccountClosureRequest if required
            await BankingService.bankingAccountClosuresApproveCreate(id, {} as AccountClosureRequest);
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
            await BankingService.bankingAccountClosuresRejectCreate(id, { reason } as unknown as AccountClosureRequest);
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
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Account Closure Requests</h2>
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
                        <table className="min-w-full divide-y-2 divide-slate-300">
                            <thead className="bg-slate-900 text-white">
                                <tr className="text-left text-[10px] font-black uppercase tracking-widest">
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
                                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="py-3 pl-2 text-xs font-black text-slate-900">#{request.id}</td>
                                        <td className="py-3 text-sm font-black text-slate-900 uppercase tracking-tight">{request.customer_name}</td>
                                        <td className="py-3 text-sm font-mono font-black text-slate-900">{request.account_number}</td>
                                        <td className="py-3 text-sm font-black text-rose-700">GHS {request.final_balance}</td>
                                        <td className="py-3 text-[10px] font-bold text-slate-900 uppercase tracking-tight">
                                            {request.closure_reason === 'other' ? request.other_reason : request.closure_reason}
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${request.status === 'pending' ? 'bg-amber-100 text-amber-900 border-amber-500/30' :
                                                request.status === 'approved' ? 'bg-emerald-100 text-emerald-900 border-emerald-500/30' :
                                                    'bg-rose-100 text-rose-900 border-rose-500/30'
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
