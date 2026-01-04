import React from 'react';
import { formatCurrencyGHS } from '../utils/formatters';

function LoansSection({ loans, handleApproveLoan }) {
  // Ensure loans is an array before mapping
  const loansArray = Array.isArray(loans) ? loans : [];

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
         Pending Loan Approvals
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loansArray.length === 0 ? (
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
              No Pending Loans
            </div>
            <div style={{ fontSize: '14px' }}>
              All loan applications have been processed or there are no pending approvals at this time.
            </div>
          </div>
        ) : (
          loansArray.map((loan, index) => (
            <div key={loan.id || index} style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                  {loan.borrower_name || loan.applicant || 'Unknown Applicant'}
                </div>
                <div style={{ color: '#64748b' }}>
                  {loan.purpose || loan.description || 'No description provided'}
                </div>
                <div style={{ color: '#059669', fontWeight: '600' }}>
                  {formatCurrencyGHS(loan.amount || 0)}
                </div>
              </div>
              <button
                onClick={() => handleApproveLoan && handleApproveLoan(loan.id)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LoansSection;
