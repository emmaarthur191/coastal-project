import React from 'react';
import { PlayfulCard, PlayfulInput, PlayfulButton, THEME } from './CashierTheme';

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
    <PlayfulCard style={{ borderTop: `10px solid ${THEME.colors.danger}` }}>
      <h2 style={{ color: THEME.colors.danger }}>💸 Make a Withdrawal</h2>
      <form onSubmit={(e) => handleTransactionSubmit(e, 'Withdrawal')}>
        <PlayfulInput
          label="Who is taking money?"
          placeholder="Select Member ID..."
          list="member-list"
          value={withdrawalMemberId}
          onChange={(e) => setWithdrawalMemberId(e.target.value)}
        />
        <PlayfulInput
          label="How much?"
          type="number"
          placeholder="0.00"
          value={withdrawalAmount}
          onChange={(e) => setWithdrawalAmount(e.target.value)}
        />
        <PlayfulButton onClick={() => {}} variant="danger" style={{ width: '100%' }}>
          {loading ? 'Processing...' : 'Take Money Out! 📤'}
        </PlayfulButton>
      </form>
    </PlayfulCard>
  );
};

export default WithdrawalTab;