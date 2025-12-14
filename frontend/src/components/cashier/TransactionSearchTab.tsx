import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';
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
            case 'completed': return 'bg-emerald-100 text-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-800';
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
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span>🔍</span> Transaction Search
                </h2>
                <p className="text-gray-500">Search and view detailed transaction history.</p>
            </div>

            {/* Search Filters */}
            <GlassCard className="p-6 border-t-[6px] border-t-blue-500">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Search Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        label="Reference #"
                        value={filters.reference}
                        onChange={(e) => setFilters({ ...filters, reference: e.target.value })}
                        placeholder="TXN-..."
                    />
                    <Input
                        label="Member (ID/Email)"
                        value={filters.member}
                        onChange={(e) => setFilters({ ...filters, member: e.target.value })}
                        placeholder="Search member..."
                    />
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                        >
                            <option value="">All Types</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    <Input
                        label="Date From"
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                        className="bg-white"
                    />
                    <Input
                        label="Date To"
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                        className="bg-white"
                    />
                    <Input
                        label="Min Amount"
                        type="number"
                        value={filters.min_amount}
                        onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                        placeholder="0.00"
                    />
                    <Input
                        label="Max Amount"
                        type="number"
                        value={filters.max_amount}
                        onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                        placeholder="0.00"
                    />
                </div>
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={clearFilters}>
                        Clear Filters
                    </Button>
                    <Button variant="primary" onClick={handleSearch} disabled={loading} className="px-8 shadow-lg shadow-blue-100">
                        {loading ? 'Searching...' : 'Search Transactions 🔍'}
                    </Button>
                </div>
            </GlassCard>

            {/* Results */}
            <GlassCard className="p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Results</h3>
                    <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">{transactions.length}</div>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-4">🔍</div>
                        <p>No transactions found</p>
                        <p className="text-sm">Use the filters above to search</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 cursor-default text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4 border-b border-gray-200">Reference</th>
                                    <th className="p-4 border-b border-gray-200">Type</th>
                                    <th className="p-4 border-b border-gray-200">Amount</th>
                                    <th className="p-4 border-b border-gray-200">Status</th>
                                    <th className="p-4 border-b border-gray-200">Date</th>
                                    <th className="p-4 border-b border-gray-200 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-500">{tx.reference_number || tx.id.slice(-8)}</td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-2 font-medium text-gray-700 capitalize">
                                                {getTypeIcon(tx.transaction_type)}
                                                {tx.transaction_type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">{formatCurrencyGHS(parseFloat(tx.amount))}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-xs text-nowrap">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="secondary" size="sm" onClick={() => setSelectedTx(tx)} className="text-xs h-8">
                                                Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Transaction Details</h3>
                            <button
                                onClick={() => setSelectedTx(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <span className="text-gray-500 font-medium">Amount</span>
                                <span className="text-3xl font-black text-coastal-primary tracking-tight">
                                    {formatCurrencyGHS(parseFloat(selectedTx.amount))}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Reference</label>
                                    <p className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                                        {selectedTx.reference_number || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Type</label>
                                    <p className="font-bold text-gray-700 capitalize flex items-center gap-2">
                                        {getTypeIcon(selectedTx.transaction_type)} {selectedTx.transaction_type}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
                                    <p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(selectedTx.status)}`}>
                                            {selectedTx.status}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Date</label>
                                    <p className="font-medium text-gray-700 text-sm">{new Date(selectedTx.timestamp).toLocaleString()}</p>
                                </div>
                            </div>

                            {(selectedTx.from_account || selectedTx.to_account) && (
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    {selectedTx.from_account && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">From Account:</span>
                                            <span className="font-mono text-gray-700">
                                                {selectedTx.from_account.account_number}
                                            </span>
                                        </div>
                                    )}
                                    {selectedTx.to_account && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">To Account:</span>
                                            <span className="font-mono text-gray-700">
                                                {selectedTx.to_account.account_number}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedTx.description && (
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                                    <p className="font-medium text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        {selectedTx.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 pt-0 flex justify-end">
                            <Button variant="secondary" onClick={() => setSelectedTx(null)} className="w-full">
                                Close Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionSearchTab;
