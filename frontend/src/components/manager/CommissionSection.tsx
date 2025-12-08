import React from 'react';

interface CommissionSectionProps {
  commissionData: any;
}

const CommissionSection: React.FC<CommissionSectionProps> = ({ commissionData }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🤝 Commission Management</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>💼</div>
        <h4>Commission Calculations</h4>
        <p>Calculate and manage commissions for staff and agents.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default CommissionSection;