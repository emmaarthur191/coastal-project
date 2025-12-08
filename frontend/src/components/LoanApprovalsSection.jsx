import React, { useState, useEffect } from 'react';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api.ts';

function LoanApprovalsSection() {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [actionNotes, setActionNotes] = useState('');

  // Fetch pending loans
  const fetchLoans = async () => {
    try {
      const response = await authService.getPendingLoans();
      if (response.success) {
        // The backend wraps the data in a success response structure: { success: true, data: [...], timestamp: ... }
        const loansData = response.data && response.data.data && Array.isArray(response.data.data) ? response.data.data : [];
        setLoans(loansData);
        setFilteredLoans(loansData);
      } else {
        console.error('Failed to fetch loans:', response.error);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Filter loans based on search and status
  useEffect(() => {
    let filtered = loans;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        (loan.borrower_name || loan.applicant || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loan.purpose || loan.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.id.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    setFilteredLoans(filtered);
  }, [loans, searchTerm, statusFilter]);

  // Handle approve action
  const handleApprove = async (loanId) => {
    try {
      const response = await authService.approveLoan(loanId);
      if (response.success) {
        alert('Loan approved successfully!');
        fetchLoans(); // Refresh the list
        setShowConfirmDialog(null);
        setActionNotes('');
      } else {
        alert('Failed to approve loan: ' + response.error);
      }
    } catch (error) {
      alert('Error approving loan: ' + error.message);
    }
  };

  // Handle reject action
  const handleReject = async (loanId) => {
    try {
      const response = await authService.rejectLoan(loanId, actionNotes);
      if (response.success) {
        alert('Loan rejected successfully!');
        fetchLoans(); // Refresh the list
        setShowConfirmDialog(null);
        setActionNotes('');
      } else {
        alert('Failed to reject loan: ' + response.error);
      }
    } catch (error) {
      alert('Error rejecting loan: ' + error.message);
    }
  };

  // Confirmation dialog component
  const ConfirmDialog = ({ loan, action, onConfirm, onCancel }) => (
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
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
          Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>
          Are you sure you want to {action} the loan application for{' '}
          <strong>{loan.borrower_name || loan.applicant || 'Unknown Applicant'}</strong>?
        </p>
        {action === 'reject' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Rejection Notes (Optional):
            </label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Provide reason for rejection..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                minHeight: '60px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              background: action === 'approve' ? '#10b981' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px'
      }}>
        <div>Loading loan applications...</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        color: '#1e293b',
        fontSize: '20px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        📋 Loan Approvals
      </h3>

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by applicant name, purpose, or loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Loan Applications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredLoans.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              {loans.length === 0 ? 'No Pending Loans' : 'No Matching Loans'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {loans.length === 0
                ? 'All loan applications have been processed.'
                : 'Try adjusting your search or filter criteria.'
              }
            </div>
          </div>
        ) : (
          filteredLoans.map((loan) => (
            <div key={loan.id} style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                    {loan.borrower_name || loan.applicant || 'Unknown Applicant'}
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: loan.status === 'pending' ? '#fef3c7' :
                               loan.status === 'approved' ? '#d1fae5' : '#fee2e2',
                    color: loan.status === 'pending' ? '#92400e' :
                           loan.status === 'approved' ? '#065f46' : '#991b1b'
                  }}>
                    {loan.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div style={{ color: '#64748b', marginBottom: '4px' }}>
                  {loan.purpose || loan.description || 'No description provided'}
                </div>
                <div style={{ color: '#059669', fontWeight: '600', fontSize: '18px' }}>
                  {formatCurrencyGHS(loan.amount || 0)}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                  Applied: {loan.application_date ? new Date(loan.application_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {loan.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowConfirmDialog({ loan, action: 'approve' })}
                    style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog({ loan, action: 'reject' })}
                    style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          loan={showConfirmDialog.loan}
          action={showConfirmDialog.action}
          onConfirm={() => {
            if (showConfirmDialog.action === 'approve') {
              handleApprove(showConfirmDialog.loan.id);
            } else {
              handleReject(showConfirmDialog.loan.id);
            }
          }}
          onCancel={() => {
            setShowConfirmDialog(null);
            setActionNotes('');
          }}
        />
      )}
    </div>
  );
}

export default LoanApprovalsSection;
