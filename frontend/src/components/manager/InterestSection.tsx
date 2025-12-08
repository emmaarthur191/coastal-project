import React from 'react';

interface InterestSectionProps {
  interestData: any;
}

const InterestSection: React.FC<InterestSectionProps> = ({ interestData }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📈 Interest Calculations</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>💹</div>
        <h4>Interest Management</h4>
        <p>Calculate and manage interest on accounts and loans.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default InterestSection;