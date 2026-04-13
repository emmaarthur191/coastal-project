import React, { useState } from 'react';
import { FraudAlert } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  FolderOpen,
  CheckCircle,
  Calendar,
  Fingerprint,
  Activity,
  History,
  Lock,
  Globe,
  Monitor
} from 'lucide-react';
import { AuditLogRecord, LoginAttemptRecord } from '../../types';

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
  alerts?: FraudAlert[];
  cases?: FraudCase[];
  loginAttempts?: LoginAttemptRecord[];
  auditLogs?: AuditLogRecord[];
  isProcessing?: string | number | null;
  initialTab?: 'alerts' | 'cases' | 'access';

  // Handlers
  onInvestigate?: (id: string | number) => void;
  onConfirmFraud?: (id: string | number) => void;
  onDismissAlert?: (id: string | number) => void;
  onAssignCase?: (id: string | number) => void;
  onCloseCase?: (id: string | number, resolution: string) => void;
}

const SecurityOversight: React.FC<SecurityOversightProps> = ({
  alerts = [],
  cases = [],
  loginAttempts = [],
  auditLogs = [],
  initialTab = 'alerts',
  onInvestigate,
  onConfirmFraud,
  onDismissAlert,
  onAssignCase,
  onCloseCase
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'cases' | 'access'>(initialTab);
  const [filterSeverity, setFilterSeverity] = useState('all');

  // View Expansion State for Access Monitoring
  const [showAllLogins, setShowAllLogins] = useState(false);
  const [showAllAuditLogs, setShowAllAuditLogs] = useState(false);

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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-slate-900/10 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Real-time Fraud Alerts</h3>
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'medium'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${filterSeverity === sev ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
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
            <ShieldAlert className="w-16 h-16 mx-auto mb-4 opacity-10 text-emerald-500" />
            <p className="p-8 text-center text-slate-900 font-black uppercase text-[10px] tracking-widest bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">No security alerts matching your criteria.</p>
          </GlassCard>
        ) : (
          alerts.filter(a => filterSeverity === 'all' || a.severity === filterSeverity).map((alert) => (
            <div key={alert.id} className="p-5 rounded-2xl border-2 border-slate-900/10 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:border-red-500/30 transition-all group">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl ${getSeverityColor(alert.severity || '')} border shadow-sm group-hover:scale-105 transition-transform`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    {alert.message.split('\n')[0]}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getSeverityColor(alert.severity || '')}`}>
                      {alert.severity}
                    </span>
                  </h4>
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mt-1 max-w-xl opacity-80">{alert.message}</p>
                  <div className="flex gap-4 mt-2 text-[10px] font-black text-slate-900/40 uppercase items-center">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(alert.created_at || '').toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> {typeof alert.user === 'object' && alert.user !== null ? (alert.user as { id?: string | number }).id || 'SYSTEM' : (alert.user || 'SYSTEM')}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 md:flex-none h-9 text-xs gap-1.5"
                  onClick={() => onInvestigate?.(alert.id)}
                >
                  <Search className="w-3.5 h-3.5" />
                  Investigate
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1 md:flex-none h-9 text-xs gap-1.5"
                  onClick={() => onConfirmFraud?.(alert.id)}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Confirm
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
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
                    className="flex-1 text-xs gap-1.5"
                    onClick={() => onAssignCase?.(c.id)}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs gap-1.5"
                    onClick={() => onCloseCase?.(c.id, 'resolved')}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Close
                  </Button>
                </div>
              </div>
            )
            ))}
        </div>
      </GlassCard>
    </div>
  );

  const renderAccess = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
      {/* Login Attempts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Login Auditing</h3>
            <p className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest">Real-time authentication feedback loop</p>
          </div>
        </div>

        <GlassCard className="p-0 overflow-hidden border-orange-500/20 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-black/5 bg-slate-50 text-slate-900">
                  <th className="p-4 font-black uppercase tracking-widest">Target Email</th>
                  <th className="p-4 font-black uppercase tracking-widest text-center"><Globe className="w-3 h-3 inline mr-1 capitalize" /> Location</th>
                  <th className="p-4 font-black uppercase tracking-widest text-center"><Monitor className="w-3 h-3 inline mr-1" /> Device</th>
                  <th className="p-4 font-black uppercase tracking-widest text-center">IP Address</th>
                  <th className="p-4 font-black uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 font-black uppercase tracking-widest text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loginAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 italic font-black uppercase text-[10px] tracking-widest">No recent login activity detected</td>
                  </tr>
                ) : (
                  <>
                    {(showAllLogins ? loginAttempts : loginAttempts.slice(0, 5)).map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-black text-slate-900">{attempt.email}</td>
                        <td className="p-4 text-center font-bold text-slate-900">{attempt.location}</td>
                        <td className="p-4 text-center">
                          <span className="bg-slate-100 text-slate-900 px-2 py-1 rounded text-[9px] font-black uppercase border border-slate-200">
                            {attempt.device}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-500">{attempt.ip_address}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-[6px] font-black uppercase text-[9px] ${attempt.success ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                            {attempt.success ? 'Authorized' : 'Rejected'}
                          </span>
                        </td>
                        <td className="p-4 text-right text-slate-900 font-bold">
                          {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {loginAttempts.length > 5 && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <button
                            onClick={() => setShowAllLogins(!showAllLogins)}
                            className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-orange-600/60 hover:text-orange-600 transition-colors bg-orange-50/30"
                          >
                            {showAllLogins ? 'Show Fewer Logins' : `View All Login History (${loginAttempts.length})`}
                          </button>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* System Audit Log Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">System Audit Trail</h3>
            <p className="text-[10px] font-black text-slate-900/40 uppercase tracking-widest">Immutable administrative action history</p>
          </div>
        </div>

        <GlassCard className="p-0 overflow-hidden border-indigo-500/20 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-black/5 bg-slate-50 text-slate-900">
                  <th className="p-4 font-black uppercase tracking-widest">Operator</th>
                  <th className="p-4 font-black uppercase tracking-widest text-center">Action</th>
                  <th className="p-4 font-black uppercase tracking-widest text-center">Resource</th>
                  <th className="p-4 font-black uppercase tracking-widest text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400 italic font-black uppercase text-[10px] tracking-widest">No system events logged</td>
                  </tr>
                ) : (
                  <>
                    {(showAllAuditLogs ? auditLogs : auditLogs.slice(0, 5)).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900">{log.user_name || 'System'}</span>
                            <span className="text-[9px] text-slate-900/40 font-black uppercase tracking-tighter">{log.user_email || 'automated@system'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[9px] font-black uppercase border border-indigo-100">
                            {log.action?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{log.object_repr}</span>
                            <span className="text-[9px] text-slate-900/40 font-black uppercase tracking-widest">{log.model_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-slate-900 font-bold font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length > 5 && (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <button
                            onClick={() => setShowAllAuditLogs(!showAllAuditLogs)}
                            className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-indigo-600/60 hover:text-indigo-600 transition-colors bg-indigo-50/30"
                          >
                            {showAllAuditLogs ? 'Show Fewer Logs' : `View All Audit Logs (${auditLogs.length})`}
                          </button>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Navigation Headers */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-6">
        <div className="flex p-1.5 bg-slate-100/50 backdrop-blur rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'alerts' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-900/40 hover:text-slate-900'}`}
          >
            <ShieldAlert className="w-4 h-4" />
            Fraud Alerts
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'cases' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-900/40 hover:text-slate-900'}`}
          >
            <FolderOpen className="w-4 h-4" />
            Investigations
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'access' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-900/40 hover:text-slate-900'}`}
          >
            <Lock className="w-4 h-4" />
            Access Monitoring
          </button>
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'cases' && renderCases()}
        {activeTab === 'access' && renderAccess()}
      </div>
    </div>
  );
};

export default SecurityOversight;
