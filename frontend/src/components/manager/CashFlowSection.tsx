import React from 'react';

interface CashFlowSectionProps {
  cashFlow: any;
}

const CashFlowSection: React.FC<CashFlowSectionProps> = ({ cashFlow }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🌊 Cash Flow</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>💧</div>
        <h4>Cash Flow Analysis</h4>
        <p>Monitor money movement in and out of the bank.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default CashFlowSection;