import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { AccountOpeningsService } from '../../api/services/AccountOpeningsService';
import type { AccountOpeningRequest } from '../../api/models/AccountOpeningRequest';

interface AccountOpeningsSectionProps {
    onRefreshDashboard?: () => void;
}

const AccountOpeningsSection: React.FC<AccountOpeningsSectionProps> = ({ onRefreshDashboard }) => {
    const [requests, setRequests] = useState<AccountOpeningRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
    const [selectedRequest, setSelectedRequest] = useState<AccountOpeningRequest | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const statusFilter = filter === 'all' ? undefined : (filter as 'approved' | 'completed' | 'pending' | 'rejected');

            const response = await AccountOpeningsService.apiBankingAccountOpeningsList(
                undefined, // accountType
                undefined, // ordering
                undefined, // page
                statusFilter
            );

            setRequests(response.results || []);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to load account opening requests';
            console.error('Failed to fetch account opening requests:', error);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchRequests();
    }, [filter, fetchRequests]);

    const handleApprove = async (request: AccountOpeningRequest) => {
        if (!confirm(`Approve account opening for ${request.first_name || ''} ${request.last_name || 'Unknown'}?`)) {
            return;
        }

        try {
            setActionLoading(true);
            setError(null);

            await AccountOpeningsService.apiBankingAccountOpeningsApproveCreate(request.id!, request);

            // alert('Account opening approved successfully!'); // Removed alert
            await fetchRequests();
            onRefreshDashboard?.();
            setSelectedRequest(null);
        } catch (error: unknown) {
            console.error('Failed to approve:', error);
            const msg = error instanceof Error ? error.message : 'Failed to approve account opening';
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (request: AccountOpeningRequest) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            setActionLoading(true);
            setError(null);

            await AccountOpeningsService.apiBankingAccountOpeningsRejectCreate(request.id!, {
                ...request,
                rejection_reason: reason
            });

            // alert('Account opening rejected'); // Removed alert
            await fetchRequests();
            onRefreshDashboard?.();
            setSelectedRequest(null);
        } catch (error: unknown) {
            console.error('Failed to reject:', error);
            const msg = error instanceof Error ? error.message : 'Failed to reject account opening';
            setError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    if (selectedRequest) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setSelectedRequest(null)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                        ← Back to List
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex justify-between items-center">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-red-200/50 hover:text-red-200 font-bold">×</button>
                    </div>
                )}

                <GlassCard className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                        Account Opening Request #{selectedRequest.id}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Personal Information</h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500">Name:</span> {selectedRequest?.first_name || ''} {(selectedRequest as { middle_name?: string })?.middle_name || ''} {selectedRequest?.last_name || 'Unknown'}</p>
                                <p><span className="text-slate-500">Date of Birth:</span> {selectedRequest.date_of_birth}</p>
                                <p><span className="text-slate-500">Gender:</span> {(selectedRequest as { gender?: string }).gender || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Contact Information</h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500">Email:</span> {selectedRequest.email || 'N/A'}</p>
                                <p><span className="text-slate-500">Phone:</span> {selectedRequest.phone_number}</p>
                                <p><span className="text-slate-500">Address:</span> {selectedRequest.address || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Account Details</h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500">Account Type:</span> {selectedRequest.account_type}</p>
                                <p><span className="text-slate-500">Card Type:</span> {selectedRequest.card_type || 'N/A'}</p>
                                <p><span className="text-slate-500">Status:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedRequest.status}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Identification</h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500">ID Type:</span> {selectedRequest.id_type}</p>
                                <p><span className="text-slate-500">ID Number:</span> {selectedRequest.id_number || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {selectedRequest.notes && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedRequest.notes}</p>
                        </div>
                    )}

                    {selectedRequest.status === 'pending' && (
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => handleApprove(selectedRequest)}
                                disabled={actionLoading}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                            >
                                {actionLoading ? 'Processing...' : 'Approve Request'}
                            </button>
                            <button
                                onClick={() => handleReject(selectedRequest)}
                                disabled={actionLoading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                            >
                                Reject Request
                            </button>
                        </div>
                    )}
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Account Opening Requests</h2>
                <div className="flex gap-2">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === status
                                ? 'bg-blue-600 text-white'
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
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">No account opening requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3 pl-2">ID</th>
                                    <th className="pb-3">Customer Name</th>
                                    <th className="pb-3">Account Type</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Date</th>
                                    <th className="pb-3 text-right pr-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="py-3 pl-2 text-sm font-mono text-slate-600 dark:text-slate-400">
                                            #{request.id}
                                        </td>
                                        <td className="py-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {request.first_name || ''} {request.last_name || 'Unknown'}
                                        </td>
                                        <td className="py-3 text-sm text-slate-600 dark:text-slate-400">
                                            {request.account_type}
                                        </td>
                                        <td className="py-3">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(request.created_at!).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 text-right pr-2">
                                            <button
                                                onClick={() => setSelectedRequest(request)}
                                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold"
                                            >
                                                View Details
                                            </button>
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

export default AccountOpeningsSection;
