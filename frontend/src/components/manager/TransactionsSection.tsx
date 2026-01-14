import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { Transaction } from '../../api/models/Transaction';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import GlassCard from '../ui/modern/GlassCard';
import ModernStatCard from '../ui/modern/ModernStatCard';

const TransactionsSection: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await authService.getAllTransactions();
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status?: string) => {
    const s = status?.toLowerCase() || 'unknown';
    let classes = 'bg-gray-100 text-gray-600';
    if (s === 'completed') classes = 'bg-emerald-100 text-emerald-700';
    else if (s === 'pending') classes = 'bg-amber-100 text-amber-700';
    else if (s === 'failed') classes = 'bg-red-100 text-red-700';
    else if (s === 'cancelled') classes = 'bg-slate-200 text-slate-600';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${classes}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      case 'transfer': return '🔄';
      case 'payment': return '💳';
      case 'fee': return '📋';
      default: return '💵';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filter.type === 'all' || tx.transaction_type === filter.type;
    const matchesStatus = filter.status === 'all' || tx.status === filter.status;
    const matchesSearch = filter.search === '' ||
      (tx.description && tx.description.toLowerCase().includes(filter.search.toLowerCase())) ||
      tx.id.toString().includes(filter.search);
    return matchesType && matchesStatus && matchesSearch;
  });

  const totalVolume = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>💸</span> All Transactions
        </h3>
        <Button onClick={fetchTransactions} variant="secondary" icon={() => <span>🔄</span>}>
          Refresh
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernStatCard
          label="Total Transactions"
          value={String(filteredTransactions.length)}
          icon={<span>📊</span>}
          colorClass="text-blue-600 bg-blue-50"
          trend="neutral"
        />
        <ModernStatCard
          label="Completed"
          value={String(filteredTransactions.filter(t => t.status === 'completed').length)}
          icon={<span>✅</span>}
          colorClass="text-emerald-600 bg-emerald-50"
          trend="up"
        />
        <ModernStatCard
          label="Pending"
          value={String(filteredTransactions.filter(t => t.status === 'pending').length)}
          icon={<span>⏳</span>}
          colorClass="text-amber-600 bg-amber-50"
          trend="neutral"
        />
        <ModernStatCard
          label="Total Volume"
          value={formatCurrency(totalVolume)}
          icon={<span>💰</span>}
          colorClass="text-purple-600 bg-purple-50"
          trend="up"
        />
      </div>

      {/* Filters */}
      <Card className="p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Search</label>
            <Input
              className="mb-0"
              placeholder="ID or description..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Type</label>
            <select
              title="Filter by type"
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="payment">Payment</option>
              <option value="fee">Fee</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Status</label>
            <select
              title="Filter by status"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200 text-left">
                <th className="p-4 font-bold text-gray-700 text-sm uppercase tracking-wider">ID</th>
                <th className="p-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Type</th>
                <th className="p-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Amount</th>
                <th className="p-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Description</th>
                <th className="p-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-gray-700 text-sm uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p>No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-gray-500">#{tx.id}</td>
                    <td className="p-4 font-medium text-gray-800">
                      <span className="text-xl mr-2">{getTypeIcon(tx.transaction_type)}</span>
                      {tx.transaction_type}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">
                      {tx.description || 'No description'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default TransactionsSection;
