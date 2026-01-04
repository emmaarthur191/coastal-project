import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { formatCurrencyGHS } from '../../utils/formatters';

interface Transaction {
  id: string;
  amount: number;
}

interface OverviewTabProps {
  dailySummary: {
    transactions: number;
    totalAmount: string;
    cashOnHand: string;
    pendingApprovals: number;
  };
  transactions: Transaction[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ dailySummary, transactions }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">📊</span>
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Transactions Today</h4>
            <p className="text-3xl font-black text-gray-800">{dailySummary.transactions}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-l-4 border-l-emerald-400">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">💰</span>
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Amount</h4>
            <p className="text-3xl font-black text-emerald-600">{dailySummary.totalAmount}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-l-4 border-l-blue-400">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">🏦</span>
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Cash On Hand</h4>
            <p className="text-3xl font-black text-blue-600">{dailySummary.cashOnHand}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-l-4 border-l-amber-400">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">⏳</span>
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Pending Items</h4>
            <p className="text-3xl font-black text-amber-600">{dailySummary.pendingApprovals}</p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Recent Activity</h3>
              <button className="text-xs font-bold text-coastal-primary hover:underline">View All</button>
            </div>
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">No transactions today</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactions.slice(0, 5).map((tx, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">
                        TX
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 text-sm">{tx.id || 'TX-PENDING'}</div>
                        <div className="text-xs text-gray-400">Today</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-gray-800">
                      {formatCurrencyGHS(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        <GlassCard className="p-6 bg-gradient-to-br from-coastal-primary to-blue-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="text-9xl">🔔</span>
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-4 text-white">System Status</h3>
            <div className="flex items-center gap-3 mb-6 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-medium text-sm">All Systems Operational</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div className="text-xs text-blue-200 uppercase font-bold mb-1">Last Sync</div>
                <div className="font-mono">{new Date().toLocaleTimeString()}</div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <div className="text-xs text-blue-200 uppercase font-bold mb-1">Session Active</div>
                <div className="font-mono">Secure Connection</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default OverviewTab;
