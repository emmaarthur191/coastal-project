import React from 'react';
import { PlayfulCard, THEME } from './ManagerTheme';

interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Custom Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {dashboardData?.branch_metrics?.map((metric, idx) => (
          <PlayfulCard key={idx} color={idx % 2 === 0 ? '#dff9fb' : '#fff0f5'} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '30px' }}>{metric.icon}</div>
            <div style={{ color: '#888', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>{metric.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: THEME.colors.text, margin: '5px 0' }}>{metric.value}</div>
            <div style={{ color: metric.trend === 'up' ? THEME.colors.success : THEME.colors.danger, fontWeight: 'bold' }}>
              {metric.change} {metric.trend === 'up' ? '↗' : '↘'}
            </div>
          </PlayfulCard>
        ))}
      </div>
      <PlayfulCard>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '900' }}>📊 System Overview</h3>
        <p style={{ color: '#666', margin: 0 }}>
          Welcome to Boss Mode! Your comprehensive banking management dashboard.
          Monitor system performance, manage staff, oversee transactions, and control all banking operations from here.
        </p>
      </PlayfulCard>
    </div>
  );
};

export default OverviewSection;