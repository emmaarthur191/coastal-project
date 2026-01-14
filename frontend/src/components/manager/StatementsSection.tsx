import React, { useState, useEffect } from 'react';
import { authService, AccountWithDetails } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StatementsSectionProps {
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleGenerateStatement: () => void;
}

const StatementsSection: React.FC<StatementsSectionProps> = ({
  formData,
  setFormData,
  handleGenerateStatement
}) => {
  const [generating, setGenerating] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithDetails[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await authService.getStaffAccounts();
        if (response.success && response.data) {
          setAccounts(response.data);
        }
      } catch (error) {
        console.error('Error fetching accounts for statements:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      handleGenerateStatement();
      setGenerating(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span>📜</span> Account Statements
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generation Form */}
        <GlassCard className="p-6 border-t-[6px] border-t-blue-600">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">🛠️</span>
            Generate New Statement
          </h4>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="account_number"
                className="block text-sm font-semibold text-gray-700 mb-1 ml-1"
              >
                Select Account
              </label>
              <select
                id="account_number"
                name="account_number"
                title="Select Account"
                value={formData.account_number || ''}
                onChange={handleChange}
                disabled={loadingAccounts}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {loadingAccounts ? 'Loading accounts...' : '-- Choose Account --'}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.account_number}>
                    {account.account_number} - {account.user?.full_name} ({account.account_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleChange}
              />

              <Input
                label="End Date"
                type="date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleChange}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!formData.account_number || !formData.start_date || generating}
              variant="primary"
              className="w-full py-4 shadow-lg shadow-blue-100 flex justify-center items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>📄 Generate PDF</>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Info / Preview Panel */}
        <GlassCard className="p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-50 to-white">
          <div className="text-6xl mb-6 opacity-80 animate-bounce-slow">🖨️</div>

          <h4 className="text-xl font-bold text-gray-800 mb-4">
            Ready to Print
          </h4>

          <p className="max-w-xs text-gray-500 leading-relaxed mb-8">
            Select an account and date range to generate a comprehensive PDF statement including all transactions, fees, and interest applied.
          </p>

          <div className="w-full max-w-sm p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm text-left flex gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <strong className="block mb-1">Note:</strong>
              Statements are generated in PDF format and will be automatically downloaded to your device.
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default StatementsSection;
