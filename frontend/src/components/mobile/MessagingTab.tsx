import React from 'react';
import { PlayfulCard, PlayfulButton } from './MobileTheme';

interface MessagingTabProps {
  onOpenComms: () => void;
}

const MessagingTab: React.FC<MessagingTabProps> = ({ onOpenComms }) => {
  return (
    <PlayfulCard color="#E3F2FD" style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '60px' }}>🔒</div>
      <h3>Secret Agent Chat</h3>
      <p>Talk to HQ securely.</p>
      <PlayfulButton onClick={onOpenComms} style={{ margin: '0 auto' }}>Open Comms</PlayfulButton>
    </PlayfulCard>
  );
};

export default MessagingTab;