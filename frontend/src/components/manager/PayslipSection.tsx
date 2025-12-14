import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
    <div className="space-y-6">
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

      {/* Printable Area (Hidden by default via inline style, visible on print via CSS) */}
      <div id="printable-payslip" className="hidden">
        {printData && (
          <div className="font-sans border-4 border-black p-10 max-w-[800px] mx-auto">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-5 mb-8">
              <h1 className="text-3xl font-black m-0 uppercase">Coastal Community Union</h1>
              <p className="text-base text-gray-600 mt-1">Official Payslip Document</p>
            </div>

            {/* Staff Details */}
            <div className="grid grid-cols-2 gap-5 mb-10">
              <div>
                <strong className="block text-sm text-gray-600 uppercase">Employee Name</strong>
                <div className="text-xl font-bold">{printData.staffName}</div>
              </div>
              <div className="text-right">
                <strong className="block text-sm text-gray-600 uppercase">Date Issued</strong>
                <div className="text-xl font-bold">{printData.date}</div>
              </div>
            </div>

            {/* Earnings Table */}
            <table className="w-full border-collapse mb-10">
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-4">Base Salary</td>
                  <td className="p-4 text-right font-bold">{formatCurrency(printData.basePay)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-4">Allowances</td>
                  <td className="p-4 text-right font-bold">{formatCurrency(printData.allowances)}</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="p-4">SSNIT Contribution (13.5%)</td>
                  <td className="p-4 text-right font-bold text-gray-600">{formatCurrency(printData.ssnit)}</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="p-5 text-xl font-black">Starting Total Pay</td>
                  <td className="p-5 text-right text-2xl font-black">{formatCurrency(printData.total)}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="mt-16 pt-5 border-t-2 border-black flex justify-between items-end">
              <div>
                <div className="w-[200px] h-px bg-black mb-2"></div>
                <span className="text-sm font-bold">Authorized Signature</span>
              </div>
              <div className="text-right italic text-xs text-gray-600">
                <p>This is a computer-generated document.</p>
                <p>Generated on {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-6">🧧 Payslip Generation</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <GlassCard className="p-6 border-t-[6px] border-t-coastal-primary">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">📝</span>
            Staff Pay Details
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Select Staff Member
              </label>
              <select
                name="staff_id"
                value={formData.staff_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
              >
                <option value="">-- Select Staff --</option>
                {staffMembers.map((staff: any) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name} ({staff.email})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Base Pay (GHS)"
              type="number"
              name="base_pay"
              value={formData.base_pay || ''}
              onChange={handleChange}
              placeholder="e.g. 2000.00"
            />

            <Input
              label="Allowances (GHS)"
              type="number"
              name="allowances"
              value={formData.allowances || ''}
              onChange={handleChange}
              placeholder="e.g. 500.00"
            />

            <div className="flex gap-4 pt-4">
              <Button
                onClick={onGenerateClick}
                disabled={!formData.staff_id || !formData.base_pay}
                variant="primary"
                className="flex-1 shadow-lg shadow-blue-100"
              >
                ⚙️ Generate
              </Button>

              {isGenerated && (
                <Button
                  onClick={handlePrint}
                  variant="success"
                  className="flex-1 shadow-lg shadow-emerald-100"
                >
                  🖨️ Print / Save
                </Button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Live Preview / Breakdown */}
        <GlassCard className="p-6 bg-gradient-to-br from-gray-50 to-white flex flex-col justify-center border-l-4 border-l-gray-300">
          <h4 className="text-lg font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
            <span>📊</span> Salary Breakdown
          </h4>

          <div className="space-y-6 flex-1">
            <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-gray-500 font-medium">Base Pay</span>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(parseFloat(formData.base_pay) || 0)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-gray-500 font-medium">Allowances</span>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(parseFloat(formData.allowances) || 0)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg border-b-2 border-dashed border-gray-200 pb-6">
              <div>
                <span className="text-gray-500 font-medium block">SSNIT Contribution</span>
                <span className="text-xs text-blue-500 font-bold">(13.5% of Base Pay)</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(ssnitAmount)}
              </span>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100 flex justify-between items-center transform scale-105">
            <span className="text-lg font-black text-gray-700">TOTAL PAYSLIP</span>
            <span className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PayslipSection;