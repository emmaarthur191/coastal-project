import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

interface MessagingTabProps {
  onOpenComms: () => void;
}

const MessagingTab: React.FC<MessagingTabProps> = ({ onOpenComms }) => {
  return (
    <GlassCard className="text-center p-10 bg-blue-50/50 border-blue-100">
      <div className="text-6xl mb-4">🔒</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Secure Agent Chat</h3>
      <p className="text-gray-600 mb-6 font-medium">Talk to HQ securely directly from the field.</p>
      <Button onClick={onOpenComms} variant="primary" className="mx-auto px-8">
        Open Comms 💬
      </Button>
    </GlassCard>
  );
};

export default MessagingTab;
