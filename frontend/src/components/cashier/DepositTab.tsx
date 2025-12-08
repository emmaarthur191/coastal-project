import React from 'react';
import { PlayfulCard, PlayfulInput, PlayfulButton, THEME } from './CashierTheme';

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
    <PlayfulCard style={{ borderTop: `10px solid ${THEME.colors.success}` }}>
      <h2 style={{ color: THEME.colors.success }}>💰 Make a Deposit</h2>
      <form onSubmit={(e) => handleTransactionSubmit(e, 'Deposit')}>
        <PlayfulInput
          label="Who is depositing?"
          placeholder="Select Member ID..."
          list="member-list"
          value={depositMemberId}
          onChange={(e) => setDepositMemberId(e.target.value)}
        />
        <PlayfulInput
          label="How much money?"
          type="number"
          placeholder="0.00"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <PlayfulButton onClick={() => {}} variant="success" style={{ width: '100%' }}>
          {loading ? 'Processing...' : 'Put Money In! 📥'}
        </PlayfulButton>
      </form>
    </PlayfulCard>
  );
};

export default DepositTab;