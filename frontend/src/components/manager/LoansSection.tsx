import React from 'react';

interface Loan {
  id: string;
  applicant_name: string;
  amount: number;
  status: string;
}

interface LoansSectionProps {
  loans: Loan[];
  handleApproveLoan: (loanId: string) => void;
}

const LoansSection: React.FC<LoansSectionProps> = ({ loans, handleApproveLoan }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📝 Loan Applications</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {loans.length > 0 ? loans.map((loan) => (
          <div key={loan.id} style={{
            padding: '20px',
            border: '2px solid #eee',
            borderRadius: '12px',
            background: '#f9f9f9'
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>{loan.applicant_name}</h4>
            <p style={{ margin: '0 0 12px 0', color: '#666' }}>
              Amount: ${loan.amount.toLocaleString()} | Status: {loan.status}
            </p>
            {loan.status === 'pending' && (
              <button
                onClick={() => handleApproveLoan(loan.id)}
                style={{
                  background: '#00B894',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Approve Loan
              </button>
            )}
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📝</div>
            <h4>No loan applications at the moment</h4>
            <p>All loans are up to date! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansSection;