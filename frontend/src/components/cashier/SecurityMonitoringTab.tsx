import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

const SecurityMonitoringTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🛡️</span> Security Monitoring
        </h2>
        <p className="text-gray-500">View security logs and active sessions.</p>
      </div>

      <GlassCard className="p-12 text-center border-t-[6px] border-t-purple-500">
        <div className="mx-auto w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <span className="text-5xl">🔒</span>
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Security Dashboard</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          This module will provide real-time security insights, login history, and threat detection.
          Currently under development.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My IP Address</div>
            <div className="font-mono font-bold text-gray-700">192.168.1.105</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Login</div>
            <div className="font-mono font-bold text-gray-700">{new Date().toLocaleDateString()}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Security Status</div>
            <div className="text-emerald-500 font-bold flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Secure
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={() => alert('Full security report feature coming soon!')}>
          Download Activity Log (Demo)
        </Button>
      </GlassCard>
    </div>
  );
};

export default SecurityMonitoringTab;
