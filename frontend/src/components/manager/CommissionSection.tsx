import React, { useState } from 'react';
import { authService } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CommissionSectionProps {
  commissionData: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount);
};

const CommissionSection: React.FC<CommissionSectionProps> = ({ commissionData: initialData }) => {
  const [formData, setFormData] = useState({
    agent_id: '',
    amount: ''
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
      const response = await authService.calculateCommission(formData);
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
        <span>🤝</span> Commission Management
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <GlassCard className="p-6 border-t-[6px] border-t-amber-500">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-sm">🧮</span>
            Commission Calculator
          </h4>

          <form onSubmit={handleCalculate} className="space-y-5">
            <Input
              label="Agent ID (Optional)"
              type="text"
              name="agent_id"
              value={formData.agent_id}
              onChange={handleChange}
              placeholder="e.g. AGT-001"
            />

            <Input
              label="Transaction Amount (GHS)"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              placeholder="0.00"
              className="text-lg font-bold"
            />

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full py-3 shadow-lg shadow-amber-100 bg-amber-500 hover:bg-amber-600 border-amber-600 text-white"
            >
              {loading ? 'Calculating...' : 'Run Calculation'}
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
              <div className="text-6xl mb-4 grayscale opacity-30">🤖</div>
              <p className="max-w-xs mx-auto">Enter a transaction amount to calculate the agent commission.</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <h4 className="text-lg font-bold text-gray-800 mb-6 text-center">
                Calculation Result
              </h4>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Transaction</span>
                  <span className="text-lg font-bold text-gray-800">{formatCurrency(parseFloat(result.transaction_amount))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Applied Rate</span>
                  <span className="text-lg font-bold text-blue-600">{result.commission_rate}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-2xl text-center shadow-xl shadow-amber-200 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="text-9xl">🎁</span>
                </div>

                <div className="relative z-10">
                  <div className="text-sm font-bold text-amber-100 mb-2 uppercase tracking-widest">Commission Amount</div>
                  <div className="text-4xl font-black tracking-tight">
                    {formatCurrency(parseFloat(result.commission_amount))}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center text-xs text-gray-400 font-medium">
                Calculated at: {new Date(result.calculated_at).toLocaleTimeString()}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default CommissionSection;