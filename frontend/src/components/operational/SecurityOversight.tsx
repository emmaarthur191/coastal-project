import React, { useState } from 'react';
import { FraudAlert } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

interface FraudCase {
  id: number;
  case_number: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  created_at: string;
  primary_account_details?: { owner_name?: string; account_number?: string };
  estimated_loss?: number;
}

interface SecurityOversightProps {
  view: 'alerts' | 'cases' | 'rules';
  alerts?: FraudAlert[];
  cases?: FraudCase[];
  isProcessing?: string | number | null;
  
  // Handlers
  onInvestigate?: (id: string | number) => void;
  onConfirmFraud?: (id: string | number) => void;
  onDismissAlert?: (id: string | number) => void;
  onAssignCase?: (id: string | number) => void;
  onCloseCase?: (id: string | number, resolution: string) => void;
}

const SecurityOversight: React.FC<SecurityOversightProps> = ({
  view,
  alerts = [],
  cases = [],
  isProcessing = null,
  onInvestigate,
  onConfirmFraud,
  onDismissAlert,
  onAssignCase,
  onCloseCase
}) => {
  const [filterSeverity, setFilterSeverity] = useState('all');

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800">Real-time Fraud Alerts</h3>
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'medium'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${
                filterSeverity === sev ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity).length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="text-5xl mb-4 opacity-20">🛡️</div>
            <p className="text-gray-500 font-medium">No alerts matching your criteria.</p>
          </GlassCard>
        ) : (
          alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity).map((alert) => (
            <div key={alert.id} className="p-4 rounded-2xl border border-red-50 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:border-red-200 transition-all group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getSeverityColor(alert.severity || '')} border shadow-sm group-hover:scale-105 transition-transform`}>
                  🚨
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    {alert.message.split('\n')[0]}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getSeverityColor(alert.severity || '')}`}>
                      {alert.severity}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">{alert.message}</p>
                  <div className="flex gap-4 mt-2 text-[10px] font-bold text-gray-400 uppercase">
                    <span>📅 {new Date(alert.created_at || '').toLocaleDateString()}</span>
                    <span>🆔 Transaction: {typeof alert.user === 'object' ? (alert.user as any)?.id : alert.user || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="flex-1 md:flex-none h-9 text-xs"
                  onClick={() => onInvestigate?.(alert.id)}
                >
                  Investigate 🔍
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  className="flex-1 md:flex-none h-9 text-xs"
                  onClick={() => onConfirmFraud?.(alert.id)}
                >
                  Confirm 🛡️
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                   className="flex-1 md:flex-none h-9 text-xs text-gray-400 border-gray-200 hover:bg-gray-50"
                  onClick={() => onDismissAlert?.(alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCases = () => (
    <div className="space-y-6">
      <GlassCard className="p-6 border-t-[6px] border-t-indigo-600">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Active Investigation Cases</h3>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
            Total Open: {cases.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.length === 0 ? (
            <p className="col-span-full text-center py-12 text-gray-400 italic">No active fraud cases.</p>
          ) : (
            cases.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg group-hover:text-indigo-600">
                      {c.title || `Case #${c.case_number}`}
                    </h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">
                      Priority: <span className={c.priority === 'critical' ? 'text-red-500' : 'text-amber-500'}>{c.priority}</span>
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase">
                    {c.status}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-4 line-clamp-3">
                  {c.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] mb-6">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-gray-400 uppercase font-black mb-1">Account Owner</p>
                    <p className="text-gray-700 font-bold">{c.primary_account_details?.owner_name || 'Unknown'}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-gray-400 uppercase font-black mb-1">Estimated Loss</p>
                    <p className="text-red-600 font-bold">${c.estimated_loss?.toLocaleString() || '0.00'}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={() => onAssignCase?.(c.id)}
                  >
                    Manage 📁
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 text-xs"
                    onClick={() => onCloseCase?.(c.id, 'resolved')}
                  >
                    Close ✅
                  </Button>
                </div>
              </div>
            )
          ))}
        </div>
      </GlassCard>
    </div>
  );

  switch (view) {
    case 'alerts': return renderAlerts();
    case 'cases': return renderCases();
    default: return <div className="text-center py-20 text-gray-400">Section coming soon...</div>;
  }
};

export default SecurityOversight;
