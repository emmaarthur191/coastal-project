import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FraudAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [filterStatus]);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/fraud/alerts/', {
        params: filterStatus !== 'all' ? { status: filterStatus } : {}
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/fraud/alerts/dashboard_stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAssignToMe = async (alertId) => {
    try {
      await api.post(`/api/fraud/alerts/${alertId}/assign_to_me/`);
      fetchAlerts();
    } catch (error) {
      console.error('Error assigning alert:', error);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await api.post(`/api/fraud/alerts/${alertId}/resolve/`, {
        resolution_notes: resolutionNotes,
        action_taken: actionTaken
      });
      setSelectedAlert(null);
      setResolutionNotes('');
      setActionTaken('');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleEscalate = async (alertId, escalatedTo, reason) => {
    try {
      await api.post(`/api/fraud/alerts/${alertId}/escalate/`, {
        escalated_to: escalatedTo,
        escalation_reason: reason
      });
      fetchAlerts();
      fetchStats();
    } catch (error) {
      console.error('Error escalating alert:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = alerts.filter(alert =>
    filterStatus === 'all' || alert.status === filterStatus
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Fraud Detection Dashboard</h1>
        <p style={{ color: '#64748b' }}>Monitor and manage suspicious transaction alerts</p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#fee2e2',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              ⚠️
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.new_alerts || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>New Alerts</p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#fef3c7',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              🕐
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.investigating || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Investigating</p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#d1fae5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              ✅
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.resolved || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Resolved</p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#e9d5ff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              👁️
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.critical_alerts || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: '#f1f5f9',
        borderRadius: '12px',
        padding: '4px'
      }}>
        {[
          { value: 'all', label: `All (${stats.total_alerts || 0})` },
          { value: 'new', label: `New (${stats.new_alerts || 0})` },
          { value: 'investigating', label: `Investigating (${stats.investigating || 0})` },
          { value: 'resolved', label: `Resolved (${stats.resolved || 0})` },
          { value: 'escalated', label: `Escalated (${stats.escalated || 0})` }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: filterStatus === tab.value ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: filterStatus === tab.value ? '#1e293b' : '#64748b',
              fontWeight: filterStatus === tab.value ? '600' : '500',
              cursor: 'pointer',
              boxShadow: filterStatus === tab.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAlerts.map((alert) => (
          <div key={alert.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            transition: 'box-shadow 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    background: getPriorityColor(alert.priority).replace('bg-', '').replace('-500', '')
                  }}>
                    {alert.priority.toUpperCase()}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...(() => {
                      const colors = getStatusColor(alert.status).split(' ');
                      return {
                        background: colors[0].replace('bg-', ''),
                        color: colors[1].replace('text-', '').replace('-800', '')
                      };
                    })()
                  }}>
                    {alert.status}
                  </span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    Score: {alert.fraud_score}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>{alert.title}</h3>
                <p style={{ color: '#64748b', marginBottom: '8px' }}>{alert.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    👤 {alert.transaction_details?.member_name || 'Unknown'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    💰 ${alert.transaction_details?.amount || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📅 {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {alert.status === 'new' && (
                  <button
                    onClick={() => handleAssignToMe(alert.id)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Assign to Me
                  </button>
                )}

                {alert.status === 'investigating' && (
                  <>
                    <button
                      onClick={() => {
                        const action = prompt('Action Taken (approved/blocked/investigated/false_positive):', actionTaken);
                        if (action) {
                          setActionTaken(action);
                          const notes = prompt('Resolution Notes:', resolutionNotes);
                          if (notes !== null) {
                            setResolutionNotes(notes);
                            handleResolve(alert.id);
                          }
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#374151',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Resolve
                    </button>

                    <button
                      onClick={() => handleEscalate(alert.id, 'manager', 'Requires manager review')}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#374151',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Escalate
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Alert Details */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                fontSize: '14px'
              }}>
                <div><strong>Transaction ID:</strong> {alert.transaction_details?.id || 'N/A'}</div>
                <div><strong>Account:</strong> {alert.account_details?.account_number || 'N/A'}</div>
                <div><strong>Type:</strong> {alert.transaction_details?.type || 'N/A'}</div>
                <div><strong>Amount:</strong> ${alert.transaction_details?.amount || 0}</div>
              </div>
              {alert.rule_details && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Triggered Rules:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {alert.rule_details.map((rule, index) => (
                      <span key={index} style={{
                        padding: '2px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: '#f9fafb'
                      }}>
                        {rule.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>No alerts found</h3>
            <p style={{ color: '#64748b' }}>
              {filterStatus === 'all'
                ? 'There are currently no fraud alerts to review.'
                : `No ${filterStatus} alerts found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudAlerts;