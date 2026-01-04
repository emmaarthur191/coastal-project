import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface WithdrawalTabProps {
  withdrawalAmount: string;
  setWithdrawalAmount: React.Dispatch<React.SetStateAction<string>>;
  withdrawalMemberId: string;
  setWithdrawalMemberId: React.Dispatch<React.SetStateAction<string>>;
  members: Member[];
  loading: boolean;
  handleTransactionSubmit: (e: React.FormEvent, type: string) => void;
}

const WithdrawalTab: React.FC<WithdrawalTabProps> = ({
  withdrawalAmount,
  setWithdrawalAmount,
  withdrawalMemberId,
  setWithdrawalMemberId,
  members,
  loading,
  handleTransactionSubmit
}) => {
  return (
    <GlassCard className="max-w-xl mx-auto p-8 border-t-[6px] border-t-red-500">
      <div className="mb-8 text-center">
        <div className="inline-block p-4 rounded-full bg-red-50 mb-4">
          <span className="text-4xl">💸</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">New Withdrawal</h2>
        <p className="text-gray-500 mt-2">Process cash withdrawal from member account</p>
      </div>

      <form onSubmit={(e) => handleTransactionSubmit(e, 'Withdrawal')} className="space-y-6">
        <Input
          label="Member ID / Account"
          placeholder="Select or enter Member ID..."
          list="member-list"
          value={withdrawalMemberId}
          onChange={(e) => setWithdrawalMemberId(e.target.value)}
          required
          className="text-lg"
        />

        <div className="relative">
          <Input
            label="Withdrawal Amount (GHS)"
            type="number"
            placeholder="0.00"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            min="0"
            step="0.01"
            required
            className="text-2xl font-bold text-red-600"
          />
        </div>

        <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800 flex gap-2 items-start">
          <span className="text-lg">⚠️</span>
          <p>Ensure customer identification is verified before dispensing cash. Signature required for amounts over GHS 5,000.</p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="danger"
            className="w-full py-4 text-lg font-bold shadow-lg shadow-red-100/50"
            disabled={loading || !withdrawalMemberId || !withdrawalAmount}
          >
            {loading ? 'Processing Transaction...' : 'Confirm Withdrawal 📤'}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
};

export default WithdrawalTab;
