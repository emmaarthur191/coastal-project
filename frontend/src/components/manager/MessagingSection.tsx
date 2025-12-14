import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

interface MessagingSectionProps {
  onOpenMessaging: () => void;
}

const MessagingSection: React.FC<MessagingSectionProps> = ({ onOpenMessaging }) => {
  return (
    <GlassCard className="p-0 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-t-[6px] border-t-blue-500">
      <div className="text-center p-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10">
          <div className="text-8xl mb-6 animate-bounce-slow drop-shadow-sm inline-block">💬</div>
          <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">Secure Staff Messaging</h3>
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            Connect instantly with your team in a secure, encrypted environment.
          </p>

          <Button
            onClick={onOpenMessaging}
            size="lg"
            className="px-10 py-4 text-base shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 hover:-translate-y-1 transition-all duration-300"
            variant="primary"
          >
            Open Chat Room 🚀
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default MessagingSection;