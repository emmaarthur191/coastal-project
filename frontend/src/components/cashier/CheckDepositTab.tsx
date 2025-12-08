import React from 'react';
import { PlayfulCard, PlayfulInput, PlayfulButton, THEME } from './CashierTheme';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface CheckDepositTabProps {
  checkDepositAmount: string;
  setCheckDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  checkDepositMemberId: string;
  setCheckDepositMemberId: React.Dispatch<React.SetStateAction<string>>;
  checkDepositAccountType: string;
  setCheckDepositAccountType: React.Dispatch<React.SetStateAction<string>>;
  frontImage: File | null;
  setFrontImage: React.Dispatch<React.SetStateAction<File | null>>;
  backImage: File | null;
  setBackImage: React.Dispatch<React.SetStateAction<File | null>>;
  members: Member[];
  loading: boolean;
  handleCheckDepositSubmit: (e: React.FormEvent) => void;
}

const CheckDepositTab: React.FC<CheckDepositTabProps> = ({
  checkDepositAmount,
  setCheckDepositAmount,
  checkDepositMemberId,
  setCheckDepositMemberId,
  checkDepositAccountType,
  setCheckDepositAccountType,
  frontImage,
  setFrontImage,
  backImage,
  setBackImage,
  members,
  loading,
  handleCheckDepositSubmit
}) => {
  return (
    <PlayfulCard style={{ borderTop: `10px solid ${THEME.colors.warning}` }}>
      <h2 style={{ color: '#D35400' }}>📄 Check Deposit</h2>
      <form onSubmit={handleCheckDepositSubmit}>
        <PlayfulInput
          label="Member ID"
          value={checkDepositMemberId}
          onChange={e => setCheckDepositMemberId(e.target.value)}
          list="member-list"
        />
        <PlayfulInput
          label="Check Amount"
          type="number"
          value={checkDepositAmount}
          onChange={e => setCheckDepositAmount(e.target.value)}
        />
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '15px', margin: '15px 0', border: '3px dashed #ccc', textAlign: 'center' }}>
          <label style={{ display: 'block', cursor: 'pointer', fontWeight: 'bold' }}>
            📸 Upload Front Photo
            <input type="file" onChange={e => setFrontImage(e.target.files?.[0] || null)} style={{ display: 'none' }} />
          </label>
          {frontImage && <span style={{color: 'green'}}>File Selected!</span>}
        </div>
        <PlayfulButton onClick={() => {}} variant="primary" style={{ background: THEME.colors.warning, color: '#000', width: '100%' }}>
          {loading ? 'Scanning...' : 'Deposit Check!'}
        </PlayfulButton>
      </form>
    </PlayfulCard>
  );
};

export default CheckDepositTab;