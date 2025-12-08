import React, { useState, useEffect } from 'react';
import { PlayfulCard, PlayfulButton, PlayfulInput, THEME } from './CashierTheme';
import { api } from '../../services/api.ts';

interface Complaint {
  id: string;
  account: string;
  account_number: string;
  related_transaction?: string;
  related_transaction_ref?: string;
  complaint_type: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  escalation_level: number;
  submitted_by: string;
  submitted_by_name: string;
  submitted_at: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_at?: string;
  resolved_by?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  resolution?: string;
  resolution_satisfaction?: string;
  escalated_at?: string;
  escalated_by?: string;
  escalated_by_name?: string;
  escalation_reason?: string;
  customer_contacted: boolean;
  contact_attempts: number;
  last_contact_date?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  attachments?: string[];
  evidence?: string[];
  audit_trail: any[];
  created_at: string;
  updated_at: string;
}

interface ComplaintStats {
  total_complaints: number;
  open_complaints: number;
  investigating_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
  escalated_complaints: number;
  avg_resolution_time_days: number;
}

const ComplaintsTab: React.FC = () => {
  console.log('ComplaintsTab component is rendering!');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    account_id: '',
    related_transaction_id: '',
    complaint_type: '',
    priority: 'medium',
    subject: '',
    description: '',
    follow_up_required: false,
    follow_up_date: '',
    attachments: [] as File[]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('banking/complaints/');
      setComplaints(response.data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setMessage({ type: 'error', text: 'Failed to load complaints' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('banking/complaints/reports/summary/');
      console.log('Stats response:', response.data);
      setStats(response.data.summary);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        total_complaints: 0,
        open_complaints: 0,
        investigating_complaints: 0,
        resolved_complaints: 0,
        closed_complaints: 0,
        escalated_complaints: 0,
        avg_resolution_time_days: null
      });
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.complaint_type || !formData.subject || !formData.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        account_id: formData.account_id,
        complaint_type: formData.complaint_type,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_date || null,
        ...(formData.related_transaction_id && { related_transaction_id: formData.related_transaction_id })
      };

      await api.post('banking/complaints/', submitData);
      setMessage({ type: 'success', text: 'Complaint submitted successfully' });
      setShowForm(false);
      setFormData({
        account_id: '',
        related_transaction_id: '',
        complaint_type: '',
        priority: 'medium',
        subject: '',
        description: '',
        follow_up_required: false,
        follow_up_date: '',
        attachments: []
      });
      fetchComplaints();
      fetchStats();
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to submit complaint' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#74B9FF';
      case 'investigating': return '#FDCB6E';
      case 'resolved': return '#00B894';
      case 'closed': return '#636E72';
      case 'escalated': return '#FF7675';
      default: return '#636E72';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#00B894';
      case 'medium': return '#FDCB6E';
      case 'high': return '#FF7675';
      case 'critical': return '#D63031';
      default: return '#636E72';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = !searchTerm ||
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.submitted_by_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || complaint.status === statusFilter;
    const matchesDate = !dateFilter || complaint.submitted_at.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const complaintTypes = [
    { value: 'product_issue', label: 'Product Issue' },
    { value: 'service_delay', label: 'Service Delay' },
    { value: 'billing_error', label: 'Billing Error' },
    { value: 'account_access', label: 'Account Access' },
    { value: 'transaction_error', label: 'Transaction Error' },
    { value: 'staff_behavior', label: 'Staff Behavior' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'escalated', label: 'Escalated' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PlayfulCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>📢 Complaints Management</h2>
          <PlayfulButton onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Complaint'}
          </PlayfulButton>
        </div>

        {message.text && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
            color: message.type === 'error' ? '#C62828' : '#2E7D32',
            border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Analytics Summary */}
        {stats && stats.total_complaints !== undefined && (
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '10px', color: THEME.colors.text }}>📊 Complaint Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.colors.primary }}>{stats.total_complaints || 0}</div>
                <div style={{ fontSize: '12px', color: THEME.colors.muted }}>Total Complaints</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#74B9FF' }}>{stats.open_complaints || 0}</div>
                <div style={{ fontSize: '12px', color: THEME.colors.muted }}>Open</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00B894' }}>{stats.resolved_complaints || 0}</div>
                <div style={{ fontSize: '12px', color: THEME.colors.muted }}>Resolved</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FDCB6E' }}>
                  {(stats.total_complaints || 0) > 0 ? Math.round(((stats.resolved_complaints || 0) / (stats.total_complaints || 1)) * 100) : 0}%
                </div>
                <div style={{ fontSize: '12px', color: THEME.colors.muted }}>Resolution Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF7675' }}>{stats.avg_resolution_time_days ? Math.round(stats.avg_resolution_time_days) : 'N/A'}</div>
                <div style={{ fontSize: '12px', color: THEME.colors.muted }}>Avg Resolution (days)</div>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Submission Form */}
        {showForm && (
          <div style={{ marginBottom: '20px', padding: '20px', border: '2px solid #DFE6E9', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '15px' }}>Submit New Complaint</h3>
            <form onSubmit={handleSubmitComplaint}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <PlayfulInput
                  label="Account ID *"
                  type="text"
                  value={formData.account_id}
                  onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                  placeholder="Enter account UUID"
                  required
                />

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: THEME.colors.muted }}>
                    Complaint Type *
                  </label>
                  <select
                    value={formData.complaint_type}
                    onChange={(e) => setFormData({...formData, complaint_type: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: THEME.radius.small,
                      border: `3px solid ${THEME.colors.border}`,
                      fontSize: '16px',
                      outline: 'none',
                      background: '#F9F9F9'
                    }}
                  >
                    <option value="">Select complaint type</option>
                    {complaintTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: THEME.colors.muted }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: THEME.radius.small,
                      border: `3px solid ${THEME.colors.border}`,
                      fontSize: '16px',
                      outline: 'none',
                      background: '#F9F9F9'
                    }}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>

                <PlayfulInput
                  label="Related Transaction ID (optional)"
                  type="text"
                  value={formData.related_transaction_id}
                  onChange={(e) => setFormData({...formData, related_transaction_id: e.target.value})}
                  placeholder="Enter transaction UUID if applicable"
                />
              </div>

              <PlayfulInput
                label="Subject *"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                placeholder="Brief description of the complaint"
                required
              />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: THEME.colors.muted }}>
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of the complaint..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: THEME.radius.small,
                    border: `3px solid ${THEME.colors.border}`,
                    fontSize: '16px',
                    outline: 'none',
                    background: '#F9F9F9',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.follow_up_required}
                    onChange={(e) => setFormData({...formData, follow_up_required: e.target.checked})}
                  />
                  Follow-up required
                </label>

                {formData.follow_up_required && (
                  <PlayfulInput
                    label="Follow-up Date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <PlayfulButton
                  variant="danger"
                  onClick={() => setShowForm(false)}
                  style={{ backgroundColor: THEME.colors.muted }}
                >
                  Cancel
                </PlayfulButton>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? THEME.colors.muted : THEME.colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: THEME.radius.round,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: THEME.shadows.button,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <PlayfulInput
              label="Search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject, description, or submitter..."
            />

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: THEME.colors.muted }}>
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: THEME.radius.small,
                  border: `3px solid ${THEME.colors.border}`,
                  fontSize: '16px',
                  outline: 'none',
                  background: '#F9F9F9'
                }}
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <PlayfulInput
              label="Date Filter (YYYY-MM-DD)"
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by submission date"
            />

            <div style={{ display: 'flex', alignItems: 'end' }}>
              <PlayfulButton
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
                style={{ backgroundColor: THEME.colors.muted }}
              >
                Clear Filters
              </PlayfulButton>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div>
          <h3>Complaints ({filteredComplaints.length})</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Loading complaints...</div>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: THEME.colors.muted }}>
              {complaints.length === 0 ? 'No complaints found. Create your first complaint!' : 'No complaints match your filters.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredComplaints.map((complaint) => (
                <div key={complaint.id} style={{
                  border: '1px solid #DFE6E9',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: THEME.colors.text }}>
                        {complaint.subject}
                      </h4>
                      <p style={{ margin: '0', color: THEME.colors.muted, fontSize: '14px' }}>
                        ID: {complaint.id.slice(-8).toUpperCase()} • Account: ****{complaint.account_number}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getStatusColor(complaint.status)
                      }}>
                        {complaint.status.toUpperCase()}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getPriorityColor(complaint.priority)
                      }}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px 0', color: THEME.colors.text }}>
                    {complaint.description.length > 150
                      ? `${complaint.description.substring(0, 150)}...`
                      : complaint.description
                    }
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: THEME.colors.muted }}>
                    <div>
                      <span>Type: {complaintTypes.find(t => t.value === complaint.complaint_type)?.label || complaint.complaint_type}</span>
                      {complaint.related_transaction_ref && (
                        <span style={{ marginLeft: '15px' }}>Transaction: {complaint.related_transaction_ref}</span>
                      )}
                    </div>
                    <div>
                      <span>Submitted by {complaint.submitted_by_name} on {new Date(complaint.submitted_at).toLocaleDateString()}</span>
                      {complaint.assigned_to_name && (
                        <span style={{ marginLeft: '15px' }}>Assigned to: {complaint.assigned_to_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PlayfulCard>
    </div>
  );
};

export default ComplaintsTab;