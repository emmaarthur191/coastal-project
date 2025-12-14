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
            colorClass={idx % 2 === 0 ? 'bg-cyan-50 text-cyan-600' : 'bg-purple-50 text-purple-600'}
          />
        ))}
      </div>

      {/* Detailed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Staff Performance Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🏆 <span className="text-coastal-dark">Top Staff Performance</span>
            </h3>
            <button className="text-xs text-coastal-primary font-semibold hover:underline">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3 text-center">TXs</th>
                  <th className="pb-3 text-right pr-2">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {dashboardData?.staff_performance?.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-white shadow-sm">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{staff.name}</p>
                          <p className="text-xs text-gray-400">{staff.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {staff.transactions}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <span className="text-sm font-bold text-emerald-600">{staff.efficiency}</span>
                    </td>
                  </tr>
                ))}
                {(!dashboardData?.staff_performance || dashboardData.staff_performance.length === 0) && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-400 text-sm">No activity recorded today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Pending Approvals List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              📝 <span className="text-coastal-dark">Pending Approvals</span>
            </h3>
            {dashboardData?.pending_approvals && dashboardData.pending_approvals.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold shadow-sm">
                {dashboardData.pending_approvals.length} Pending
              </span>
            )}
          </div>

          <div className="space-y-3">
            {dashboardData?.pending_approvals?.map((item, idx) => (
              <div key={idx} className="group flex items-start p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-amber-100 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer">
                <div className={`p-2.5 rounded-lg mr-4 ${item.type === 'Loan Application' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  <span className="text-lg">{item.type === 'Loan Application' ? '💰' : '👤'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-gray-800 truncate">{item.type}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>
                <div className="ml-2 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-2 py-1 rounded shadow-sm">
                    Review
                  </button>
                </div>
              </div>
            ))}
            {(!dashboardData?.pending_approvals || dashboardData.pending_approvals.length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-2">🎉</span>
                <p className="text-gray-500 font-medium">All clear!</p>
                <p className="text-gray-400 text-xs">No pending items to review.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default OverviewSection;