import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface Refund {
  id: string;
  original_transaction: string;
  original_transaction_details: {
    id: string;
    reference_number: string;
    amount: number;
    timestamp: string;
    type: string;
  };
  original_transaction_ref: string;
  refund_type: string;
  requested_amount: number;
  approved_amount?: number;
  reason: string;
  refund_notes: string;
  status: string;
  requested_by_name: string;
  requested_at: string;
  approved_by_name?: string;
  approved_at?: string;
  processed_by_name?: string;
  processed_at?: string;
}

const RefundsTab: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await api.get('banking/refunds/');
      const data = response.data?.results || response.data || [];
      setRefunds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      setMessage({ type: 'error', text: 'Failed to load refunds' });
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    try {
      setProcessing(true);
      const amount = approvedAmount ? parseFloat(approvedAmount) : undefined;
      await api.post(`banking/refunds/${selectedRefund.id}/approve/`, {
        approved_amount: amount,
        notes: approvalNotes
      });
      setMessage({ type: 'success', text: 'Refund approved successfully' });
      setShowApprovalModal(false);
      setSelectedRefund(null);
      setApprovalNotes('');
      setApprovedAmount('');
      fetchRefunds();
    } catch (error) {
      console.error('Error approving refund:', error);
      setMessage({ type: 'error', text: 'Failed to approve refund' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    try {
      setProcessing(true);
      await api.post(`banking/refunds/${selectedRefund.id}/reject/`, { notes: rejectionNotes });
      setMessage({ type: 'success', text: 'Refund rejected successfully' });
      setShowRejectionModal(false);
      setSelectedRefund(null);
      setRejectionNotes('');
      fetchRefunds();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      setMessage({ type: 'error', text: 'Failed to reject refund' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let cx = 'bg-gray-100 text-gray-600';
    if (s === 'pending') cx = 'bg-amber-100 text-amber-700';
    else if (s === 'approved') cx = 'bg-emerald-100 text-emerald-700';
    else if (s === 'rejected') cx = 'bg-red-100 text-red-700';
    else if (s === 'processed') cx = 'bg-indigo-100 text-indigo-700';

    return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${cx}`}>{status}</span>;
  };

  const pendingRefunds = refunds.filter(r => r.status === 'pending');

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Refunds...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>↩️</span> Refunds
        </h2>
        <p className="text-gray-500">Manage refund requests and process approvals.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Refunds ({pendingRefunds.length})</h3>
        {pendingRefunds.length === 0 ? (
          <p className="text-gray-400 italic">No pending refunds</p>
        ) : (
          <div className="space-y-4">
            {pendingRefunds.map((refund) => (
              <div key={refund.id} className="bg-white border boundary-gray-200 rounded-xl p-4 shadow-sm hover:border-coastal-primary transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">Refund Request #{refund.id.slice(-8)}</h4>
                    <p className="text-sm text-gray-500">
                      Transaction: {refund.original_transaction_ref} • {formatCurrencyGHS(refund.original_transaction_details.amount)}
                    </p>
                  </div>
                  {getStatusBadge(refund.status)}
                </div>

                <div className="mb-2">
                  <p className="font-semibold text-gray-800">
                    Requested: {formatCurrencyGHS(refund.requested_amount)} <span className="text-gray-400 font-normal">({refund.refund_type})</span>
                  </p>
                  <p className="text-sm text-gray-600">Reason: {refund.reason}</p>
                  {refund.refund_notes && <p className="text-sm text-gray-500 italic">Notes: {refund.refund_notes}</p>}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-400">
                    Requested by {refund.requested_by_name} on {new Date(refund.requested_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        setSelectedRefund(refund);
                        setApprovedAmount(refund.requested_amount.toString());
                        setShowApprovalModal(true);
                      }}
                    >
                      ✅ Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setSelectedRefund(refund);
                        setShowRejectionModal(true);
                      }}
                    >
                      ❌ Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">All Refunds History</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {refunds.map((refund) => (
            <div key={refund.id} className="p-4 border-b border-gray-50 flex justify-between items-center last:border-0 hover:bg-gray-50">
              <div>
                <span className="font-mono font-bold text-gray-600">#{refund.id.slice(-8)}</span>
                <span className="ml-3 text-sm text-gray-500">
                  {refund.original_transaction_ref} • {formatCurrencyGHS(refund.requested_amount)}
                </span>
              </div>
              {getStatusBadge(refund.status)}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Approval Modal */}
      {showApprovalModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-2">Approve Refund</h3>
            <p className="text-gray-600 text-sm mb-4">Refund for {selectedRefund.original_transaction_ref}</p>

            <div className="space-y-4">
              <Input
                label="Approved Amount"
                type="number"
                step="0.01"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder={selectedRefund.requested_amount.toString()}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Approval Notes</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="secondary" onClick={() => setShowApprovalModal(false)} disabled={processing}>Cancel</Button>
                <Button variant="success" onClick={handleApprove} disabled={processing}>
                  {processing ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-2 text-red-600">Reject Refund</h3>
            <p className="text-gray-600 text-sm mb-4">Refund for {selectedRefund.original_transaction_ref}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Rejection Reason *</label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="secondary" onClick={() => setShowRejectionModal(false)} disabled={processing}>Cancel</Button>
                <Button variant="danger" onClick={handleReject} disabled={processing || !rejectionNotes.trim()}>
                  {processing ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundsTab;
