import React from 'react';

interface StatementsSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleGenerateStatement: () => void;
}

const StatementsSection: React.FC<StatementsSectionProps> = ({
  formData,
  setFormData,
  handleGenerateStatement
}) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📜 Account Statements</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>📄</div>
        <h4>Statement Generation</h4>
        <p>Generate account statements for customers.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default StatementsSection;