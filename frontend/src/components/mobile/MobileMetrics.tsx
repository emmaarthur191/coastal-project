import React from 'react';
import { PlayfulCard, THEME } from './MobileTheme';
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
    { label: 'Visits', value: loadingMetrics ? '...' : (metrics?.scheduled_visits || 0).toString(), icon: '🛵', color: THEME.colors.primary },
    { label: 'Done', value: loadingMetrics ? '...' : (metrics?.completed_today || 0).toString(), icon: '✅', color: THEME.colors.success },
    { label: 'Collect', value: loadingMetrics ? '...' : formatCurrencyGHS(metrics?.collections_due || 0), icon: '💰', color: THEME.colors.warning },
    { label: 'New Apps', value: loadingMetrics ? '...' : (metrics?.new_applications || 0).toString(), icon: '📝', color: THEME.colors.info }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
      {fieldMetrics.map((m, i) => (
        <PlayfulCard key={i} color={m.color} style={{ color: 'white', borderColor: 'black', textAlign: 'center', padding: '15px' }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>{m.icon}</div>
          <div style={{ fontSize: '20px', fontWeight: '900' }}>{m.value}</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>{m.label}</div>
        </PlayfulCard>
      ))}
    </div>
  );
};

export default MobileMetrics;