import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

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
      const data = response.data?.results || response.data || [];
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setMessage({ type: 'error', text: 'Failed to load complaints' });
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('banking/complaints/reports/summary/');
      setStats(response.data.summary);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        total_complaints: 0,
        open_complaints: 0,
        investigating_complaints: 0,
        resolved_complaints: 0,
        closed_complaints: 0,
        escalated_complaints: 0,
        avg_resolution_time_days: 0
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
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'investigating': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'closed': return 'bg-gray-200 text-gray-700';
      case 'escalated': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'medium': return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'high': return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'critical': return 'border-red-200 bg-red-50 text-red-700 font-bold';
      default: return 'border-gray-200 bg-gray-50 text-gray-600';
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

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Complaints...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>📢</span> Complaints Management
          </h2>
          <p className="text-gray-500">Manage customer complaints and track resolutions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? 'Cancel' : 'New Complaint ➕'}
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Analytics Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-coastal-primary">{stats.total_complaints || 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.open_complaints || 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Open</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.resolved_complaints || 0}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {(stats.total_complaints || 0) > 0 ? Math.round(((stats.resolved_complaints || 0) / (stats.total_complaints || 1)) * 100) : 0}%
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</div>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.avg_resolution_time_days ? Math.round(stats.avg_resolution_time_days) : 'N/A'}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Days</div>
          </GlassCard>
        </div>
      )}

      {/* Complaint Submission Form */}
      {showForm && (
        <GlassCard className="p-6 border-2 border-coastal-primary/10">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Submit New Complaint</h3>
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Account ID *"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                placeholder="Enter account UUID"
                required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Complaint Type *
                </label>
                <select
                  value={formData.complaint_type}
                  onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                >
                  <option value="">Select type...</option>
                  {complaintTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Subject *"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description"
              required
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description..."
                rows={4}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center bg-gray-50 p-4 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.follow_up_required}
                  onChange={(e) => setFormData({ ...formData, follow_up_required: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-coastal-primary focus:ring-coastal-primary"
                />
                <span className="text-gray-700 font-medium">Follow-up required</span>
              </label>

              {formData.follow_up_required && (
                <div className="flex-1">
                  <Input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                    className="bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button onClick={() => setShowForm(false)} variant="secondary" disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitComplaint} disabled={submitting} variant="danger" className="shadow-lg shadow-red-100">
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Search and Filters */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <Input
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Subject, description, submitter..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => { setSearchTerm(''); setStatusFilter(''); setDateFilter(''); }}
            variant="ghost"
            className="h-[50px] text-gray-500 hover:text-gray-800"
          >
            Clear Filters
          </Button>
        </div>
      </GlassCard>

      {/* Complaints List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700">Complaints ({filteredComplaints.length})</h3>
        </div>
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-gray-400 italic">
            {complaints.length === 0 ? 'No complaints found.' : 'No complaints match your filters.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-1">{complaint.subject}</h4>
                    <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400 items-center">
                      <span className="uppercase">#{complaint.id.slice(-8)}</span>
                      <span>•</span>
                      <span>Account: ****{complaint.account_number}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 text-sm line-clamp-2">{complaint.description}</p>

                <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex gap-4">
                    <span>Type: <strong className="text-gray-700">{complaintTypes.find(t => t.value === complaint.complaint_type)?.label || complaint.complaint_type}</strong></span>
                    {complaint.related_transaction_ref && (
                      <span>Txn: <span className="font-mono">{complaint.related_transaction_ref}</span></span>
                    )}
                  </div>
                  <div>
                    Submitted by <span className="font-semibold text-gray-700">{complaint.submitted_by_name}</span> on {new Date(complaint.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ComplaintsTab;