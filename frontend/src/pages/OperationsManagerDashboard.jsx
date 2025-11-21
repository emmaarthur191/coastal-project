import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

function OperationsManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [branchActivity, setBranchActivity] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState({});
  const [reportData, setReportData] = useState(null);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({
    name: '',
    description: '',
    charge_type: 'percentage',
    rate: '',
    applicable_to: []
  });
  const [serviceChargeCalculation, setServiceChargeCalculation] = useState(null);
  const [interestCalculation, setInterestCalculation] = useState(null);
  const [commissionCalculation, setCommissionCalculation] = useState(null);

  // Fetch data on component mount
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

        console.log('API Responses:', { metricsRes, branchRes, alertsRes, workflowRes, chargesRes });

        if (metricsRes.success) {
          setMetrics(metricsRes.data || {});
        } else {
          console.error('Failed to fetch metrics:', metricsRes.error);
          setMetrics({});
        }

        if (branchRes.success) {
          setBranchActivity(Array.isArray(branchRes.data) ? branchRes.data : []);
        } else {
          console.error('Failed to fetch branch activity:', branchRes.error);
          setBranchActivity([]);
        }

        if (alertsRes.success) {
          setSystemAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
        } else {
          console.error('Failed to fetch system alerts:', alertsRes.error);
          setSystemAlerts([]);
        }

        if (workflowRes.success) {
          setWorkflowStatus(workflowRes.data || {});
        } else {
          console.error('Failed to fetch workflow status:', workflowRes.error);
          setWorkflowStatus({});
        }

        if (chargesRes.success) {
          setServiceCharges(Array.isArray(chargesRes.data) ? chargesRes.data : []);
        } else {
          console.error('Failed to fetch service charges:', chargesRes.error);
          setServiceCharges([]);
        }
      } catch (error) {
        console.error('Error fetching operations data:', error);
        // Set default values on error
        setMetrics({});
        setBranchActivity([]);
        setSystemAlerts([]);
        setWorkflowStatus({});
        setServiceCharges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGenerateReport = async (reportType) => {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const reportData = {
      type: reportType,
      date_from: lastWeek,
      date_to: today
    };

    const result = await authService.generateReport(reportData);
    if (result.success) {
      setReportData(result.data);
    } else {
      alert('Failed to generate report: ' + result.error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--md-sys-color-background)',
      padding: '16px'
    }}>
      {/* App Bar */}
      <header className="md-elevated-card md-animate-slide-in-down" style={{
        marginBottom: '24px',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 className="md-typescale-headline-medium" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '4px'
            }}>
              Operations Management
            </h1>
            <p className="md-typescale-body-medium" style={{
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              Welcome, {user?.name}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="md-chip" style={{
              background: 'var(--md-sys-color-tertiary-container)',
              color: 'var(--md-sys-color-on-tertiary-container)',
              border: 'none'
            }}>
               OPERATIONS MANAGER
            </div>
            <button
              onClick={handleLogout}
              className="md-filled-button md-ripple"
              style={{
                background: 'var(--md-sys-color-error)',
                color: 'var(--md-sys-color-on-error)'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '4px',
          background: 'var(--md-sys-color-surface-container-highest)',
          borderRadius: 'var(--md-sys-shape-corner-large)',
          position: 'relative',
          zIndex: 1
        }}>
          {[
            { id: 'overview', name: 'Overview', icon: '' },
            { id: 'branches', name: 'Branch Activity', icon: '' },
            { id: 'reports', name: 'Reports', icon: '' },
            { id: 'alerts', name: 'System Alerts', icon: '' },
            { id: 'charges', name: 'Service Charges', icon: '' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className="md-ripple"
              style={{
                padding: '10px 16px',
                background: activeView === view.id ? 'var(--md-sys-color-surface)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                color: activeView === view.id ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: activeView === view.id ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)',
                boxShadow: activeView === view.id ? 'var(--md-sys-elevation-1)' : 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>{view.icon}</span>
              <span className="md-typescale-label-large">{view.name}</span>
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <>
            {/* Operational Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {loading ? (
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="md-filled-card" style={{
                    padding: '20px',
                    height: '120px'
                  }}>
                    <div style={{ background: 'var(--md-sys-color-outline-variant)', height: '44px', width: '44px', borderRadius: 'var(--md-sys-shape-corner-medium)', marginBottom: '12px' }} className="animate-pulse"></div>
                    <div style={{ background: 'var(--md-sys-color-outline-variant)', height: '20px', width: '60%', marginBottom: '8px' }} className="animate-pulse"></div>
                    <div style={{ background: 'var(--md-sys-color-outline-variant)', height: '14px', width: '40%' }} className="animate-pulse"></div>
                  </div>
                ))
              ) : (
                [
                  {
                    label: 'System Uptime',
                    value: (metrics && metrics.system_uptime) || '99.9%',
                    icon: '',
                    color: '#10b981',
                    change: '+0.1%'
                  },
                  {
                    label: 'Transactions Today',
                    value: (metrics && metrics.transactions_today !== undefined) ? metrics.transactions_today.toLocaleString() : '0',
                    icon: '',
                    color: '#3b82f6',
                    change: `+${(metrics && metrics.transaction_change !== undefined) ? metrics.transaction_change : 0}%`
                  },
                  {
                    label: 'API Response Time',
                    value: `${(metrics && metrics.api_response_time !== undefined) ? metrics.api_response_time : 120}ms`,
                    icon: '',
                    color: '#f59e0b',
                    change: '-5ms'
                  },
                  {
                    label: 'Failed Transactions',
                    value: (metrics && metrics.failed_transactions !== undefined) ? metrics.failed_transactions.toString() : '0',
                    icon: '',
                    color: '#ef4444',
                    change: `+${(metrics && metrics.failed_change !== undefined) ? metrics.failed_change : 0}`
                  }
                ].map((metric, index) => (
                  <div key={index} className="md-filled-card md-state-layer md-animate-scale-in" style={{
                    padding: '20px',
                    cursor: 'pointer',
                    animationDelay: `${index * 100}ms`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        background: metric.color,
                        borderRadius: 'var(--md-sys-shape-corner-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        color: 'white'
                      }}>
                        {metric.icon}
                      </div>
                      <div className="md-chip" style={{
                        background: metric.change.startsWith('+') 
                          ? 'var(--md-sys-color-secondary-container)' 
                          : metric.change.startsWith('-') 
                          ? 'var(--md-sys-color-tertiary-container)' 
                          : 'var(--md-sys-color-error-container)',
                        color: metric.change.startsWith('+') 
                          ? 'var(--md-sys-color-on-secondary-container)' 
                          : metric.change.startsWith('-') 
                          ? 'var(--md-sys-color-on-tertiary-container)' 
                          : 'var(--md-sys-color-on-error-container)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px'
                      }}>
                        {metric.change}
                      </div>
                    </div>
                    <div className="md-typescale-title-large" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '4px'
                    }}>
                      {metric.value}
                    </div>
                    <div className="md-typescale-body-small" style={{
                      color: 'var(--md-sys-color-on-surface-variant)'
                    }}>
                      {metric.label}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px'
            }}>
              {/* Branch Activity */}
              <div className="md-elevated-card md-animate-slide-in-up">
                <h3 className="md-typescale-title-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                   Branch Activity Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loading ? (
                    Array(4).fill(0).map((_, index) => (
                      <div key={index} className="md-filled-card" style={{
                        padding: '20px',
                        height: '80px'
                      }}></div>
                    ))
                  ) : (
                    (branchActivity || []).map((branch, index) => (
                      <div key={index} className="md-list-item" style={{
                        padding: '16px',
                        background: 'var(--md-sys-color-surface-container-low)',
                        borderRadius: 'var(--md-sys-shape-corner-medium)'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          background: 'var(--md-sys-color-primary)',
                          borderRadius: 'var(--md-sys-shape-corner-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {branch.name ? branch.name.split(' ').map(w => w[0]).join('') : 'BR'}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div className="md-typescale-title-small" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            marginBottom: '4px'
                          }}>
                            {branch.name || 'Unknown Branch'}
                          </div>
                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)'
                          }}>
                            {branch.metrics?.total_transactions?.toLocaleString() || 0} transactions
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', marginRight: '20px' }}>
                          <div className="md-typescale-title-small" style={{
                            color: 'var(--md-sys-color-secondary)',
                            fontWeight: '700'
                          }}>
                            {branch.metrics?.success_rate || '0%'}
                          </div>
                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)'
                          }}>
                            Success Rate
                          </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div className="md-typescale-title-small" style={{
                            color: 'var(--md-sys-color-on-surface)',
                            fontWeight: '700'
                          }}>
                            {branch.metrics?.staff_count || 0}
                          </div>
                          <div className="md-typescale-body-small" style={{
                            color: 'var(--md-sys-color-on-surface-variant)'
                          }}>
                            Staff
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Workflow Status */}
              <div className="md-elevated-card md-animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                <h3 className="md-typescale-title-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  marginBottom: '20px'
                }}>
                   Workflow Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loading ? (
                    Array(4).fill(0).map((_, index) => (
                      <div key={index} className="md-filled-card" style={{
                        padding: '20px',
                        height: '100px'
                      }}></div>
                    ))
                  ) : (
                    [
                      {
                        label: 'Loan Disbursements',
                        completed: workflowStatus?.loan_disbursements?.completed || 0,
                        pending: workflowStatus?.loan_disbursements?.pending || 0,
                        icon: ''
                      },
                      {
                        label: 'Account Onboarding',
                        completed: workflowStatus?.account_onboarding?.completed || 0,
                        pending: workflowStatus?.account_onboarding?.pending || 0,
                        icon: ''
                      },
                      {
                        label: 'KYC Verification',
                        completed: workflowStatus?.kyc_verification?.completed || 0,
                        pending: workflowStatus?.kyc_verification?.pending || 0,
                        icon: ''
                      },
                      {
                        label: 'Service Charges',
                        completed: workflowStatus?.service_charges?.completed || 0,
                        pending: workflowStatus?.service_charges?.pending || 0,
                        icon: ''
                      }
                    ].map((workflow, index) => (
                      <div key={index} className="md-filled-card" style={{
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{workflow.icon}</div>
                        <div className="md-typescale-title-small" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          marginBottom: '8px'
                        }}>
                          {workflow.label}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                          <div>
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-secondary)', fontWeight: '700' }}>{workflow.completed}</div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Done</div>
                          </div>
                          <div>
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-tertiary)', fontWeight: '700' }}>{workflow.pending}</div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Pending</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Service Charges Tab */}
        {activeView === 'charges' && (
          <div className="md-elevated-card md-animate-slide-in-up">
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
               Service Charge Management
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Create Service Charge */}
              <div className="md-filled-card">
                <h4 className="md-typescale-title-medium" style={{ marginBottom: '16px', color: 'var(--md-sys-color-on-surface)' }}>Create New Service Charge</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Charge Name"
                    value={newCharge.name}
                    onChange={(e) => setNewCharge({...newCharge, name: e.target.value})}
                    className="md-outlined-text-field"
                  />

                  <textarea
                    placeholder="Description"
                    value={newCharge.description}
                    onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
                    className="md-outlined-text-field"
                    style={{ minHeight: '60px' }}
                  />

                  <select
                    value={newCharge.charge_type}
                    onChange={(e) => setNewCharge({...newCharge, charge_type: e.target.value})}
                    className="md-outlined-text-field"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>

                  <input
                    type="number"
                    placeholder={newCharge.charge_type === 'percentage' ? 'Rate (%)' : 'Fixed Amount (GHS)'}
                    value={newCharge.rate}
                    onChange={(e) => setNewCharge({...newCharge, rate: e.target.value})}
                    className="md-outlined-text-field"
                  />

                  <div>
                    <label className="md-typescale-label-large" style={{ color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: '8px' }}>
                      Applicable to:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['deposit', 'withdrawal', 'transfer'].map(type => (
                        <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="checkbox"
                            checked={newCharge.applicable_to.includes(type)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...newCharge.applicable_to, type]
                                : newCharge.applicable_to.filter(t => t !== type);
                              setNewCharge({...newCharge, applicable_to: updated});
                            }}
                          />
                          <span className="md-typescale-body-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const result = await authService.createServiceCharge(newCharge);
                      if (result.success) {
                        alert('Service charge created successfully!');
                        setNewCharge({
                          name: '',
                          description: '',
                          charge_type: 'percentage',
                          rate: '',
                          applicable_to: []
                        });
                        const chargesRes = await authService.getServiceCharges();
                        if (chargesRes.success) setServiceCharges(chargesRes.data);
                      } else {
                        alert('Failed to create service charge: ' + result.error);
                      }
                    }}
                    className="md-filled-button md-ripple"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Create Service Charge
                  </button>
                </div>
              </div>

              {/* Service Charge Calculator */}
              <div className="md-filled-card">
                <h4 className="md-typescale-title-medium" style={{ marginBottom: '16px', color: 'var(--md-sys-color-on-surface)' }}>Service Charge Calculator</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select
                    onChange={(e) => setServiceChargeCalculation({...serviceChargeCalculation, transaction_type: e.target.value})}
                    className="md-outlined-text-field"
                  >
                    <option value="">Select Transaction Type</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer">Transfer</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Transaction Amount (GHS)"
                    onChange={(e) => setServiceChargeCalculation({...serviceChargeCalculation, amount: parseFloat(e.target.value)})}
                    className="md-outlined-text-field"
                  />

                  <button
                    onClick={async () => {
                      if (!serviceChargeCalculation?.transaction_type || !serviceChargeCalculation?.amount) {
                        alert('Please select transaction type and enter amount');
                        return;
                      }

                      const result = await authService.calculateServiceCharge({
                        transaction_type: serviceChargeCalculation.transaction_type,
                        amount: serviceChargeCalculation.amount
                      });

                      if (result.success) {
                        setServiceChargeCalculation(result.data);
                      } else {
                        alert('Failed to calculate service charge: ' + result.error);
                      }
                    }}
                    className="md-filled-button md-ripple"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      background: 'var(--md-sys-color-secondary)',
                      color: 'var(--md-sys-color-on-secondary)'
                    }}
                  >
                    Calculate Charge
                  </button>

                  {serviceChargeCalculation && serviceChargeCalculation.charge_breakdown && (
                    <div className="md-outlined-card" style={{ marginTop: '16px' }}>
                      <h5 className="md-typescale-title-small" style={{ marginBottom: '12px', color: 'var(--md-sys-color-on-surface)' }}>Calculation Result</h5>
                      <div className="md-typescale-body-small" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>Transaction Amount: {formatCurrencyGHS(serviceChargeCalculation.transaction_amount)}</div>
                        <div>Total Service Charge: {formatCurrencyGHS(serviceChargeCalculation.total_service_charge)}</div>
                        <div>Net Amount: {formatCurrencyGHS(serviceChargeCalculation.net_amount)}</div>

                        {serviceChargeCalculation.charge_breakdown.map((charge, index) => (
                          <div key={index} className="md-filled-card" style={{ padding: '8px' }}>
                            {charge.name}: {formatCurrencyGHS(charge.amount)} ({charge.type}: {charge.rate}{charge.type === 'percentage' ? '%' : ' GHS'})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Service Charges */}
            <div style={{ marginTop: '24px' }}>
              <h4 className="md-typescale-title-medium" style={{ marginBottom: '16px', color: 'var(--md-sys-color-on-surface)' }}>Active Service Charges</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {serviceCharges.map((charge, index) => (
                  <div key={index} className="md-outlined-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h5 className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>{charge.name}</h5>
                      <span className="md-chip" style={{
                        background: charge.charge_type === 'percentage' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-tertiary-container)',
                        color: charge.charge_type === 'percentage' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-tertiary-container)',
                        border: 'none',
                        padding: '4px 8px',
                        fontSize: '11px'
                      }}>
                        {charge.charge_type}
                      </span>
                    </div>
                    <p className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '8px' }}>{charge.description}</p>
                    <div className="md-typescale-title-medium" style={{ color: 'var(--md-sys-color-on-surface)', fontWeight: '600' }}>
                      {charge.rate}{charge.charge_type === 'percentage' ? '%' : ' GHS'}
                    </div>
                    <div className="md-typescale-body-small" style={{ marginTop: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Applies to: {charge.applicable_to.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeView === 'reports' && (
          <div className="md-elevated-card md-animate-slide-in-up">
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
               Report Generation
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {[
                {
                  type: 'daily_transaction',
                  title: 'Daily Transaction Report',
                  description: 'Comprehensive daily transaction summary',
                  icon: ''
                },
                {
                  type: 'system_performance',
                  title: 'System Performance Report',
                  description: 'System uptime and performance metrics',
                  icon: ''
                },
                {
                  type: 'staff_activity',
                  title: 'Staff Activity Report',
                  description: 'Staff productivity and activity logs',
                  icon: ''
                },
                {
                  type: 'security_audit',
                  title: 'Security Audit Report',
                  description: 'Security incidents and compliance status',
                  icon: ''
                }
              ].map((report, index) => (
                <div key={index} className="md-outlined-card md-state-layer" style={{
                  cursor: 'pointer'
                }}
                onClick={() => handleGenerateReport(report.type)}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{report.icon}</div>
                  <h4 className="md-typescale-title-small" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '8px'
                  }}>
                    {report.title}
                  </h4>
                  <p className="md-typescale-body-small" style={{
                    color: 'var(--md-sys-color-on-surface-variant)'
                  }}>
                    {report.description}
                  </p>
                </div>
              ))}
            </div>

            {reportData && (
              <div className="md-elevated-card md-animate-scale-in" style={{
                marginTop: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h4 className="md-typescale-title-large" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                      {reportData.report_type}
                    </h4>
                    <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                      Period: {reportData.period}
                    </p>
                  </div>
                  <button
                    onClick={() => setReportData(null)}
                    className="md-text-button md-ripple"
                    style={{ color: 'var(--md-sys-color-error)' }}
                  >
                    Close Report
                  </button>
                </div>

                {/* Daily Transaction Report */}
                {reportData.report_type === 'Daily Transaction Report' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                        {reportData.total_transactions?.toLocaleString() || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Total Transactions
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                        {formatCurrencyGHS(reportData.total_volume || 0)}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Total Volume
                      </div>
                    </div>
                    {reportData.by_type && Object.entries(reportData.by_type).map(([type, data]) => (
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
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '4px' }}>
                        {reportData.uptime}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        System Uptime
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                        {reportData.avg_response_time}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Avg Response Time
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                        {reportData.total_requests?.toLocaleString() || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Total Requests
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
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
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                        {reportData.total_staff || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Total Staff
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-secondary)', marginBottom: '4px' }}>
                        {reportData.active_staff || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Active Staff
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
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
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-error)', marginBottom: '4px' }}>
                        {reportData.failed_login_attempts || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Failed Login Attempts
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-tertiary)', marginBottom: '4px' }}>
                        {reportData.suspicious_activities || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Suspicious Activities
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}></div>
                      <div className="md-typescale-headline-small" style={{ color: 'var(--md-sys-color-on-surface)', marginBottom: '4px' }}>
                        {reportData.security_incidents || 0}
                      </div>
                      <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Security Incidents
                      </div>
                    </div>
                    <div className="md-filled-card" style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                        {reportData.compliance_status === 'Compliant' ? '' : ''}
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
              </div>
            )}
          </div>
        )}

        {/* Branches Tab */}
        {activeView === 'branches' && (
          <div className="md-elevated-card md-animate-slide-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 className="md-typescale-title-large" style={{
                  color: 'var(--md-sys-color-on-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                   Detailed Branch Performance
                </h3>
                <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Comprehensive branch performance metrics and analytics
                </p>
              </div>
              <div className="md-chip" style={{
                background: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                border: 'none'
              }}>
                {branchActivity.length} Branches
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}></div>
                <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Loading branch analytics...
                </p>
              </div>
            ) : (
              <>
                {/* Branch Performance Overview Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {branchActivity.map((branch, index) => (
                    <div key={branch.id} className="md-filled-card md-state-layer" style={{
                      padding: '20px',
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      transition: 'all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: `linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))`,
                          borderRadius: 'var(--md-sys-shape-corner-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {branch.code}
                        </div>
                        <div className="md-chip" style={{
                          background: branch.performance_score >= 80 ? 'var(--md-sys-color-secondary-container)' :
                                   branch.performance_score >= 70 ? 'var(--md-sys-color-tertiary-container)' :
                                   'var(--md-sys-color-error-container)',
                          color: branch.performance_score >= 80 ? 'var(--md-sys-color-on-secondary-container)' :
                                 branch.performance_score >= 70 ? 'var(--md-sys-color-on-tertiary-container)' :
                                 'var(--md-sys-color-on-error-container)',
                          border: 'none',
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Score: {branch.performance_score}
                        </div>
                      </div>

                      <h4 className="md-typescale-title-medium" style={{
                        color: 'var(--md-sys-color-on-surface)',
                        marginBottom: '4px'
                      }}>
                        {branch.name}
                      </h4>

                      <p className="md-typescale-body-small" style={{
                        color: 'var(--md-sys-color-on-surface-variant)',
                        marginBottom: '12px'
                      }}>
                        {branch.location}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-secondary)', fontWeight: '700' }}>
                            {branch.metrics.total_transactions.toLocaleString()}
                          </div>
                          <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Transactions
                          </div>
                        </div>
                        <div>
                          <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-secondary)', fontWeight: '700' }}>
                            {formatCurrencyGHS(branch.metrics.total_volume)}
                          </div>
                          <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            Volume
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detailed Branch Analytics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '24px'
                }}>
                  {/* Branch Details */}
                  <div className="md-filled-card">
                    <h4 className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                       Performance Details
                    </h4>

                    {branchActivity.map((branch, index) => (
                      <div key={branch.id} className="md-outlined-card" style={{
                        padding: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <h5 className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {branch.name} ({branch.code})
                            </h5>
                            <p className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              Manager: {branch.manager}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-secondary)', fontWeight: '700' }}>
                              {branch.metrics.success_rate}
                            </div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              Success Rate
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                          <div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              Avg Transaction
                            </div>
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {formatCurrencyGHS(branch.metrics.avg_transaction_value)}
                            </div>
                          </div>
                          <div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              Unique Accounts
                            </div>
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {branch.metrics.unique_accounts}
                            </div>
                          </div>
                          <div>
                            <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              Staff Count
                            </div>
                            <div className="md-typescale-title-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                              {branch.metrics.staff_count}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transaction Breakdown */}
                  <div className="md-filled-card">
                    <h4 className="md-typescale-title-medium" style={{
                      color: 'var(--md-sys-color-on-surface)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                       Transaction Types
                    </h4>

                    {branchActivity.map((branch, index) => (
                      <div key={branch.id} className="md-outlined-card" style={{
                        padding: '16px',
                        marginBottom: '12px'
                      }}>
                        <h5 className="md-typescale-title-small" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          marginBottom: '12px'
                        }}>
                          {branch.name}
                        </h5>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(branch.transaction_breakdown).map(([type, data]) => (
                            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="md-typescale-body-small" style={{
                                color: 'var(--md-sys-color-on-surface-variant)',
                                textTransform: 'capitalize'
                              }}>
                                {type}
                              </span>
                              <div style={{ textAlign: 'right' }}>
                                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                                  {data.count} txns
                                </div>
                                <div className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                  {formatCurrencyGHS(data.volume)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Trend Chart Placeholder */}
                <div className="md-filled-card" style={{ marginTop: '24px' }}>
                  <h4 className="md-typescale-title-medium" style={{
                    color: 'var(--md-sys-color-on-surface)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                     7-Day Transaction Trend
                  </h4>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
                  }}>
                    {branchActivity.map((branch, index) => (
                      <div key={branch.id} className="md-outlined-card" style={{ padding: '16px' }}>
                        <h5 className="md-typescale-title-small" style={{
                          color: 'var(--md-sys-color-on-surface)',
                          marginBottom: '12px'
                        }}>
                          {branch.name}
                        </h5>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {branch.daily_trend.map((day, dayIndex) => (
                            <div key={dayIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '60px',
                                  height: '8px',
                                  background: 'var(--md-sys-color-surface-container-highest)',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${Math.min((day.count / Math.max(...branch.daily_trend.map(d => d.count))) * 100, 100)}%`,
                                    height: '100%',
                                    background: 'var(--md-sys-color-primary)',
                                    borderRadius: '4px'
                                  }}></div>
                                </div>
                                <span className="md-typescale-body-small" style={{ color: 'var(--md-sys-color-on-surface)', minWidth: '40px' }}>
                                  {day.count}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeView === 'alerts' && (
          <div className="md-elevated-card md-animate-slide-in-up">
            <h3 className="md-typescale-title-large" style={{
              color: 'var(--md-sys-color-on-surface)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
               System Alerts Management
            </h3>
            <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '20px' }}>
              Monitor and manage system alerts and notifications.
            </p>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}></div>
              <p className="md-typescale-body-medium" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                Advanced alert management interface coming soon...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for alert colors
function getAlertColor(type) {
  const colors = {
    warning: { background: '#fef3c7', border: '#f59e0b', color: '#92400e' },
    error: { background: '#fee2e2', border: '#ef4444', color: '#dc2626' },
    info: { background: '#e0f2fe', border: '#0ea5e9', color: '#0369a1' },
    success: { background: '#d1fae5', border: '#10b981', color: '#065f46' }
  };
  return colors[type] || colors.info;
}

export default OperationsManagerDashboard;