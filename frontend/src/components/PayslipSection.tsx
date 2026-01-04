import React from 'react';

function PayslipSection({ formData, setFormData, handleGeneratePayslip }) {
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
         Generate Payslip
      </h3>
      <form onSubmit={(e) => { e.preventDefault(); handleGeneratePayslip(); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Staff ID</label>
          <input
            type="text"
            value={formData.staff_id || ''}
            onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Month</label>
          <input
            type="text"
            value={formData.month || ''}
            onChange={(e) => setFormData({...formData, month: e.target.value})}
            placeholder="e.g., 2025-10"
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <button type="submit" style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Generate Payslip
          </button>
        </div>
      </form>
    </div>
  );
}

export default PayslipSection;
