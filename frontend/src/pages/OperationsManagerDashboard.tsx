import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.ts';
import OverviewTab from '../components/OverviewTab';
import ServiceChargesTab from '../components/ServiceChargesTab';
import ReportsTab from '../components/ReportsTab';
import LoanApprovalsSection from '../components/LoanApprovalsSection';
import ClientRegistrationTab from '../components/ClientRegistrationTab';
import AccountsTab from '../components/AccountsTab';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#F0F4F8',
    primary: '#6C5CE7', // Purple
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon Red
    warning: '#FDCB6E', // Mustard
    info: '#74B9FF', // Sky Blue
    white: '#FFFFFF',
    text: '#2D3436',
    muted: '#636E72',
    border: '#DFE6E9',
  },
  shadows: {
    card: '0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.15)', // "Pressed" 3D effect
    buttonActive: '0 2px 0px rgba(0,0,0,0.15)',
  },
  radius: {
    small: '12px',
    medium: '20px',
    large: '35px',
    round: '50px'
  }
};

// --- STYLED SUB-COMPONENTS ---

const PlayfulCard = ({ children, color = THEME.colors.white, style = {} }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.medium,
    boxShadow: THEME.shadows.card,
    padding: '24px',
    border: '3px solid white',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style, type }: { children: React.ReactNode; onClick?: () => void; variant?: string; style?: React.CSSProperties; type?: "button" | "reset" | "submit" }) => {
  const bg = variant === 'danger' ? THEME.colors.danger :
            variant === 'success' ? THEME.colors.success :
            THEME.colors.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: bg,
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: THEME.radius.round,
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: THEME.shadows.button,
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(4px)';
        e.currentTarget.style.boxShadow = THEME.shadows.buttonActive;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }}
    >
      {children}
    </button>
  );
};

// --- Types for Data Structures ---
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

type ActiveView = 'overview' | 'accounts' | 'client-registration' | 'loan-approvals' | 'branches' | 'reports' | 'alerts' | 'charges' | 'messaging' | 'staff-ids';

function OperationsManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role);

  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [loading, setLoading] = useState(true);

  // Consolidated State for Data
  const [dashboardData, setDashboardData] = useState<{
    metrics: Record<string, any> | null;
    branchActivity: Branch[];
    systemAlerts: any[];
    workflowStatus: WorkflowStatus | {};
    serviceCharges: any[];
  }>({
    metrics: null,
    branchActivity: [],
    systemAlerts: [],
    workflowStatus: {},
    serviceCharges: [],
  });

  // State specific to Service Charges Tab
  const [newCharge, setNewCharge] = useState({
    name: '',
    description: '',
    charge_type: 'percentage',
    rate: '',
    applicable_to: []
  });
  const [serviceChargeCalculation, setServiceChargeCalculation] = useState<any>(null);

  // State for Reports
  const [reportData, setReportData] = useState(null);

  // State for Staff IDs
  const [staffIds, setStaffIds] = useState([]);
  const [staffIdFilters, setStaffIdFilters] = useState({});

  // --- Handlers ---

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleGenerateReport = useCallback(async (reportType: string) => {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const reportDataPayload = {
      type: reportType,
      date_from: lastWeek,
      date_to: today
    };

    const result = await authService.generateReport(reportDataPayload);
    if (result.success) {
      alert(`Report of type '${reportType}' generated successfully! (Check console)`);
      console.log('Generated Report Data:', result.data);
      setReportData(result.data);
    } else {
      alert('Failed to generate report: ' + result.error);
    }
  }, []);

  // --- Data Fetcher ---

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [metricsRes, branchRes, alertsRes, workflowRes, chargesRes] = await Promise.all([
          authService.getOperationalMetrics(),
          authService.getBranchActivity(),
          authService.getSystemAlerts(),
          authService.getWorkflowStatus(),
          authService.getServiceCharges()
        ]);

        setDashboardData({
          metrics: metricsRes.success ? metricsRes.data : {},
          branchActivity: branchRes.success && Array.isArray(branchRes.data) ? branchRes.data : [],
          systemAlerts: alertsRes.success && Array.isArray(alertsRes.data) ? alertsRes.data : [],
          workflowStatus: workflowRes.success ? workflowRes.data : {},
          serviceCharges: chargesRes.success && Array.isArray(chargesRes.data) ? chargesRes.data : [],
        });

      } catch (error) {
        console.error('Error fetching operations data:', error);
        setDashboardData({
            metrics: {}, branchActivity: [], systemAlerts: [], workflowStatus: {}, serviceCharges: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- MENU ITEMS CONFIG ---
  const menuItems = [
    { id: 'overview', name: 'Overview', icon: '📊', color: THEME.colors.primary },
    { id: 'accounts', name: 'Accounts', icon: '🏦', color: THEME.colors.success },
    { id: 'client-registration', name: 'Client Registration', icon: '👤', color: THEME.colors.success },
    { id: 'loan-approvals', name: 'Loan Approvals', icon: '✅', color: THEME.colors.success },
    { id: 'staff-ids', name: 'Staff IDs', icon: '🆔', color: THEME.colors.info },
    { id: 'branches', name: 'Branches', icon: '🏢', color: THEME.colors.info },
    { id: 'reports', name: 'Reports', icon: '📋', color: THEME.colors.warning },
    { id: 'alerts', name: 'Alerts', icon: '🚨', color: THEME.colors.danger },
    { id: 'charges', name: 'Charges', icon: '🏷️', color: THEME.colors.primary },
    { id: 'messaging', name: 'Messaging', icon: '💬', color: THEME.colors.info }
  ];

  // --- Render Functions for Tabs ---

  const renderContent = () => {
    const { metrics, branchActivity, workflowStatus, serviceCharges, systemAlerts } = dashboardData;

    switch (activeView) {
      case 'overview':
        return (
          <PlayfulCard color="#FFF">
            <OverviewTab
              loading={loading}
              metrics={metrics}
              branchActivity={branchActivity}
              workflowStatus={workflowStatus}
            />
          </PlayfulCard>
        );
      case 'accounts':
        return (
          <PlayfulCard color="#FFF">
            <AccountsTab />
          </PlayfulCard>
        );
      case 'client-registration':
        return (
          <PlayfulCard color="#FFF">
            <ClientRegistrationTab />
          </PlayfulCard>
        );
      case 'loan-approvals':
        return (
          <PlayfulCard color="#D1FAE5">
            <LoanApprovalsSection />
          </PlayfulCard>
        );
      case 'staff-ids':
        return (
          <PlayfulCard color="#FFF">
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>🆔 Staff IDs Management</h2>
              <p>Staff IDs panel for operations manager - implementation pending</p>
            </div>
          </PlayfulCard>
        );
      case 'branches':
        return <PlayfulCard color="#FFF">
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px' }}>Branch Activity Details</h2>
          {/* Detailed table or map view */}
        </PlayfulCard>;
      case 'reports':
        return (
          <PlayfulCard color="#FFF">
            <ReportsTab
              handleGenerateReport={handleGenerateReport}
              authService={authService}
              reportData={reportData}
              setReportData={setReportData}
            />
          </PlayfulCard>
        );
      case 'alerts':
        return <PlayfulCard color="#FFF">
          <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px' }}>System Alerts</h2>
          {systemAlerts && systemAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {systemAlerts.map((alert: any, index: number) => (
                <div key={alert.id || index} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: alert.type === 'warning' ? THEME.colors.warning :
                              alert.type === 'error' ? THEME.colors.danger :
                              alert.type === 'info' ? THEME.colors.secondary : THEME.colors.primary,
                  backgroundColor: alert.type === 'warning' ? '#FFF3CD' :
                                  alert.type === 'error' ? '#F8D7DA' :
                                  alert.type === 'info' ? '#D1ECF1' : '#D4EDDA'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>
                      {alert.type === 'warning' ? '⚠️' :
                       alert.type === 'error' ? '❌' :
                       alert.type === 'info' ? 'ℹ️' : '✅'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: alert.type === 'warning' ? '#856404' :
                               alert.type === 'error' ? '#721C24' :
                               alert.type === 'info' ? '#0C5460' : '#155724'
                      }}>
                        {alert.message}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#666' }}>
                        <span>🆔 {alert.id}</span>
                        <span>📊 {alert.type.toUpperCase()}</span>
                        <span>⚡ {alert.severity.toUpperCase()}</span>
                        <span>🕒 {new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              fontSize: '18px'
            }}>
              <span style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}>✅</span>
              No system alerts at this time.
            </div>
          )}
        </PlayfulCard>;
      case 'charges':
        return (
          <PlayfulCard color="#FFF">
            <ServiceChargesTab
              serviceCharges={serviceCharges}
              newCharge={newCharge}
              setNewCharge={setNewCharge}
              serviceChargeCalculation={serviceChargeCalculation}
              setServiceChargeCalculation={setServiceChargeCalculation}
              authService={authService}
              refetchCharges={async () => {
                  const chargesRes = await authService.getServiceCharges();
                  if (chargesRes.success) setDashboardData(d => ({ ...d, serviceCharges: chargesRes.data }));
              }}
            />
          </PlayfulCard>
        );
      case 'messaging':
        return <PlayfulCard color="#F0F8FF">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Secure Staff Messaging</h3>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>Top Secret chats with your team! 🕵️</p>
            <PlayfulButton onClick={() => {
              if (!hasMessagingAccess) {
                alert('Access denied. Messaging is only for authorized staff.');
                return;
              }
              alert('Opening secure messaging system...');
              navigate('/messaging');
            }} style={{}}>
              Open Chat Room 🚀
            </PlayfulButton>
          </div>
        </PlayfulCard>;
      default:
        return null;
    }
  };

  // --- Main Render ---

  return (
    <div style={{ display: 'flex', height: '100vh', background: THEME.colors.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
          /* Custom Scrollbar */
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: #fff; }
          ::-webkit-scrollbar-thumb { background: ${THEME.colors.primary}; border-radius: 5px; }
        `}
      </style>

      {/* --- SIDEBAR (STICKER SHEET) --- */}
      <nav style={{
        width: '280px',
        background: '#fff',
        borderRight: '3px solid #000',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '40px', background: THEME.colors.warning, width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #000' }}>⚙️</div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Operations Mode</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{(user as any)?.name}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ActiveView)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                border: activeView === item.id ? `3px solid ${item.color}` : '3px solid transparent',
                background: activeView === item.id ? `${item.color}20` : 'transparent',
                borderRadius: '16px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '800',
                color: activeView === item.id ? item.color : '#888',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <PlayfulButton variant="danger" onClick={handleLogout} style={{ width: '100%' }}>
            Log Out 👋
          </PlayfulButton>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>

        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.text, margin: 0 }}>
            {menuItems.find(i => i.id === activeView)?.icon} {menuItems.find(i => i.id === activeView)?.name}
          </h2>
          <div style={{ background: '#FFF', padding: '8px 16px', borderRadius: '20px', border: '2px solid #000', fontWeight: 'bold' }}>
            📅 {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Dynamic Content Wrapper */}
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default OperationsManagerDashboard;