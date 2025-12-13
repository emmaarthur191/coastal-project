import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrencyGHS } from '../../utils/formatters';

interface CashAdvance {
  id: number;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  reason: string;
  member_id: string;
  member_name?: string;
  created_at: string;
  processed_at?: string;
}

const CashAdvancesTab: React.FC = () => {
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAdvance, setShowNewAdvance] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    reason: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const response = await api.get('banking/cash-advances/');
      const data = response.data?.results || response.data || [];
      setAdvances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching cash advances:', error);
      setAdvances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.amount) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('banking/cash-advances/', {
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        reason: formData.reason,
        notes: formData.notes
      });
      setMessage({ type: 'success', text: 'Cash advance request submitted successfully' });
      setShowNewAdvance(false);
      setFormData({ member_id: '', amount: '', reason: '', notes: '' });
      fetchAdvances();
    } catch (error) {
      console.error('Error creating cash advance:', error);
      setMessage({ type: 'error', text: 'Failed to create cash advance request' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      disbursed: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <Card className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-secondary-600">Loading cash advances...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">💵 Cash Advances</h2>
          <p className="text-secondary-600">Manage member cash advance requests</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewAdvance(true)}
        >
          + New Cash Advance
        </Button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-primary-600">{advances.length}</div>
          <div className="text-secondary-500 text-sm">Total Advances</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-yellow-600">
            {advances.filter(a => a.status === 'pending').length}
          </div>
          <div className="text-secondary-500 text-sm">Pending</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-green-600">
            {advances.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-secondary-500 text-sm">Approved</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-blue-600">
            {advances.filter(a => a.status === 'disbursed').length}
          </div>
          <div className="text-secondary-500 text-sm">Disbursed</div>
        </Card>
      </div>

      {/* New Advance Form */}
      {showNewAdvance && (
        <Card className="border-t-4 border-t-primary-500">
          <h3 className="text-lg font-bold text-secondary-900 mb-4">New Cash Advance Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Member ID *</label>
                <input
                  type="text"
                  value={formData.member_id}
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter member ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Amount (GHS) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Reason</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select reason</option>
                <option value="emergency">Emergency</option>
                <option value="medical">Medical Expenses</option>
                <option value="education">Education</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowNewAdvance(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Advances List */}
      <Card>
        <h3 className="text-lg font-bold text-secondary-900 mb-4">Cash Advance Requests</h3>
        {advances.length === 0 ? (
          <div className="text-center py-8 text-secondary-500">
            <div className="text-4xl mb-2">💵</div>
            <p>No cash advance requests found</p>
            <p className="text-sm">Click "New Cash Advance" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left p-3 font-medium text-secondary-600">ID</th>
                  <th className="text-left p-3 font-medium text-secondary-600">Member</th>
                  <th className="text-left p-3 font-medium text-secondary-600">Amount</th>
                  <th className="text-left p-3 font-medium text-secondary-600">Reason</th>
                  <th className="text-left p-3 font-medium text-secondary-600">Status</th>
                  <th className="text-left p-3 font-medium text-secondary-600">Date</th>
                  <th className="text-left p-3 font-medium text-secondary-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((advance) => (
                  <tr key={advance.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="p-3 font-mono text-sm">CA-{advance.id}</td>
                    <td className="p-3">{advance.member_name || advance.member_id}</td>
                    <td className="p-3 font-bold">{formatCurrencyGHS(parseFloat(advance.amount))}</td>
                    <td className="p-3">{advance.reason || '-'}</td>
                    <td className="p-3">{getStatusBadge(advance.status)}</td>
                    <td className="p-3 text-sm text-secondary-500">
                      {new Date(advance.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {advance.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="success" size="sm">Approve</Button>
                          <Button variant="danger" size="sm">Reject</Button>
                        </div>
                      )}
                      {advance.status === 'approved' && (
                        <Button variant="primary" size="sm">Disburse</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CashAdvancesTab;