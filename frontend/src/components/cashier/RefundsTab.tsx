import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader } from './CashierTheme';
import { api } from '../../services/api.ts';
import { formatCurrencyGHS } from '../../utils/formatters';

interface Refund {
  id: string;
  original_transaction: string; // ID only
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
      setRefunds(response.data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      setMessage({ type: 'error', text: 'Failed to load refunds' });
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
      await api.post(`banking/refunds/${selectedRefund.id}/reject/`, {
        notes: rejectionNotes
      });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FDCB6E';
      case 'approved': return '#00B894';
      case 'rejected': return '#FF7675';
      case 'processed': return '#6C5CE7';
      default: return '#636E72';
    }
  };

  const pendingRefunds = refunds.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <PlayfulCard>
        <h2>↩️ Refunds</h2>
        <SkeletonLoader />
      </PlayfulCard>
    );
  }

  return (
    <PlayfulCard>
      <h2>↩️ Refunds</h2>
      <p>Manage refund requests and process approvals.</p>

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

      <div style={{ marginBottom: '20px' }}>
        <h3>Pending Refunds ({pendingRefunds.length})</h3>
        {pendingRefunds.length === 0 ? (
          <p style={{ color: '#636E72', fontStyle: 'italic' }}>No pending refunds</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {pendingRefunds.map((refund) => (
              <div key={refund.id} style={{
                border: '1px solid #DFE6E9',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2D3436' }}>
                      Refund Request #{refund.id.slice(-8)}
                    </h4>
                    <p style={{ margin: '0', color: '#636E72', fontSize: '14px' }}>
                      Transaction: {refund.original_transaction_ref} • {formatCurrencyGHS(refund.original_transaction_details.amount)}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: getStatusColor(refund.status)
                  }}>
                    {refund.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    Requested: {formatCurrencyGHS(refund.requested_amount)} ({refund.refund_type})
                  </p>
                  <p style={{ margin: '0 0 5px 0', color: '#636E72', fontSize: '14px' }}>
                    Reason: {refund.reason}
                  </p>
                  {refund.refund_notes && (
                    <p style={{ margin: '0', color: '#636E72', fontSize: '14px' }}>
                      Notes: {refund.refund_notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#636E72' }}>
                    Requested by {refund.requested_by_name} on {new Date(refund.requested_at).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => {
                      setSelectedRefund(refund);
                      setApprovedAmount(refund.requested_amount.toString());
                      setShowApprovalModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#00B894',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✅ Accept
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRefund(refund);
                      setShowRejectionModal(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#FF7675',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ❌ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Refunds History */}
      <div>
        <h3>All Refunds ({refunds.length})</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #DFE6E9', borderRadius: '8px' }}>
          {refunds.map((refund) => (
            <div key={refund.id} style={{
              padding: '10px 15px',
              borderBottom: '1px solid #F0F0F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>#{refund.id.slice(-8)}</span>
                <span style={{ marginLeft: '10px', color: '#636E72' }}>
                  {refund.original_transaction_ref} • {formatCurrencyGHS(refund.requested_amount)}
                </span>
              </div>
              <span style={{
                padding: '2px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: getStatusColor(refund.status)
              }}>
                {refund.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRefund && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3>Approve Refund</h3>
            <p>Refund for transaction {selectedRefund.original_transaction_ref}</p>
            <p>Requested: {formatCurrencyGHS(selectedRefund.requested_amount)}</p>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Approved Amount (optional):
              </label>
              <input
                type="number"
                step="0.01"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder={selectedRefund.requested_amount.toString()}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #DFE6E9',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Approval Notes:
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #DFE6E9',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={processing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#636E72',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#00B894',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRefund && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%'
          }}>
            <h3>Reject Refund</h3>
            <p>Refund for transaction {selectedRefund.original_transaction_ref}</p>
            <p>Requested: {formatCurrencyGHS(selectedRefund.requested_amount)}</p>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Rejection Reason (required):
              </label>
              <textarea
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #DFE6E9',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRejectionModal(false)}
                disabled={processing}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#636E72',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionNotes.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF7675',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PlayfulCard>
  );
};

export default RefundsTab;