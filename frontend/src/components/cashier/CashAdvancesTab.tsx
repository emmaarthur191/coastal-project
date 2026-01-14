import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';
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
      const response = await api.get<any>('banking/cash-advances/');
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
      await api.post<any>('banking/cash-advances/', {
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
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      disbursed: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Cash Advances...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>💵</span> Cash Advances
          </h2>
          <p className="text-gray-500">Manage member cash advance requests</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowNewAdvance(true)}
        >
          New Cash Advance ➕
        </Button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-gray-700">{advances.length}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Advances</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-amber-500">
            {advances.filter(a => a.status === 'pending').length}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-emerald-500">
            {advances.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved</div>
        </GlassCard>
        <GlassCard className="text-center p-4">
          <div className="text-3xl font-black text-blue-500">
            {advances.filter(a => a.status === 'disbursed').length}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Disbursed</div>
        </GlassCard>
      </div>

      {/* New Advance Form */}
      {showNewAdvance && (
        <GlassCard className="p-6 border-2 border-coastal-primary/10">
          <h3 className="text-lg font-bold text-gray-800 mb-6">New Cash Advance Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Member ID *"
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                placeholder="Enter member ID"
                required
              />
              <Input
                label="Amount (GHS) *"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <Input
              as="select"
              label="Reason"
              id="reason"
              title="Reason for cash advance"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            >
              <option value="">Select reason</option>
              <option value="emergency">Emergency</option>
              <option value="medical">Medical Expenses</option>
              <option value="education">Education</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </Input>

            <Input
              as="textarea"
              label="Notes"
              id="notes"
              title="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes..."
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <Button type="button" variant="secondary" onClick={() => setShowNewAdvance(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Advances List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-700">Cash Advance Requests</h3>
        </div>

        {advances.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">💵</div>
            <p>No cash advance requests found</p>
            <p className="text-sm mt-2">Click "New Cash Advance" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 cursor-default text-xs uppercase font-bold">
                <tr>
                  <th className="p-4 border-b border-gray-200">ID</th>
                  <th className="p-4 border-b border-gray-200">Member</th>
                  <th className="p-4 border-b border-gray-200">Amount</th>
                  <th className="p-4 border-b border-gray-200">Reason</th>
                  <th className="p-4 border-b border-gray-200">Status</th>
                  <th className="p-4 border-b border-gray-200">Date</th>
                  <th className="p-4 border-b border-gray-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500">CA-{advance.id}</td>
                    <td className="p-4 font-medium text-gray-800">{advance.member_name || advance.member_id}</td>
                    <td className="p-4 font-bold text-gray-700">{formatCurrencyGHS(parseFloat(advance.amount))}</td>
                    <td className="p-4 text-gray-500 capitalize">{advance.reason || '-'}</td>
                    <td className="p-4">{getStatusBadge(advance.status)}</td>
                    <td className="p-4 text-gray-500 text-xs text-nowrap">
                      {new Date(advance.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {advance.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="success" size="sm" className="h-8 px-2 text-xs">Approve</Button>
                          <Button variant="danger" size="sm" className="h-8 Poi-2 text-xs">Reject</Button>
                        </div>
                      )}
                      {advance.status === 'approved' && (
                        <Button variant="primary" size="sm" className="h-8 px-3 text-xs">Disburse</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default CashAdvancesTab;
