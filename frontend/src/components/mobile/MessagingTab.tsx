import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { ShieldCheck, MessageSquare } from 'lucide-react';

interface MessagingTabProps {
  onOpenComms: () => void;
}

const MessagingTab: React.FC<MessagingTabProps> = ({ onOpenComms }) => {
  return (
    <GlassCard className="text-center p-10 bg-blue-50/50 border-blue-100">
      <div className="flex justify-center mb-4">
        <ShieldCheck className="w-16 h-16 text-coastal-primary" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Secure Agent Chat</h3>
      <p className="text-gray-600 mb-6 font-medium">Talk to HQ securely directly from the field.</p>
      <Button onClick={onOpenComms} variant="primary" className="mx-auto px-8 flex items-center gap-2">
        Open Comms <MessageSquare className="w-4 h-4" />
      </Button>
    </GlassCard>
  );
};

export default MessagingTab;
