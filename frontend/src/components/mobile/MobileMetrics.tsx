import React from 'react';
import ModernStatCard from '../ui/modern/ModernStatCard';
import { formatCurrencyGHS } from '../../utils/formatters';

interface MobileMetricsProps {
  metrics: {
    scheduled_visits?: number;
    completed_today?: number;
    collections_due?: number;
    new_applications?: number;
  };
  loadingMetrics: boolean;
}

const MobileMetrics: React.FC<MobileMetricsProps> = ({ metrics, loadingMetrics }) => {
  const fieldMetrics = [
    {
      label: 'Visits',
      value: loadingMetrics ? '...' : (metrics?.scheduled_visits || 0).toString(),
      icon: '🛵',
      colorClass: 'text-indigo-600 bg-indigo-50',
      trend: 'neutral'
    },
    {
      label: 'Done',
      value: loadingMetrics ? '...' : (metrics?.completed_today || 0).toString(),
      icon: '✅',
      colorClass: 'text-emerald-600 bg-emerald-50',
      trend: 'up'
    },
    {
      label: 'Collect',
      value: loadingMetrics ? '...' : formatCurrencyGHS(metrics?.collections_due || 0),
      icon: '💰',
      colorClass: 'text-amber-600 bg-amber-50',
      trend: 'neutral'
    },
    {
      label: 'New Apps',
      value: loadingMetrics ? '...' : (metrics?.new_applications || 0).toString(),
      icon: '📝',
      colorClass: 'text-sky-600 bg-sky-50',
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {fieldMetrics.map((m, i) => (
        <ModernStatCard
          key={i}
          label={m.label}
          value={m.value}
          icon={<span className="text-2xl">{m.icon}</span>}
          colorClass={m.colorClass}
          trend={m.trend as any}
        />
      ))}
    </div>
  );
};

export default MobileMetrics;
