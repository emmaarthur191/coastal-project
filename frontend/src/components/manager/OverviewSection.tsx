import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import ModernStatCard from '../ui/modern/ModernStatCard';

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

interface DashboardData {
  branch_metrics?: Metric[];
  staff_performance?: any[];
  pending_approvals?: any[];
}

interface OverviewSectionProps {
  dashboardData: DashboardData | null;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ dashboardData }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData?.branch_metrics?.map((metric, idx) => (
          <ModernStatCard
            key={idx}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            icon={<span className="text-2xl">{metric.icon}</span>}
            colorClass={idx % 2 === 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-purple-600 dark:text-purple-400'}
          />
        ))}
      </div>

      {/* Detailed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Staff Performance Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              🏆 <span>Top Staff Performance</span>
            </h3>
            <button className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3 text-center">TXs</th>
                  <th className="pb-3 text-right pr-2">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {dashboardData?.staff_performance?.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 border border-white dark:border-slate-600 shadow-sm">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{staff.name}</p>
                          <p className="text-xs text-slate-400">{staff.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {staff.transactions}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{staff.efficiency}</span>
                    </td>
                  </tr>
                ))}
                {(!dashboardData?.staff_performance || dashboardData.staff_performance.length === 0) && (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No activity recorded today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Pending Approvals List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              📝 <span>Pending Approvals</span>
            </h3>
            {dashboardData?.pending_approvals && dashboardData.pending_approvals.length > 0 && (
              <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                {dashboardData.pending_approvals.length} Pending
              </span>
            )}
          </div>

          <div className="space-y-3">
            {dashboardData?.pending_approvals?.map((item, idx) => (
              <div key={idx} className="group flex items-start p-3 bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer">

                <div className={`p-2.5 rounded-lg mr-4 ${item.type === 'Loan Application' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                  <span className="text-lg">{item.type === 'Loan Application' ? '💰' : '👤'}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.type}</p>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                <div className="ml-2 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 hover:bg-slate-50 text-slate-600 dark:text-white px-2 py-1 rounded shadow-sm">
                    Review
                  </button>
                </div>
              </div>
            ))}
            {(!dashboardData?.pending_approvals || dashboardData.pending_approvals.length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-2">🎉</span>
                <p className="text-slate-500 dark:text-slate-400 font-medium">All clear!</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">No pending items to review.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default OverviewSection;