import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './FraudCases.css';

interface CaseStats {
  open_cases?: number;
  investigating?: number;
  closed_cases?: number;
  total_cases?: number;
  escalated_cases?: number;
  [key: string]: number | undefined;
}

interface PaginatedCasesResponse {
  results: CaseData[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

interface CaseData {
  id: number;
  status: string;
  priority: string;
  case_number: string;
  title: string;
  description: string;
  created_at: string;
  primary_account_details?: { owner_name?: string; account_number?: string };
  primary_transaction_details?: { id?: string; amount?: number };
  estimated_loss?: number;
  assigned_investigator_name?: string;
  investigation_notes?: string;
  evidence?: Array<{ type: string; description: string }>;
}

const FraudCases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [stats, setStats] = useState<CaseStats>({});
  const [loading, setLoading] = useState(true);
  const [_selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [evidenceType, setEvidenceType] = useState('');
  const [evidenceData, setEvidenceData] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchCases = useCallback(async () => {
    try {
      const response = await api.get<PaginatedCasesResponse | CaseData[]>('/fraud/cases/', {
        params: filterStatus !== 'all' ? { status: filterStatus } : {}
      });
      // Handle both paginated results and raw arrays
      const data = response.data;
      if (data && typeof data === 'object' && 'results' in data) {
        setCases(data.results);
      } else if (Array.isArray(data)) {
        setCases(data);
      } else {
        setCases([]);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<CaseStats>('/fraud/cases/case_stats/');
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [fetchCases, fetchStats]);

  const handleAssignInvestigator = async (caseId: string | number, investigatorId: string | number) => {
    try {
      await api.post(`/fraud/cases/${caseId}/assign_investigator/`, {
        investigator_id: investigatorId
      });
      fetchCases();
    } catch (error) {
      console.error('Error assigning investigator:', error);
    }
  };

  const handleCloseCase = async (caseId: string | number) => {
    try {
      await api.post(`/fraud/cases/${caseId}/close_case/`, {
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

  const handleAddEvidence = async (caseId: string | number) => {
    try {
      await api.post(`/fraud/cases/${caseId}/add_evidence/`, {
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

  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'fraud-cases-priority-badge--critical';
      case 'high': return 'fraud-cases-priority-badge--high';
      case 'medium': return 'fraud-cases-priority-badge--medium';
      case 'low': return 'fraud-cases-priority-badge--low';
      default: return 'fraud-cases-priority-badge--default';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'fraud-cases-status-badge--open';
      case 'investigating': return 'fraud-cases-status-badge--investigating';
      case 'closed': return 'fraud-cases-status-badge--closed';
      case 'escalated': return 'fraud-cases-status-badge--escalated';
      default: return 'fraud-cases-status-badge--default';
    }
  };

  const filteredCases = cases.filter(caseItem =>
    filterStatus === 'all' || caseItem.status === filterStatus
  );

  if (loading) {
    return <div className="fraud-cases-loading">Loading...</div>;
  }

  return (
    <div className="fraud-cases-container">
      <div className="fraud-cases-header">
        <h1 className="fraud-cases-title">Fraud Case Management</h1>
        <p className="fraud-cases-subtitle">Manage and track fraud investigation cases</p>
      </div>

      {/* Statistics Cards */}
      <div className="fraud-cases-stats-grid">
        <div className="fraud-cases-stat-card">
          <div className="fraud-cases-stat-content">
            <div className="fraud-cases-stat-icon fraud-cases-stat-icon--open">
              ⚠️
            </div>
            <div>
              <p className="fraud-cases-stat-value">{stats.open_cases || 0}</p>
              <p className="fraud-cases-stat-label">Open Cases</p>
            </div>
          </div>
        </div>

        <div className="fraud-cases-stat-card">
          <div className="fraud-cases-stat-content">
            <div className="fraud-cases-stat-icon fraud-cases-stat-icon--investigating">
              🕐
            </div>
            <div>
              <p className="fraud-cases-stat-value">{stats.investigating || 0}</p>
              <p className="fraud-cases-stat-label">Investigating</p>
            </div>
          </div>
        </div>

        <div className="fraud-cases-stat-card">
          <div className="fraud-cases-stat-content">
            <div className="fraud-cases-stat-icon fraud-cases-stat-icon--closed">
              ✅
            </div>
            <div>
              <p className="fraud-cases-stat-value">{stats.closed_cases || 0}</p>
              <p className="fraud-cases-stat-label">Closed Cases</p>
            </div>
          </div>
        </div>

        <div className="fraud-cases-stat-card">
          <div className="fraud-cases-stat-content">
            <div className="fraud-cases-stat-icon fraud-cases-stat-icon--total">
              📄
            </div>
            <div>
              <p className="fraud-cases-stat-value">{stats.total_cases || 0}</p>
              <p className="fraud-cases-stat-label">Total Cases</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="fraud-cases-filter-tabs">
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
            className={`fraud-cases-filter-tab ${filterStatus === tab.value ? 'fraud-cases-filter-tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cases List */}
      <div className="fraud-cases-list">
        {filteredCases.map((caseItem) => (
          <div key={caseItem.id} className="fraud-cases-case-card">
            <div className="fraud-cases-case-header">
              <div className="fraud-cases-case-info">
                <div className="fraud-cases-case-badges">
                  <span className={`fraud-cases-priority-badge ${getPriorityClass(caseItem.priority)}`}>
                    {caseItem.priority?.toUpperCase()}
                  </span>
                  <span className={`fraud-cases-status-badge ${getStatusClass(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                  <span className="fraud-cases-case-number">
                    Case #{caseItem.case_number}
                  </span>
                </div>
                <h3 className="fraud-cases-case-title">{caseItem.title}</h3>
                <p className="fraud-cases-case-description">{caseItem.description}</p>
                <div className="fraud-cases-case-meta">
                  <span className="fraud-cases-case-meta-item">
                    👤 {caseItem.primary_account_details?.owner_name || 'Unknown'}
                  </span>
                  <span className="fraud-cases-case-meta-item">
                    💰 ${caseItem.estimated_loss || 0}
                  </span>
                  <span className="fraud-cases-case-meta-item">
                    📅 {new Date(caseItem.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="fraud-cases-case-actions">
                {caseItem.status === 'open' && (
                  <button
                    onClick={() => handleAssignInvestigator(caseItem.id, user?.id || '')}
                    className="fraud-cases-btn"
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
                      className="fraud-cases-btn"
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
                      className="fraud-cases-btn fraud-cases-btn--primary"
                    >
                      Close Case
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Case Details */}
            <div className="fraud-cases-case-details">
              <div className="fraud-cases-details-grid">
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
                <div className="fraud-cases-investigation-notes">
                  <strong>Investigation Notes:</strong>
                  <p className="fraud-cases-notes-text">{caseItem.investigation_notes}</p>
                </div>
              )}

              {caseItem.evidence && caseItem.evidence.length > 0 && (
                <div>
                  <strong>Evidence ({caseItem.evidence.length}):</strong>
                  <div className="fraud-cases-evidence-list">
                    {caseItem.evidence.map((evidence: { type: string; description: string }, index: number) => (
                      <span key={index} className="fraud-cases-evidence-tag">
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
          <div className="fraud-cases-empty-state">
            <div className="fraud-cases-empty-icon">📄</div>
            <h3 className="fraud-cases-empty-title">No cases found</h3>
            <p className="fraud-cases-empty-text">
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
