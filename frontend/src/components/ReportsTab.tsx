import React from 'react';
import { formatCurrencyGHS } from '../utils/formatters';

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

interface ReportsTabProps {
  handleGenerateReport: (reportType: string) => void;
  authService: any;
  reportData?: any;
  setReportData?: React.Dispatch<React.SetStateAction<any>>;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ handleGenerateReport, authService, reportData, setReportData }) => {
  return (
    <PlayfulCard>
      <h3 style={{
        fontSize: '24px',
        fontWeight: '900',
        color: THEME.colors.text,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🧾 Report Generation
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {[
          {
            type: 'daily_transaction',
            title: 'Daily Transaction Report',
            description: 'Comprehensive daily transaction summary',
            icon: '📊'
          },
          {
            type: 'system_performance',
            title: 'System Performance Report',
            description: 'System uptime and performance metrics',
            icon: '⚡'
          },
          {
            type: 'staff_activity',
            title: 'Staff Activity Report',
            description: 'Staff productivity and activity logs',
            icon: '👥'
          },
          {
            type: 'security_audit',
            title: 'Security Audit Report',
            description: 'Security incidents and compliance status',
            icon: '🔒'
          }
        ].map((report, index) => (
          <div key={index} style={{
            cursor: 'pointer',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #ddd',
            transition: 'all 0.2s ease'
          }}
          onClick={() => handleGenerateReport(report.type)}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = THEME.colors.primary}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#ddd'}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{report.icon}</div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: THEME.colors.text,
              marginBottom: '8px'
            }}>
              {report.title}
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#666'
            }}>
              {report.description}
            </p>
          </div>
        ))}
      </div>

      {reportData && (
        <PlayfulCard style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', color: THEME.colors.text, marginBottom: '4px' }}>
                {reportData.report_type}
              </h4>
              <p style={{ fontSize: '16px', color: '#666' }}>
                Period: {reportData.period}
              </p>
            </div>
            <PlayfulButton
              onClick={() => setReportData && setReportData(null)}
              variant="danger"
            >
              Close Report
            </PlayfulButton>
          </div>

          {/* Daily Transaction Report */}
          {reportData.report_type === 'Daily Transaction Report' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {reportData.total_transactions?.toLocaleString() || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Total Transactions
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {formatCurrencyGHS(reportData.total_volume || 0)}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Total Volume
                </div>
              </div>
              {reportData.by_type && Object.entries(reportData.by_type).map(([type, data]: [string, any]) => (
                <div key={type} className="md-outlined-card" style={{ padding: '16px' }}>
                  <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '8px', textTransform: 'capitalize' }}>
                    {type}
                  </div>
                  <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Count: {data.count?.toLocaleString() || 0}
                  </div>
                  <div className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Volume: {formatCurrencyGHS(data.volume || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* System Performance Report */}
          {reportData.report_type === 'System Performance Report' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '4px' }}>
                  {reportData.uptime}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  System Uptime
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {reportData.avg_response_time}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Avg Response Time
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {reportData.total_requests?.toLocaleString() || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Total Requests
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-error)', marginBottom: '4px' }}>
                  {reportData.failed_requests?.toLocaleString() || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Failed Requests
                </div>
              </div>
            </div>
          )}

          {/* Staff Activity Report */}
          {reportData.report_type === 'Staff Activity Report' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {reportData.total_staff || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Total Staff
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🟢</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '4px' }}>
                  {reportData.active_staff || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Active Staff
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {reportData.transactions_processed?.toLocaleString() || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Transactions Processed
                </div>
              </div>
            </div>
          )}

          {/* Security Audit Report */}
          {reportData.report_type === 'Security Audit Report' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚨</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-error)', marginBottom: '4px' }}>
                  {reportData.failed_login_attempts || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Failed Login Attempts
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-tertiary)', marginBottom: '4px' }}>
                  {reportData.suspicious_activities || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Suspicious Activities
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
                <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                  {reportData.security_incidents || 0}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Security Incidents
                </div>
              </div>
              <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {reportData.compliance_status === 'Compliant' ? '✅' : '❌'}
                </div>
                <div className="md-typescale-headline-small" style={{
                  color: reportData.compliance_status === 'Compliant' ? 'var(--md-sys-color-secondary)' : 'var(--md-sys-color-error)',
                  marginBottom: '4px'
                }}>
                  {reportData.compliance_status}
                </div>
                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Compliance Status
                </div>
              </div>
            </div>
          )}
        </PlayfulCard>
      )}
    </PlayfulCard>
  );
};

export default ReportsTab;