import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrencyGHS } from '../../utils/formatters';

interface Transaction {
    id: string;
    reference_number: string;
    transaction_type: string;
    amount: string;
    status: string;
    timestamp: string;
    description: string;
    from_account: {
        id: string;
        account_number: string;
        user_email: string;
    } | null;
    to_account: {
        id: string;
        account_number: string;
        user_email: string;
    } | null;
}

const TransactionSearchTab: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [filters, setFilters] = useState({
        reference: '',
        member: '',
        type: '',
        status: '',
        date_from: '',
        date_to: '',
        min_amount: '',
        max_amount: ''
    });

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`transactions/search/?${params.toString()}`);
            setTransactions(response.data?.results || []);
        } catch (error) {
            console.error('Error searching transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            reference: '',
            member: '',
            type: '',
            status: '',
            date_from: '',
            date_to: '',
            min_amount: '',
            max_amount: ''
        });
        setTransactions([]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'deposit': return '💵';
            case 'withdrawal': return '🏧';
            case 'transfer': return '↔️';
            default: return '💳';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-secondary-900">🔍 Transaction Search</h2>
                <p className="text-secondary-600">Search and view transaction details</p>
            </div>

            {/* Search Filters */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-secondary-900 mb-4">Search Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Reference #</label>
                        <input
                            type="text"
                            value={filters.reference}
                            onChange={(e) => setFilters({ ...filters, reference: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                            placeholder="TXN-..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Member (ID/Email)</label>
                        <input
                            type="text"
                            value={filters.member}
                            onChange={(e) => setFilters({ ...filters, member: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                            placeholder="Search member..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                        >
                            <option value="">All Types</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Date From</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Date To</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Min Amount</label>
                        <input
                            type="number"
                            value={filters.min_amount}
                            onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-600 mb-1">Max Amount</label>
                        <input
                            type="number"
                            value={filters.max_amount}
                            onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-4">
                    <Button variant="primary" onClick={handleSearch} disabled={loading}>
                        {loading ? 'Searching...' : '🔍 Search'}
                    </Button>
                    <Button variant="secondary" onClick={clearFilters}>
                        Clear
                    </Button>
                </div>
            </Card>

            {/* Results */}
            <Card>
                <h3 className="text-lg font-bold text-secondary-900 mb-4">
                    Results ({transactions.length})
                </h3>

                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-secondary-500">
                        <div className="text-4xl mb-2">🔍</div>
                        <p>No transactions found</p>
                        <p className="text-sm">Use the filters above to search</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50">
                                <tr>
                                    <th className="text-left p-3 font-medium text-secondary-600">Reference</th>
                                    <th className="text-left p-3 font-medium text-secondary-600">Type</th>
                                    <th className="text-left p-3 font-medium text-secondary-600">Amount</th>
                                    <th className="text-left p-3 font-medium text-secondary-600">Status</th>
                                    <th className="text-left p-3 font-medium text-secondary-600">Date</th>
                                    <th className="text-left p-3 font-medium text-secondary-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                                        <td className="p-3 font-mono text-sm">{tx.reference_number || tx.id.slice(-8)}</td>
                                        <td className="p-3">
                                            <span className="flex items-center gap-2">
                                                {getTypeIcon(tx.transaction_type)}
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold">{formatCurrencyGHS(parseFloat(tx.amount))}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-secondary-600">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-3">
                                            <Button variant="primary" size="sm" onClick={() => setSelectedTx(tx)}>
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-secondary-900">Transaction Details</h3>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="text-secondary-400 hover:text-secondary-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-secondary-50 rounded-lg">
                                <span className="text-secondary-600">Amount</span>
                                <span className="text-2xl font-bold text-primary-600">
                                    {formatCurrencyGHS(parseFloat(selectedTx.amount))}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-secondary-500">Reference #</label>
                                    <p className="font-medium font-mono">{selectedTx.reference_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-secondary-500">Type</label>
                                    <p className="font-medium capitalize">{selectedTx.transaction_type}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-secondary-500">Status</label>
                                    <p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedTx.status)}`}>
                                            {selectedTx.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-secondary-500">Date & Time</label>
                                    <p className="font-medium">{new Date(selectedTx.timestamp).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedTx.from_account && (
                                <div className="p-4 border border-secondary-200 rounded-lg">
                                    <h4 className="font-bold text-secondary-700 mb-2">From Account</h4>
                                    <p className="font-mono text-sm">{selectedTx.from_account.account_number}</p>
                                    <p className="text-secondary-600">{selectedTx.from_account.user_email}</p>
                                </div>
                            )}

                            {selectedTx.to_account && (
                                <div className="p-4 border border-secondary-200 rounded-lg">
                                    <h4 className="font-bold text-secondary-700 mb-2">To Account</h4>
                                    <p className="font-mono text-sm">{selectedTx.to_account.account_number}</p>
                                    <p className="text-secondary-600">{selectedTx.to_account.user_email}</p>
                                </div>
                            )}

                            {selectedTx.description && (
                                <div>
                                    <label className="text-sm text-secondary-500">Description</label>
                                    <p className="font-medium">{selectedTx.description}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button variant="secondary" onClick={() => setSelectedTx(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionSearchTab;
