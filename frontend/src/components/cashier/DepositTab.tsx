import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface DepositTabProps {
  depositAmount: string;
  setDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  depositMemberId: string;
  setDepositMemberId: React.Dispatch<React.SetStateAction<string>>;
  members: Member[];
  loading: boolean;
  handleTransactionSubmit: (e: React.FormEvent, type: string) => void;
}

const DepositTab: React.FC<DepositTabProps> = ({
  depositAmount,
  setDepositAmount,
  depositMemberId,
  setDepositMemberId,
  members,
  loading,
  handleTransactionSubmit
}) => {
  return (
    <GlassCard className="max-w-xl mx-auto p-8 border-t-[6px] border-t-emerald-500">
      <div className="mb-8 text-center">
        <div className="inline-block p-4 rounded-full bg-emerald-50 mb-4">
          <span className="text-4xl">💰</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">New Deposit</h2>
        <p className="text-gray-500 mt-2">Process cash deposit to member account</p>
      </div>

      <form onSubmit={(e) => handleTransactionSubmit(e, 'Deposit')} className="space-y-6">
        <Input
          label="Member ID / Account"
          placeholder="Select or enter Member ID..."
          list="member-list"
          value={depositMemberId}
          onChange={(e) => setDepositMemberId(e.target.value)}
          required
          className="text-lg"
        />

        <div className="relative">
          <Input
            label="Deposit Amount (GHS)"
            type="number"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min="0"
            step="0.01"
            required
            className="text-2xl font-bold text-emerald-600"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="success"
            className="w-full py-4 text-lg font-bold shadow-lg shadow-emerald-100/50"
            disabled={loading || !depositMemberId || !depositAmount}
          >
            {loading ? 'Processing Transaction...' : 'Confirm Deposit 📥'}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4">
          Transaction will be recorded immediately. Ensure cash is counted.
        </p>
      </form>
    </GlassCard>
  );
};

export default DepositTab;