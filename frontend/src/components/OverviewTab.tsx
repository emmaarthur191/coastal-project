import React from 'react';
import GlassCard from './ui/modern/GlassCard';
import ModernStatCard from './ui/modern/ModernStatCard';


interface _Branch {
  id: string;
  name: string;
  metrics: {
    total_transactions: number;
    success_rate: string;
    staff_count: number;
  } | null;
}

interface WorkflowStatus {
  loan_disbursements: { completed: number; pending: number };
  account_onboarding: { completed: number; pending: number };
  kyc_verification: { completed: number; pending: number };
  service_charges: { completed: number; pending: number };
}

interface OverviewTabProps {
  loading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: Record<string, any> | null;
  branchActivity: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  workflowStatus: WorkflowStatus | Partial<WorkflowStatus>;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ loading, metrics, branchActivity, workflowStatus }) => {

  const getOperationalMetrics = () => [
    {
      label: 'System Uptime',
      value: (metrics && metrics.system_uptime) || '99.9%',
      icon: '✅',
      trend: 'up',
      change: '+0.1%',
      colorClass: 'text-emerald-600 bg-emerald-50'
    },
    {
      label: 'Transactions Today',
      value: (metrics && metrics.transactions_today !== undefined) ? metrics.transactions_today.toLocaleString() : '0',
      icon: '📈',
      trend: 'up',
      change: `+${(metrics && metrics.transaction_change !== undefined) ? metrics.transaction_change : 0}%`,
      colorClass: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'API Response Time',
      value: `${(metrics && metrics.api_response_time !== undefined) ? metrics.api_response_time : 120}ms`,
      icon: '⏱️',
      trend: 'neutral',
      change: '-5ms',
      colorClass: 'text-amber-600 bg-amber-50'
    },
    {
      label: 'Failed Transactions',
      value: (metrics && metrics.failed_transactions !== undefined) ? metrics.failed_transactions.toString() : '0',
      icon: '❌',
      trend: 'down',
      change: `+${(metrics && metrics.failed_change !== undefined) ? metrics.failed_change : 0}`,
      colorClass: 'text-red-600 bg-red-50'
    }
  ];

  const metricList = getOperationalMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Operational Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricList.map((metric, index) => (
          <ModernStatCard
            key={index}
            label={metric.label}
            value={String(metric.value)}
            icon={<span className="text-2xl">{metric.icon}</span>}
            change={metric.change}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            trend={metric.trend as any} // 'up' | 'down' | 'neutral'
            colorClass={metric.colorClass}
          />
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branch Activity Summary */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📍 Branch Activity Summary
          </h3>
          <div className="space-y-4">
            {(branchActivity || []).map((branch, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {branch.name ? branch.name.split(' ').map((w: string) => w[0]).join('') : 'BR'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{branch.name || 'Unknown Branch'}</h4>
                    <p className="text-sm text-gray-500">{branch.metrics?.total_transactions?.toLocaleString() || 0} txs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 text-lg">{branch.metrics?.success_rate || '0%'}</p>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Success Rate</p>
                </div>
              </div>
            ))}
            {(!branchActivity || branchActivity.length === 0) && (
              <p className="text-center text-gray-400 py-4">No branch activity data.</p>
            )}
          </div>
        </GlassCard>

        {/* Workflow Status */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🔄 Workflow Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* eslint-disable @typescript-eslint/no-explicit-any */}
            {[
              { label: 'Loan Disbursements', completed: (workflowStatus as any)?.loan_disbursements?.completed, pending: (workflowStatus as any)?.loan_disbursements?.pending, icon: '💰' },
              { label: 'Account Onboarding', completed: (workflowStatus as any)?.account_onboarding?.completed, pending: (workflowStatus as any)?.account_onboarding?.pending, icon: '👤' },
              { label: 'KYC Verification', completed: (workflowStatus as any)?.kyc_verification?.completed, pending: (workflowStatus as any)?.kyc_verification?.pending, icon: '🆔' },
              { label: 'Service Charges', completed: (workflowStatus as any)?.service_charges?.completed, pending: (workflowStatus as any)?.service_charges?.pending, icon: '🧾' }
            ].map((workflow, index) => (
              /* eslint-enable @typescript-eslint/no-explicit-any */
              <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2 text-gray-700 font-bold">
                  <span className="text-xl">{workflow.icon}</span>
                  <span className="text-sm">{workflow.label}</span>
                </div>
                <div className="flex justify-center gap-6 mt-3">
                  <div>
                    <div className="text-lg font-black text-emerald-500">{workflow.completed || 0}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Done</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-amber-500">{workflow.pending || 0}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">Pending</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default OverviewTab;
