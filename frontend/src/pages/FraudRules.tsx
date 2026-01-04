import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FraudRule, FraudRuleRequest } from '../api/models/FraudRule';
import { useWebSocket } from '../hooks/useWebSocket';
import VirtualizedList from '../components/VirtualizedList';

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
    rule_type: '',
    severity: 'medium',
    field: '',
    operator: '',
    value: '',
    additional_conditions: {},
    is_active: true,
    auto_block: false,
    require_approval: false,
    escalation_threshold: 0
  });

  // WebSocket for real-time fraud alerts
  const { isConnected } = useWebSocket({
    url: `${getWsBaseUrl()}fraud-alerts/${user?.id || ''}`,
    onMessage: useCallback((message) => {
      if (message.type === 'fraud_alert_update') {
        console.log('Real-time fraud alert:', message.alert);
        // Refresh rules to show updated trigger counts
        fetchRules();
        fetchActiveRules();
      }
    }, []),
  });

  useEffect(() => {
    fetchRules();
    fetchActiveRules();
  }, []);

  const fetchRules = useCallback(async () => {
    try {
      const response = await api.get('fraud/rules/');
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveRules = useCallback(async () => {
    try {
      const response = await api.get('fraud/rules/active_rules/');
      setActiveRules(response.data);
    } catch (error) {
      console.error('Error fetching active rules:', error);
    }
  }, []);

  const handleCreateRule = async () => {
    try {
      const response = await api.post('fraud/rules/', formData);
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
      const response = await api.put(`fraud/rules/${editingRule.id}/`, formData);
      setRules(rules.map(rule => rule.id === editingRule.id ? response.data : rule));
      setEditingRule(null);
      resetForm();
      fetchActiveRules();
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const handleToggleActive = async (ruleId: number) => {
    try {
      await api.post(`fraud/rules/${ruleId}/toggle_active/`, {});
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
      rule_type: '',
      severity: 'medium',
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

  const openEditDialog = (rule) => {
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRuleTypeIcon = (ruleType) => {
    switch (ruleType) {
      case 'amount_threshold': return '💰';
      case 'velocity_check': return '⚡';
      case 'unusual_pattern': return '🔍';
      case 'location_anomaly': return '📍';
      case 'time_based': return '⏰';
      case 'account_behavior': return '👤';
      default: return '⚙️';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}
      role="main"
      aria-labelledby="fraud-rules-heading"
    >
      <div style={{ marginBottom: '24px' }}>
        <h1
          id="fraud-rules-heading"
          style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}
        >
          Fraud Detection Rules
        </h1>
        <p style={{ color: '#64748b' }}>Configure and manage fraud detection rules</p>
      </div>

      {/* Active Rules Summary */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
          🛡️ Active Rules Summary
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{activeRules.length}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Active Rules</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
              {activeRules.filter(r => r.severity === 'critical').length}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Critical Rules</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
              {activeRules.filter(r => r.auto_block).length}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Auto-Block Rules</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
              {activeRules.filter(r => r.require_approval).length}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Approval Required</div>
          </div>
        </div>
      </div>

      {/* Create Rule Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowCreateDialog(true)}
          aria-label="Create new fraud detection rule"
          style={{
            padding: '12px 24px',
            background: '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Create New Rule
        </button>
      </div>

      {/* Create Rule Modal */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>Create Fraud Detection Rule</h2>
            <RuleForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateRule}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length > 20 ? (
        <VirtualizedList
          items={rules}
          itemHeight={120}
          containerHeight={600}
          renderItem={(rule, index) => (
            <div
              key={rule.id}
              role="listitem"
              aria-label={`Fraud rule: ${rule.name}, severity ${rule.severity}, ${rule.is_active ? 'active' : 'inactive'}`}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                transition: 'box-shadow 0.2s',
                marginBottom: '16px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{getRuleTypeIcon(rule.rule_type)}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      background: getSeverityColor(rule.severity).replace('bg-', '').replace('-500', '')
                    }}>
                      {rule.severity.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: rule.is_active ? '#dbeafe' : '#f3f4f6',
                      color: rule.is_active ? '#1e40af' : '#374151'
                    }}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {rule.auto_block && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#fee2e2',
                        color: '#dc2626'
                      }}>
                        Auto-Block
                      </span>
                    )}
                    {rule.require_approval && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #d1d5db',
                        background: 'white'
                      }}>
                        Approval Required
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>{rule.name}</h3>
                  <p style={{ color: '#64748b', marginBottom: '8px' }}>{rule.description}</p>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    <strong>Condition:</strong> {rule.field} {rule.operator} {rule.value}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                    <span>Triggered: {rule.trigger_count} times</span>
                    <span>False Positives: {rule.false_positive_count}</span>
                    {rule.last_triggered && (
                      <span>Last triggered: {new Date(rule.last_triggered).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditDialog(rule)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {rule.is_active ? '🟢' : '⚪'}
                  </button>
                </div>
              </div>
            </div>
          )}
        />
      ) : (
        <div
          role="list"
          aria-label="Fraud detection rules"
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {rules.map((rule) => (
            <div
              key={rule.id}
              role="listitem"
              aria-label={`Fraud rule: ${rule.name}, severity ${rule.severity}, ${rule.is_active ? 'active' : 'inactive'}`}
              style={{
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
                    <span style={{ fontSize: '24px' }}>{getRuleTypeIcon(rule.rule_type)}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'white',
                      background: getSeverityColor(rule.severity).replace('bg-', '').replace('-500', '')
                    }}>
                      {rule.severity.toUpperCase()}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: rule.is_active ? '#dbeafe' : '#f3f4f6',
                      color: rule.is_active ? '#1e40af' : '#374151'
                    }}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {rule.auto_block && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: '#fee2e2',
                        color: '#dc2626'
                      }}>
                        Auto-Block
                      </span>
                    )}
                    {rule.require_approval && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #d1d5db',
                        background: 'white'
                      }}>
                        Approval Required
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1e293b' }}>{rule.name}</h3>
                  <p style={{ color: '#64748b', marginBottom: '8px' }}>{rule.description}</p>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    <strong>Condition:</strong> {rule.field} {rule.operator} {rule.value}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                    <span>Triggered: {rule.trigger_count} times</span>
                    <span>False Positives: {rule.false_positive_count}</span>
                    {rule.last_triggered && (
                      <span>Last triggered: {new Date(rule.last_triggered).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditDialog(rule)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {rule.is_active ? '🟢' : '⚪'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>No rules configured</h3>
              <p style={{ color: '#64748b', marginBottom: '16px' }}>
                Create your first fraud detection rule to start monitoring transactions.
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                style={{
                  padding: '12px 24px',
                  background: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ➕ Create First Rule
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>Edit Fraud Detection Rule</h2>
            <RuleForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateRule}
              onCancel={() => setEditingRule(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

// Rule Form Component
const RuleForm = ({ formData, setFormData, onSubmit, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Rule Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
            required
          />
        </div>
        <div>
          <label htmlFor="rule_type" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Rule Type</label>
          <select
            id="rule_type"
            value={formData.rule_type}
            onChange={(e) => updateFormData('rule_type', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Select rule type</option>
            <option value="amount_threshold">Amount Threshold</option>
            <option value="velocity_check">Velocity Check</option>
            <option value="unusual_pattern">Unusual Pattern</option>
            <option value="location_anomaly">Location Anomaly</option>
            <option value="time_based">Time-Based Rule</option>
            <option value="account_behavior">Account Behavior</option>
            <option value="custom">Custom Rule</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label htmlFor="severity" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Severity</label>
          <select
            id="severity"
            value={formData.severity}
            onChange={(e) => updateFormData('severity', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="field" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Field</label>
          <input
            id="field"
            type="text"
            value={formData.field}
            onChange={(e) => updateFormData('field', e.target.value)}
            placeholder="e.g., amount, account_id"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
            required
          />
        </div>
        <div>
          <label htmlFor="operator" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Operator</label>
          <select
            id="operator"
            value={formData.operator}
            onChange={(e) => updateFormData('operator', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Select operator</option>
            <option value="gt">Greater Than</option>
            <option value="gte">Greater Than or Equal</option>
            <option value="lt">Less Than</option>
            <option value="lte">Less Than or Equal</option>
            <option value="eq">Equal</option>
            <option value="ne">Not Equal</option>
            <option value="contains">Contains</option>
            <option value="in">In List</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="value" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Value</label>
        <input
          id="value"
          type="text"
          value={formData.value}
          onChange={(e) => updateFormData('value', e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <label htmlFor="escalation_threshold" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Escalation Threshold</label>
          <input
            id="escalation_threshold"
            type="number"
            value={formData.escalation_threshold}
            onChange={(e) => updateFormData('escalation_threshold', parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => updateFormData('is_active', e.target.checked)}
          />
          <span style={{ fontSize: '14px', color: '#374151' }}>Active</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.auto_block}
            onChange={(e) => updateFormData('auto_block', e.target.checked)}
          />
          <span style={{ fontSize: '14px', color: '#374151' }}>Auto-Block</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.require_approval}
            onChange={(e) => updateFormData('require_approval', e.target.checked)}
          />
          <span style={{ fontSize: '14px', color: '#374151' }}>Require Approval</span>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: '#1e40af',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          {formData.id ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
};

export default FraudRules;
