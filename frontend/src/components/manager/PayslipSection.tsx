import React, { useState, useEffect } from 'react';
import { THEME } from './ManagerTheme';

interface PayslipSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleGeneratePayslip: () => void;
  staffMembers?: any[];
}

const PayslipSection: React.FC<PayslipSectionProps> = ({
  formData,
  setFormData,
  handleGeneratePayslip,
  staffMembers = []
}) => {
  const [ssnitAmount, setSsnitAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculation Logic: Payslip = Base Pay + Allowances + 13.5% SSNIT
  useEffect(() => {
    const basePay = parseFloat(formData.base_pay) || 0;
    const allowances = parseFloat(formData.allowances) || 0;

    const ssnit = basePay * 0.135;
    setSsnitAmount(ssnit);
    setTotalAmount(basePay + allowances - ssnit);
  }, [formData.base_pay, formData.allowances]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  };

  // --- PRINT LOGIC ---
  const [isGenerated, setIsGenerated] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const onGenerateClick = () => {
    handleGeneratePayslip();
    // Simulate getting data for print since the API call void prop doesn't return data here
    // In a real scenario, handleGeneratePayslip would return the data
    const basePay = parseFloat(formData.base_pay) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const ssnit = basePay * 0.135;
    const total = basePay + allowances - ssnit;

    const staffMember = staffMembers.find(s => s.id.toString() === formData.staff_id?.toString());

    setPrintData({
      staffName: staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : 'Unknown Staff',
      staffEmail: staffMember?.email || '',
      basePay,
      allowances,
      ssnit,
      total,
      date: new Date().toLocaleDateString()
    });
    setIsGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Styles for Printing */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-payslip, #printable-payslip * { visibility: visible; }
            #printable-payslip {
              visibility: visible !important;
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              background: white;
              padding: 40px;
              z-index: 9999;
            }
            @page { size: auto; margin: 0mm; }
          }
        `}
      </style>

      {/* Printable Area (Hidden by default) */}
      <div id="printable-payslip" style={{ display: 'none' }}>
        {printData && (
          <div style={{ fontFamily: "'Nunito', sans-serif", border: '4px solid #000', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>Coastal Community Union</h1>
              <p style={{ fontSize: '16px', color: '#666', marginTop: '5px' }}>Official Payslip Document</p>
            </div>

            {/* Staff Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Employee Name</strong>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{printData.staffName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Date Issued</strong>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{printData.date}</div>
              </div>
            </div>

            {/* Earnings Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
              <thead>
                <tr style={{ background: '#000', color: '#fff' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '15px' }}>Base Salary</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(printData.basePay)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '15px' }}>Allowances</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(printData.allowances)}</td>
                </tr>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <td style={{ padding: '15px' }}>SSNIT Contribution (13.5%)</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: '700', color: '#666' }}>{formatCurrency(printData.ssnit)}</td>
                </tr>
                <tr style={{ background: '#f0f0f0' }}>
                  <td style={{ padding: '20px', fontSize: '20px', fontWeight: '900' }}>Starting Total Pay</td>
                  <td style={{ padding: '20px', textAlign: 'right', fontSize: '24px', fontWeight: '900' }}>{formatCurrency(printData.total)}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '2px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ width: '200px', height: '1px', background: '#000', marginBottom: '10px' }}></div>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Authorized Signature</span>
              </div>
              <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '12px', color: '#666' }}>
                <p>This is a computer-generated document.</p>
                <p>Generated on {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🧧 Payslip Generation</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Input Form */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '900' }}>
            📝 Staff Pay Details
          </h4>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
              Select Staff Member
            </label>
            <select
              name="staff_id"
              value={formData.staff_id || ''}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #000',
                borderRadius: THEME.radius.small,
                fontFamily: "'Nunito', sans-serif",
                fontSize: '16px'
              }}
            >
              <option value="">-- Select Staff --</option>
              {staffMembers.map((staff: any) => (
                <option key={staff.id} value={staff.id}>
                  {staff.first_name} {staff.last_name} ({staff.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
              Base Pay (GHS)
            </label>
            <input
              type="number"
              name="base_pay"
              value={formData.base_pay || ''}
              onChange={handleChange}
              placeholder="e.g. 2000.00"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #000',
                borderRadius: THEME.radius.small,
                fontFamily: "'Nunito', sans-serif",
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
              Allowances (GHS)
            </label>
            <input
              type="number"
              name="allowances"
              value={formData.allowances || ''}
              onChange={handleChange}
              placeholder="e.g. 500.00"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #000',
                borderRadius: THEME.radius.small,
                fontFamily: "'Nunito', sans-serif",
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={onGenerateClick}
              disabled={!formData.staff_id || !formData.base_pay}
              style={{
                flex: 1,
                padding: '16px',
                background: (!formData.staff_id || !formData.base_pay) ? '#ccc' : THEME.colors.primary,
                color: '#fff',
                border: '2px solid #000',
                borderRadius: THEME.radius.medium,
                fontWeight: '900',
                fontSize: '18px',
                cursor: (!formData.staff_id || !formData.base_pay) ? 'not-allowed' : 'pointer',
                boxShadow: (!formData.staff_id || !formData.base_pay) ? 'none' : THEME.shadows.button,
                transition: 'transform 0.1s'
              }}
              onMouseDown={(e) => !(!formData.staff_id || !formData.base_pay) && (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => !(!formData.staff_id || !formData.base_pay) && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              ⚙️ Generate
            </button>

            {isGenerated && (
              <button
                onClick={handlePrint}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: THEME.colors.success,
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.medium,
                  fontWeight: '900',
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: THEME.shadows.button,
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                🖨️ Print / Save
              </button>
            )}
          </div>
        </div>

        {/* Live Preview / Breakdown */}
        <div style={{
          background: THEME.colors.bg,
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '900', textAlign: 'center' }}>
            📊 Salary Breakdown
          </h4>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', color: '#666' }}>Base Pay</span>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(parseFloat(formData.base_pay) || 0)}</span>
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', color: '#666' }}>Allowances</span>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(parseFloat(formData.allowances) || 0)}</span>
          </div>

          <div style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '2px dashed #ccc'
          }}>
            <div>
              <span style={{ fontSize: '16px', color: '#666' }}>SSNIT Contribution</span>
              <div style={{ fontSize: '12px', color: THEME.colors.info, fontWeight: '700' }}>
                (13.5% of Base Pay)
              </div>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', color: THEME.colors.info }}>
              {formatCurrency(ssnitAmount)}
            </span>
          </div>

          <div style={{
            marginTop: 'auto',
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '4px 4px 0 #000'
          }}>
            <span style={{ fontSize: '20px', fontWeight: '900' }}>TOTAL PAYSLIP</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: THEME.colors.success }}>
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipSection;