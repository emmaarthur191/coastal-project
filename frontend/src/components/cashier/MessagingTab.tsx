import React from 'react';
import { PlayfulCard, PlayfulButton } from './CashierTheme';

interface MessagingTabProps {
  onOpenMessaging: () => void;
}

const MessagingTab: React.FC<MessagingTabProps> = ({ onOpenMessaging }) => {
  return (
    <PlayfulCard color="#F0F8FF">
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontSize: '80px', marginBottom: '16px' }}>💬</div>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Secure Staff Messaging</h3>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>Top Secret chats with your team! 🕵️</p>
        <PlayfulButton onClick={onOpenMessaging}>
          Open Chat Room 🚀
        </PlayfulButton>
      </div>
    </PlayfulCard>
  );
};

export default MessagingTab;