import React, { useState, useEffect } from 'react';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService, LoanExtended } from '../services/api';
import './LoanApprovalsSection.css';

type LoanAction = 'approve' | 'reject';

interface ConfirmDialogProps {
  loan: LoanExtended;
  action: LoanAction;
  onConfirm: () => void;
  onCancel: () => void;
}

const LoanApprovalsSection: React.FC = () => {
  const [loans, setLoans] = useState<LoanExtended[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanExtended[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ loan: LoanExtended; action: LoanAction } | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');

  // Fetch pending loans
  const fetchLoans = async () => {
    try {
      const response = await authService.getPendingLoans();
      if (response.success && response.data) {
        // The backend returns a PaginatedResponse structure in response.data
        const loansData = response.data.results || [];
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
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        (loan.borrower_name || loan.applicant || '').toLowerCase().includes(term) ||
        (loan.purpose || loan.description || '').toLowerCase().includes(term) ||
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
  const handleApprove = async (loanId: string | number) => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert('Error approving loan: ' + errorMessage);
    }
  };

  // Handle reject action
  const handleReject = async (loanId: string | number) => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert('Error rejecting loan: ' + errorMessage);
    }
  };

  // Confirmation dialog component
  const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ loan, action, onConfirm, onCancel }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">
          Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
        </h3>
        <p className="modal-body">
          Are you sure you want to {action} the loan application for{' '}
          <strong>{loan.borrower_name || loan.applicant || 'Unknown Applicant'}</strong>?
        </p>
        {action === 'reject' && (
          <div className="form-group">
            <label className="form-label">
              Rejection Notes (Optional):
            </label>
            <textarea
              className="form-textarea"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Provide reason for rejection..."
            />
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${action === 'approve' ? 'btn-approve' : 'btn-reject'}`}
            onClick={onConfirm}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading loan applications...</div>
      </div>
    );
  }

  return (
    <div className="loan-approvals-container">
      <h3 className="loan-approvals-header">
        📋 Loan Approvals
      </h3>

      {/* Search and Filter Controls */}
      <div className="controls-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by applicant name, purpose, or loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            title="Search search-input"
          />
        </div>
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Loan Applications List */}
      <div className="loans-list">
        {filteredLoans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">
              {loans.length === 0 ? 'No Pending Loans' : 'No Matching Loans'}
            </div>
            <div className="empty-desc">
              {loans.length === 0
                ? 'All loan applications have been processed.'
                : 'Try adjusting your search or filter criteria.'
              }
            </div>
          </div>
        ) : (
          filteredLoans.map((loan) => (
            <div key={loan.id} className="loan-card">
              <div>
                <div className="loan-info-header">
                  <div className="borrower-name">
                    {loan.borrower_name || loan.applicant || 'Unknown Applicant'}
                  </div>
                  <span className={`status-badge status-${loan.status || 'pending'}`}>
                    {loan.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="loan-purpose">
                  {loan.purpose || loan.description || 'No description provided'}
                </div>
                <div className="loan-amount">
                  {formatCurrencyGHS(loan.amount || 0)}
                </div>
                <div className="loan-date">
                  Applied: {loan.application_date ? new Date(loan.application_date).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {loan.status === 'pending' && (
                <div className="action-buttons">
                  <button
                    className="btn btn-approve"
                    onClick={() => setShowConfirmDialog({ loan, action: 'approve' })}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => setShowConfirmDialog({ loan, action: 'reject' })}
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
