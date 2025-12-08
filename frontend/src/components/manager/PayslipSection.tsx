import React from 'react';

interface PayslipSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleGeneratePayslip: () => void;
}

const PayslipSection: React.FC<PayslipSectionProps> = ({
  formData,
  setFormData,
  handleGeneratePayslip
}) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🧧 Payslips</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>💼</div>
        <h4>Payslip Generation</h4>
        <p>Generate and manage staff payslips.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default PayslipSection;