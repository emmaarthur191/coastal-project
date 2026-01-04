import React from 'react';
import { Button } from '../ui/Button';
import GlassCard from '../ui/modern/GlassCard';

interface MessagingTabProps {
  onOpenMessaging: () => void;
}

const MessagingTab: React.FC<MessagingTabProps> = ({ onOpenMessaging }) => {
  return (
    <GlassCard className="max-w-2xl mx-auto text-center p-12 flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-blue-100">
        <span className="text-5xl">💬</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Secure Staff Messaging</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Connect securely with your team members, supervisors, and branch managers. All communications are encrypted and logged for compliance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-8">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
          <div className="font-bold text-gray-800 text-sm mb-1">📢 Broadcasts</div>
          <div className="text-xs text-gray-400">Receive important announcements</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
          <div className="font-bold text-gray-800 text-sm mb-1">🆘 Support</div>
          <div className="text-xs text-gray-400">Contact IT or Supervisor</div>
        </div>
      </div>

      <Button
        onClick={onOpenMessaging}
        variant="primary"
        className="px-8 py-4 text-lg shadow-xl shadow-coastal-primary/20 hover:scale-105 transition-transform"
      >
        Launch Messenger 🚀
      </Button>
    </GlassCard>
  );
};

export default MessagingTab;
