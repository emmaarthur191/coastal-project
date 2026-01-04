import React, { useState } from 'react';
import { authService } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface InterestSectionProps {
  interestData: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount);
};

const InterestSection: React.FC<InterestSectionProps> = ({ interestData: initialData }) => {
  const [formData, setFormData] = useState({
    principal: '',
    rate: '',
    months: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await authService.calculateInterest(formData);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Calculation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span>📈</span> Interest Calculations
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <GlassCard className="p-6 border-t-[6px] border-t-purple-500">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">🔢</span>
            Loan & Savings Interest
          </h4>

          <form onSubmit={handleCalculate} className="space-y-5">
            <Input
              label="Principal Amount (GHS)"
              type="number"
              name="principal"
              value={formData.principal}
              onChange={handleChange}
              required
              placeholder="0.00"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Annual Rate (%)"
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                required
                placeholder="e.g. 5.5"
                step="0.01"
              />

              <Input
                label="Duration (Months)"
                type="number"
                name="months"
                value={formData.months}
                onChange={handleChange}
                required
                placeholder="e.g. 12"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full py-3 shadow-lg shadow-purple-100 bg-purple-600 hover:bg-purple-700 border-purple-700 text-white"
            >
              {loading ? 'Calculating...' : 'Calculate Interest'}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
        </GlassCard>

        {/* Results Panel */}
        <GlassCard className={`p-8 flex flex-col justify-center transition-all duration-500 ${result ? 'opacity-100' : 'opacity-80'}`}>
          {!result ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-6xl mb-4 grayscale opacity-30">📉</div>
              <p className="max-w-xs mx-auto">Enter loan or savings details to project interest earnings or costs.</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <h4 className="text-lg font-bold text-gray-800 mb-6 text-center">
                Projection Result
              </h4>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                  <span className="text-gray-500 font-medium">Interest Earned/Due</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(parseFloat(result.interest_amount))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Est. Monthly Payment</span>
                  <span className="text-xl font-bold text-gray-800">{formatCurrency(parseFloat(result.monthly_repayment))}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-2xl text-center shadow-xl shadow-purple-200 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="text-9xl">💰</span>
                </div>

                <div className="relative z-10">
                  <div className="text-sm font-bold text-purple-200 mb-2 uppercase tracking-widest">Total Repayment Amount</div>
                  <div className="text-4xl font-black tracking-tight">
                    {formatCurrency(parseFloat(result.total_amount))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default InterestSection;
