import React, { useState, useEffect, useCallback } from 'react';
import { api, API_BASE_URL, PaginatedResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FraudRule, FraudRuleRequest, RuleTypeEnum, SeverityEnum } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import './FraudRules.css';

// Get WebSocket base URL from environment
const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }

  // Use centralized API_BASE_URL and convert to WebSocket
  return API_BASE_URL
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace('/api/', '/ws/');
};

const FraudRules: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [activeRules, setActiveRules] = useState<FraudRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<FraudRule | null>(null);
  const [formData, setFormData] = useState<FraudRuleRequest>({
    name: '',
    description: '',
    rule_type: RuleTypeEnum.TRANSACTION_AMOUNT,
    severity: SeverityEnum.MEDIUM,
    field: '',
    operator: '',
    value: '',
    additional_conditions: {},
    is_active: true,
    auto_block: false,
    require_approval: false,
    escalation_threshold: 0
  });

  const fetchRules = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<FraudRule>>('/fraud/rules/');
      const data = response.data;
      if (data && 'results' in data && Array.isArray(data.results)) {
        setRules(data.results);
      } else if (Array.isArray(data)) {
        setRules(data);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveRules = useCallback(async () => {
    try {
      const response = await api.get<PaginatedResponse<FraudRule> | FraudRule[]>('/fraud/rules/active_rules/');
      const data = response.data;
      if (data && 'results' in data && Array.isArray(data.results)) {
        setActiveRules(data.results);
      } else if (Array.isArray(data)) {
        setActiveRules(data);
      } else {
        setActiveRules([]);
      }
    } catch (error) {
      console.error('Error fetching active rules:', error);
    }
  }, []);

  // WebSocket for real-time fraud alerts
  const { isConnected } = useWebSocket({
    url: `${getWsBaseUrl()}fraud-alerts/${user?.id || ''}`,
    onMessage: useCallback((message) => {
      if (message.type === 'fraud_alert_update') {
        console.warn('Real-time fraud alert:', message.alert);
        // Refresh rules to show updated trigger counts
        fetchRules();
        fetchActiveRules();
      }
    }, [fetchRules, fetchActiveRules]),
  });

  useEffect(() => {
    fetchRules();
    fetchActiveRules();
  }, [fetchRules, fetchActiveRules]);

  const handleCreateRule = async () => {
    try {
      const response = await api.post<FraudRule>('/fraud/rules/', formData);
      setRules([...rules, response.data]);
      setShowCreateDialog(false);
      resetForm();
      fetchActiveRules();
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule?.id) return;
    try {
      const response = await api.put<FraudRule>(`/fraud/rules/${editingRule.id}/`, formData);
      setRules(rules.map(rule => rule.id === editingRule.id ? response.data : rule));
      setEditingRule(null);
      resetForm();
      fetchActiveRules();
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const handleToggleActive = async (ruleId: number | string) => {
    try {
      await api.post(`/fraud/rules/${ruleId}/toggle_active/`, {});
      fetchRules();
      fetchActiveRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: RuleTypeEnum.TRANSACTION_AMOUNT,
      severity: SeverityEnum.MEDIUM,
      field: '',
      operator: '',
      value: '',
      additional_conditions: {},
      is_active: true,
      auto_block: false,
      require_approval: false,
      escalation_threshold: 0
    });
  };

  const openEditDialog = (rule: FraudRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      rule_type: rule.rule_type,
      severity: rule.severity,
      field: rule.field,
      operator: rule.operator,
      value: rule.value,
      additional_conditions: rule.additional_conditions || {},
      is_active: rule.is_active,
      auto_block: rule.auto_block,
      require_approval: rule.require_approval,
      escalation_threshold: rule.escalation_threshold
    });
  };



  const getRuleTypeIcon = (type: RuleTypeEnum) => {
    switch (type) {
      case RuleTypeEnum.TRANSACTION_AMOUNT: return '💰';
      case RuleTypeEnum.VELOCITY: return '⚡';
      case RuleTypeEnum.GEOGRAPHIC: return '🌍';
      case RuleTypeEnum.TIME_BASED: return '🕒';
      case RuleTypeEnum.ACCOUNT_ACTIVITY: return '👤';
      default: return '🛡️';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="coastal-spinner"></div>
        <div className="loading-text">Loading Fraud Detection Rules...</div>
      </div>
    );
  }

  return (
    <div className="fraud-rules-page">
      {/* Header */}
      <div className="fraud-header">
        <div className="header-title-row">
          <h1 className="fraud-title">
            Fraud Detection Rules
          </h1>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Live Monitoring Active' : 'Real-time Updates Offline'}
          </div>
        </div>
        <p className="fraud-description">
          Configure real-time monitoring rules to detect and prevent fraudulent transactions.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <h2 className="stats-title">
          🛡️ Active Rules Summary
        </h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value active">{activeRules.length}</div>
            <div className="stat-label">Active Rules</div>
          </div>
          <div className="stat-item">
            <div className="stat-value critical">
              {activeRules.filter(r => r.severity === SeverityEnum.CRITICAL).length}
            </div>
            <div className="stat-label">Critical Rules</div>
          </div>
          <div className="stat-item">
            <div className="stat-value auto-block">
              {activeRules.filter(r => r.auto_block).length}
            </div>
            <div className="stat-label">Auto-Block Rules</div>
          </div>
          <div className="stat-item">
            <div className="stat-value approval">
              {activeRules.filter(r => r.require_approval).length}
            </div>
            <div className="stat-label">Approval Required</div>
          </div>
        </div>
      </div>

      {/* Create Rule Button */}
      <div className="create-button-container">
        <button
          onClick={() => setShowCreateDialog(true)}
          aria-label="Create new fraud detection rule"
          className="create-rule-btn"
        >
          <span>➕</span> Create New Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="rules-list">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rule-card"
          >
            <div className="rule-card-header">
              <div className="rule-info-main">
                <div className="rule-type-icon">
                  {getRuleTypeIcon(rule.rule_type)}
                </div>
                <div>
                  <h3 className="rule-name">
                    {rule.name}
                  </h3>
                  <p className="rule-description-text">
                    {rule.description}
                  </p>
                </div>
              </div>
              <div className="rule-actions">
                <span className={`severity-badge ${rule.severity.toLowerCase()}`}>
                  {rule.severity}
                </span>
                <button
                  onClick={() => handleToggleActive(rule.id)}
                  className={`toggle-active-btn ${rule.is_active ? 'active' : 'inactive'}`}
                >
                  {rule.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => openEditDialog(rule)}
                  className="edit-rule-btn"
                >
                  ✏️
                </button>
              </div>
            </div>

            <div className="rule-meta-grid">
              <div>
                <span className="meta-item-label">Rule Logic</span>
                <span className="meta-item-value">
                  {rule.field} {rule.operator} {rule.value}
                </span>
              </div>
              <div>
                <span className="meta-item-label">Triggered</span>
                <span className="meta-item-value">
                  {rule.trigger_count} times
                </span>
              </div>
              <div>
                <span className="meta-item-label">False Positives</span>
                <span className="meta-item-value text-danger">
                  {rule.false_positive_count}
                </span>
              </div>
              <div>
                <span className="meta-item-label">Last Triggered</span>
                <span className="meta-item-value">
                  {rule.last_triggered ? new Date(rule.last_triggered).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="rule-options">
              <label className="option-checkbox-label">
                <input type="checkbox" checked={rule.auto_block} readOnly className="option-checkbox-input" />
                Auto-block Transactions
              </label>
              <label className="option-checkbox-label">
                <input type="checkbox" checked={rule.require_approval} readOnly className="option-checkbox-input" />
                Require Manual Approval
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      {(showCreateDialog || editingRule) && (
        <div className="dialog-overlay">
          <div className="dialog-container">
            <h2 className="dialog-title">
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </h2>

            <div className="form-grid">
              <div className="form-row-2col">
                <div className="input-group">
                  <label htmlFor="rule-name">Rule Name</label>
                  <input
                    id="rule-name"
                    className="field-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter rule name"
                    title="Enter a unique name for this fraud rule"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="rule-type">Rule Type</label>
                  <select
                    id="rule-type"
                    className="field-select"
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as RuleTypeEnum })}
                    title="Select the category of the fraud rule"
                  >
                    <option value="">Select Type</option>
                    {(Object.values(RuleTypeEnum) as RuleTypeEnum[]).map(type => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="rule-description">Description</label>
                <textarea
                  id="rule-description"
                  className="field-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule detects..."
                  title="Provide a detailed description of the rule's purpose"
                />
              </div>

              <div className="form-row-3col">
                <div className="input-group-small">
                  <label htmlFor="rule-field">Field</label>
                  <input
                    id="rule-field"
                    className="field-input-small"
                    value={formData.field}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                    placeholder="amount"
                    title="The transaction field to evaluate (e.g., amount, location)"
                  />
                </div>
                <div className="input-group-small">
                  <label htmlFor="rule-operator">Operator</label>
                  <select
                    id="rule-operator"
                    className="field-select-small"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    title="Comparison operator"
                  >
                    <option value=">">{'>'}</option>
                    <option value="<">{'<'}</option>
                    <option value="==">==</option>
                    <option value="!=">!=</option>
                    <option value="contains">contains</option>
                  </select>
                </div>
                <div className="input-group-small">
                  <label htmlFor="rule-threshold">Threshold</label>
                  <input
                    id="rule-threshold"
                    className="field-input-small"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="1000"
                    title="The value to compare against"
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="input-group">
                  <label htmlFor="rule-severity">Severity</label>
                  <select
                    id="rule-severity"
                    className="field-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as SeverityEnum })}
                    title="Alert severity level"
                  >
                    {(Object.values(SeverityEnum) as SeverityEnum[]).map(sev => (
                      <option key={sev} value={sev}>{sev.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="rule-escalation">Escalation Count</label>
                  <input
                    id="rule-escalation"
                    className="field-input"
                    type="number"
                    value={formData.escalation_threshold}
                    onChange={(e) => setFormData({ ...formData, escalation_threshold: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    title="Number of triggers before escalation"
                  />
                </div>
              </div>

              <div className="dialog-checkbox-options">
                <label className="dialog-checkbox-label" htmlFor="rule-auto-block">
                  <input
                    id="rule-auto-block"
                    type="checkbox"
                    className="dialog-checkbox-input"
                    checked={formData.auto_block}
                    onChange={(e) => setFormData({ ...formData, auto_block: e.target.checked })}
                    title="Automatically block transactions that trigger this rule"
                  />
                  Auto-block Transactions
                </label>
                <label className="dialog-checkbox-label" htmlFor="rule-require-approval">
                  <input
                    id="rule-require-approval"
                    type="checkbox"
                    className="dialog-checkbox-input"
                    checked={formData.require_approval}
                    onChange={(e) => setFormData({ ...formData, require_approval: e.target.checked })}
                    title="Require manual review for transactions that trigger this rule"
                  />
                  Require Manual Approval
                </label>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                className="btn-cancel"
                onClick={() => { setShowCreateDialog(false); setEditingRule(null); resetForm(); }}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={editingRule ? handleUpdateRule : handleCreateRule}
              >
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FraudRules;
