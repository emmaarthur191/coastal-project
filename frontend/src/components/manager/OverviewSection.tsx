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

      {/* Detailed Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Staff Performance */}
        <PlayfulCard>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800' }}>🏆 Staff Performance</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#888' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Role</th>
                  <th style={{ textAlign: 'center', padding: '10px' }}>TXs</th>
                  <th style={{ textAlign: 'center', padding: '10px' }}>Eff.</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.staff_performance?.map((staff, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{staff.name}</td>
                    <td style={{ padding: '10px', color: '#666' }}>{staff.role}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{staff.transactions}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: THEME.colors.success }}>{staff.efficiency}</td>
                  </tr>
                ))}
                {(!dashboardData?.staff_performance || dashboardData.staff_performance.length === 0) && (
                  <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No active staff metrics today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </PlayfulCard>

        {/* Pending Approvals */}
        <PlayfulCard>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800', display: 'flex', justifyContent: 'space-between' }}>
            <span>📝 Pending Approvals</span>
            <span style={{ fontSize: '12px', background: THEME.colors.warning, color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
              {dashboardData?.pending_approvals?.length || 0} New
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dashboardData?.pending_approvals?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '10px', background: '#fff9f0', borderRadius: '8px', borderLeft: `4px solid ${THEME.colors.warning}` }}>
                <div style={{ marginRight: '10px', fontSize: '18px' }}>
                  {item.type === 'Loan Application' ? '💰' : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.type}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{item.description}</div>
                </div>
                <div style={{ fontSize: '10px', color: '#999' }}>
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            ))}
            {(!dashboardData?.pending_approvals || dashboardData.pending_approvals.length === 0) && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No pending items. All clear! 🎉</div>
            )}
          </div>
        </PlayfulCard>
      </div>
    </div>
  );
};

export default OverviewSection;