import React from 'react';
import { formatCurrencyGHS } from '../utils/formatters';

function OverviewSection({ dashboardData }) {
  const branchMetrics = dashboardData?.branch_metrics || [];

  // Show empty state if no data
  if (branchMetrics.length === 0) {
    return (
      <div style={{
        background: '#f8fafc',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <p style={{ color: '#64748b', fontSize: '14px' }}>No branch metrics available</p>
      </div>
    );
  }

  return (
    <>
      {/* Branch Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {branchMetrics.map((metric, index) => (
          <div key={index} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {metric.icon}
              </div>
              <div style={{
                background: metric.trend === 'up' ? '#dbeafe' : '#fef2f2',
                color: metric.trend === 'up' ? '#1e40af' : '#dc2626',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {metric.change}
              </div>
            </div>
            <div style={{
              color: '#1e293b',
              fontSize: '24px',
              fontWeight: '700',
              lineHeight: '1.2',
              marginBottom: '8px'
            }}>
              {metric.value}
            </div>
            <div style={{
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default OverviewSection;