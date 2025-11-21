import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const FraudCases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [evidenceType, setEvidenceType] = useState('');
  const [evidenceData, setEvidenceData] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [filterStatus]);

  const fetchCases = async () => {
    try {
      const response = await api.get('/api/fraud/cases/', {
        params: filterStatus !== 'all' ? { status: filterStatus } : {}
      });
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/fraud/cases/case_stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAssignInvestigator = async (caseId, investigatorId) => {
    try {
      await api.post(`/api/fraud/cases/${caseId}/assign_investigator/`, {
        investigator_id: investigatorId
      });
      fetchCases();
    } catch (error) {
      console.error('Error assigning investigator:', error);
    }
  };

  const handleCloseCase = async (caseId) => {
    try {
      await api.post(`/api/fraud/cases/${caseId}/close_case/`, {
        resolution_type: resolutionType,
        resolution_details: resolutionDetails
      });
      setSelectedCase(null);
      setResolutionType('');
      setResolutionDetails('');
      fetchCases();
      fetchStats();
    } catch (error) {
      console.error('Error closing case:', error);
    }
  };

  const handleAddEvidence = async (caseId) => {
    try {
      await api.post(`/api/fraud/cases/${caseId}/add_evidence/`, {
        evidence_type: evidenceType,
        evidence_data: evidenceData
      });
      setEvidenceType('');
      setEvidenceData('');
      fetchCases();
    } catch (error) {
      console.error('Error adding evidence:', error);
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
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCases = cases.filter(caseItem =>
    filterStatus === 'all' || caseItem.status === filterStatus
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Fraud Case Management</h1>
        <p style={{ color: '#64748b' }}>Manage and track fraud investigation cases</p>
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
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.open_cases || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Open Cases</p>
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
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.closed_cases || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Closed Cases</p>
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
              background: '#dbeafe',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              📄
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{stats.total_cases || 0}</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Total Cases</p>
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
          { value: 'all', label: `All (${stats.total_cases || 0})` },
          { value: 'open', label: `Open (${stats.open_cases || 0})` },
          { value: 'investigating', label: `Investigating (${stats.investigating || 0})` },
          { value: 'closed', label: `Closed (${stats.closed_cases || 0})` },
          { value: 'escalated', label: `Escalated (${stats.escalated_cases || 0})` }
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

      {/* Cases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredCases.map((caseItem) => (
          <div key={caseItem.id} style={{
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
                    background: getPriorityColor(caseItem.priority).replace('bg-', '').replace('-500', '')
                  }}>
                    {caseItem.priority.toUpperCase()}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...(() => {
                      const colors = getStatusColor(caseItem.status).split(' ');
                      return {
                        background: colors[0].replace('bg-', ''),
                        color: colors[1].replace('text-', '').replace('-800', '')
                      };
                    })()
                  }}>
                    {caseItem.status}
                  </span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    Case #{caseItem.case_number}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>{caseItem.title}</h3>
                <p style={{ color: '#64748b', marginBottom: '8px' }}>{caseItem.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    👤 {caseItem.primary_account_details?.owner_name || 'Unknown'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    💰 ${caseItem.estimated_loss || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📅 {new Date(caseItem.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {caseItem.status === 'open' && (
                  <button
                    onClick={() => handleAssignInvestigator(caseItem.id, user.id)}
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

                {caseItem.status === 'investigating' && (
                  <>
                    <button
                      onClick={() => {
                        const type = prompt('Evidence Type (document/screenshot/log/statement/other):', evidenceType);
                        if (type) {
                          setEvidenceType(type);
                          const data = prompt('Evidence Data:', evidenceData);
                          if (data !== null) {
                            setEvidenceData(data);
                            handleAddEvidence(caseItem.id);
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
                      Add Evidence
                    </button>

                    <button
                      onClick={() => {
                        const type = prompt('Resolution Type (confirmed_fraud/false_positive/insufficient_evidence/resolved):', resolutionType);
                        if (type) {
                          setResolutionType(type);
                          const details = prompt('Resolution Details:', resolutionDetails);
                          if (details !== null) {
                            setResolutionDetails(details);
                            handleCloseCase(caseItem.id);
                          }
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: '#1e40af',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Close Case
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Case Details */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                <div>
                  <strong>Primary Transaction:</strong>
                  <p>{caseItem.primary_transaction_details?.id || 'N/A'}</p>
                  <p>${caseItem.primary_transaction_details?.amount || 0}</p>
                </div>
                <div>
                  <strong>Account:</strong>
                  <p>{caseItem.primary_account_details?.account_number || 'N/A'}</p>
                  <p>{caseItem.primary_account_details?.owner_name || 'N/A'}</p>
                </div>
                <div>
                  <strong>Investigator:</strong>
                  <p>{caseItem.assigned_investigator_name || 'Unassigned'}</p>
                </div>
              </div>

              {caseItem.investigation_notes && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Investigation Notes:</strong>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{caseItem.investigation_notes}</p>
                </div>
              )}

              {caseItem.evidence && caseItem.evidence.length > 0 && (
                <div>
                  <strong>Evidence ({caseItem.evidence.length}):</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {caseItem.evidence.map((evidence, index) => (
                      <span key={index} style={{
                        padding: '2px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: '#f9fafb'
                      }}>
                        {evidence.type}: {evidence.description}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredCases.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>No cases found</h3>
            <p style={{ color: '#64748b' }}>
              {filterStatus === 'all'
                ? 'There are currently no fraud cases to review.'
                : `No ${filterStatus} cases found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudCases;