import React from 'react';
// Assuming the types are defined in the main component or imported from a types file
import { formatCurrencyGHS } from '../utils/formatters'; // Assuming this utility exists

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#FFF0F5', // Lavender Blush
    primary: '#6C5CE7', // Purple
    secondary: '#00CEC9', // Teal
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon
    warning: '#FDCB6E', // Mustard
    sidebar: '#FFFFFF',
    text: '#2D3436',
    border: '#dfe6e9',
  },
  shadows: {
    card: '0 8px 0px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.2)',
    active: '0 2px 0px rgba(0,0,0,0.2)',
  },
  radius: {
    card: '24px',
    button: '50px',
  }
};

// --- STYLED WRAPPERS ---
const PlayfulCard = ({ children, color = '#FFFFFF', style = {} }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.card,
    border: '3px solid #000000',
    boxShadow: THEME.shadows.card,
    padding: '24px',
    marginBottom: '24px',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: variant === 'danger' ? THEME.colors.danger : THEME.colors.primary,
      color: 'white',
      border: '3px solid #000000',
      padding: '12px 24px',
      borderRadius: THEME.radius.button,
      fontWeight: '900',
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'all 0.1s',
      ...style
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'translateY(4px)';
      e.currentTarget.style.boxShadow = THEME.shadows.active;
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = THEME.shadows.button;
    }}
  >
    {children}
  </button>
);

interface Metric {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  change: string;
}

interface Branch {
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
  metrics: Record<string, any> | null;
  branchActivity: Branch[];
  workflowStatus: WorkflowStatus | {};
}

const OverviewTab: React.FC<OverviewTabProps> = ({ loading, metrics, branchActivity, workflowStatus }) => {

  const operationalMetrics: Metric[] = [
    {
      label: 'System Uptime',
      value: (metrics && metrics.system_uptime) || '99.9%',
      icon: '✅',
      color: '#10b981',
      change: '+0.1%'
    },
    {
      label: 'Transactions Today',
      value: (metrics && metrics.transactions_today !== undefined) ? metrics.transactions_today.toLocaleString() : '0',
      icon: '📈',
      color: '#3b82f6',
      change: `+${(metrics && metrics.transaction_change !== undefined) ? metrics.transaction_change : 0}%`
    },
    {
      label: 'API Response Time',
      value: `${(metrics && metrics.api_response_time !== undefined) ? metrics.api_response_time : 120}ms`,
      icon: '⏱️',
      color: '#f59e0b',
      change: '-5ms'
    },
    {
      label: 'Failed Transactions',
      value: (metrics && metrics.failed_transactions !== undefined) ? metrics.failed_transactions.toString() : '0',
      icon: '❌',
      color: '#ef4444',
      change: `+${(metrics && metrics.failed_change !== undefined) ? metrics.failed_change : 0}`
    }
  ];

  return (
    <>
      <style>
        {`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}
      </style>
      {/* Operational Metrics */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {loading ? (
          // Skeleton/Shimmer loading state
          Array(4).fill(0).map((_, index) => (
            <PlayfulCard key={index} style={{ height: '120px', padding: '20px' }}>
              <div style={{ background: THEME.colors.border, height: '44px', width: '44px', borderRadius: THEME.radius.card, marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
              <div style={{ background: THEME.colors.border, height: '20px', width: '60%', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
              <div style={{ background: THEME.colors.border, height: '14px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
            </PlayfulCard>
          ))
        ) : (
          operationalMetrics.map((metric, index) => (
            <PlayfulCard key={index} style={{
              cursor: 'pointer',
              animation: `fadeIn 0.3s ease-in-out ${index * 100}ms both`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', background: metric.color, borderRadius: THEME.radius.card,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'white'
                }}>
                  {metric.icon}
                </div>
                <div style={{
                  background: metric.change.startsWith('+') ? THEME.colors.secondary : THEME.colors.warning,
                  color: 'white',
                  border: 'none', padding: '4px 8px', fontSize: '11px', borderRadius: '12px', fontWeight: 'bold'
                }}>
                  {metric.change}
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: THEME.colors.text, marginBottom: '4px' }}>
                {metric.value}
              </div>
              <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {metric.label}
              </div>
            </PlayfulCard>
          ))
        )}
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Branch Activity Summary */}
        <PlayfulCard>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: THEME.colors.text, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📍 Branch Activity Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <PlayfulCard key={index} style={{ height: '80px', padding: '20px', marginBottom: '0' }} color="#f0f0f0">
                  <div style={{ background: THEME.colors.border, height: '100%', borderRadius: THEME.radius.card, animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                </PlayfulCard>
              ))
            ) : (
              (branchActivity || []).map((branch, index) => (
                <div key={index} style={{
                  padding: '16px', background: '#f8f9fa', borderRadius: THEME.radius.card, border: '2px solid #ddd', display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                  <div style={{
                    width: '44px', height: '44px', background: THEME.colors.primary, borderRadius: THEME.radius.card,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px', flexShrink: 0
                  }}>
                    {branch.name ? branch.name.split(' ').map((w: string) => w[0]).join('') : 'BR'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: THEME.colors.text, marginBottom: '4px' }}>
                      {branch.name || 'Unknown Branch'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {branch.metrics?.total_transactions?.toLocaleString() || 0} transactions
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: THEME.colors.secondary }}>
                      {branch.metrics?.success_rate || '0%'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Success Rate
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PlayfulCard>

        {/* Workflow Status */}
        <PlayfulCard>
          <h3 style={{ fontSize: '24px', fontWeight: '900', color: THEME.colors.text, marginBottom: '20px' }}>
            🔄 Workflow Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <PlayfulCard key={index} style={{ height: '90px', padding: '16px', marginBottom: '0' }} color="#f0f0f0">
                  <div style={{ background: THEME.colors.border, height: '100%', borderRadius: THEME.radius.card, animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                </PlayfulCard>
              ))
            ) : (
              [
                  { label: 'Loan Disbursements', completed: (workflowStatus as WorkflowStatus)?.loan_disbursements?.completed || 0, pending: (workflowStatus as WorkflowStatus)?.loan_disbursements?.pending || 0, icon: '💰' },
                  { label: 'Account Onboarding', completed: (workflowStatus as WorkflowStatus)?.account_onboarding?.completed || 0, pending: (workflowStatus as WorkflowStatus)?.account_onboarding?.pending || 0, icon: '👤' },
                  { label: 'KYC Verification', completed: (workflowStatus as WorkflowStatus)?.kyc_verification?.completed || 0, pending: (workflowStatus as WorkflowStatus)?.kyc_verification?.pending || 0, icon: '🆔' },
                  { label: 'Service Charges', completed: (workflowStatus as WorkflowStatus)?.service_charges?.completed || 0, pending: (workflowStatus as WorkflowStatus)?.service_charges?.pending || 0, icon: '🧾' }
              ].map((workflow, index) => (
                <div key={index} style={{ padding: '16px', background: '#f8f9fa', borderRadius: THEME.radius.card, border: '2px solid #ddd', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: THEME.colors.text, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{workflow.icon}</span>
                    {workflow.label}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: THEME.colors.secondary }}>{workflow.completed}</div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Done</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: THEME.colors.warning }}>{workflow.pending}</div>
                      <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Pending</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PlayfulCard>
      </section>
    </>
  );
};

export default OverviewTab;