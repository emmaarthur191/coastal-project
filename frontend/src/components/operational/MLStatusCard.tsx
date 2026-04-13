import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Bot, BarChart3, Brain, Zap } from 'lucide-react';
import { MLModelStatus } from '../../services/api';
import './MLStatusCard.css';

interface MLStatusCardProps {
  status: MLModelStatus | null;
  onRetrain: () => Promise<void>;
  loading?: boolean;
}

const MLStatusCard: React.FC<MLStatusCardProps> = ({ status, onRetrain }) => {
  const [retraining, setRetraining] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current && status) {
      progressRef.current.style.width = `${status.accuracy_proxy || 99.4}%`;
    }
  }, [status]);

  const handleRetrain = async () => {
    setRetraining(true);
    await onRetrain();
    setRetraining(false);
  };

  if (!status) {
    return (
      <GlassCard className="p-8 text-center bg-white border-2 border-slate-300">
        <Bot className="w-12 h-12 mx-auto mb-3 text-slate-900" />
        <p className="text-slate-900 font-black tracking-widest uppercase text-[10px]">Initializing ML Engine Status...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-0 overflow-hidden border-indigo-500/20 shadow-xl shadow-indigo-500/5">
      <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden">
        {/* Abstract background shape */}
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 block">Core Infrastructure</span>
            <h3 className="text-2xl font-black tracking-tight">AI Fraud Engine</h3>
          </div>
          <div className="ml-engine-badge">
            V4.2.0-STABLE (FINANCIAL HARDENED)
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Model Pulse</p>
            <div className="flex items-center gap-2">
              <div className={`ml-status-dot ${status.status}`}></div>
              <span className="text-lg font-black uppercase tracking-tighter">{status.status}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Last Sync</p>
            <p className="text-xs font-bold">{status.last_trained ? new Date(status.last_trained).toLocaleDateString() : 'Initial State'}</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 bg-white/80 backdrop-blur-sm">
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 transition-all hover:bg-slate-50 hover:shadow-md">
          <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">Patterns Logged</p>
          <p className="text-xl font-black text-slate-900 tabular-nums">{status.total_processed.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 transition-all hover:bg-rose-50 hover:shadow-md">
          <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">Anomalies Detected</p>
          <p className="text-xl font-black text-rose-700 tabular-nums">{status.anomalies_detected.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 bg-white/80 backdrop-blur-sm">
        <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Model Precision Confidence</span>
                <span className="text-xs font-black text-indigo-700">{status.accuracy_proxy || 99.4}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                    ref={progressRef}
                    className="ml-status-card-progress" 
                ></div>
            </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="secondary"
            onClick={() => window.open('/reports/ml-behavior', '_blank')}
            className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 flex items-center justify-center gap-2"
          >
            Detailed Analytics <BarChart3 className="w-3.5 h-3.5" />
          </Button>
          <Button 
            onClick={handleRetrain}
            className="flex-1 font-black uppercase tracking-widest text-[10px] py-4 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {status.status === 'training' || retraining ? (
              <>Learning... <Brain className="w-3.5 h-3.5 animate-pulse" /></>
            ) : (
              <>Retrain Engine <Zap className="w-3.5 h-3.5" /></>
            )}
          </Button>
        </div>
        
        <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
          Experimental AI Service • Authorized Personnel Only
        </p>
      </div>
    </GlassCard>
  );
};

export default MLStatusCard;
