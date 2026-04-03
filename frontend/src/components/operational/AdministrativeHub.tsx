import React, { useState } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Account, Complaint } from '../../services/api';

interface AdministrativeHubProps {
  view: 'accounts' | 'complaints';
  accounts?: Account[];
  complaints?: Complaint[];
  onCreateComplaint?: (complaint: { subject: string; description: string; category: string; priority: string }) => void;
  loading?: boolean;
}

const AdministrativeHub: React.FC<AdministrativeHubProps> = ({
  view,
  accounts = [],
  complaints = [],
  onCreateComplaint,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    description: '',
    category: 'service',
    priority: 'medium'
  });

  const filteredAccounts = accounts.filter(acc =>
    acc.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.account_number && acc.account_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredComplaints = complaints.filter(c =>
    c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (view === 'accounts') {
    return (
      <GlassCard className="p-6 border-t-[6px] border-t-indigo-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏦</span> Active Accounts Overview
          </h3>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest whitespace-nowrap">
              {filteredAccounts.length} Filtered
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded-3xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map((acc) => (
              <div key={acc.id} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                    {acc.account_type_display || acc.account_type}
                  </p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">
                  ${acc.calculated_balance?.toLocaleString() || '0.00'}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400">ID: {acc.id}</span>
                  {acc.account_number && <span className="text-[10px] font-black text-indigo-500">#{acc.account_number}</span>}
                  <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline text-left mt-2">View History →</button>
                </div>
              </div>
            ))}
            {filteredAccounts.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 italic bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                No matching accounts found.
              </div>
            )}
          </div>
        )}
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 border-t-[6px] border-t-rose-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🚨</span> Incident & Complaint Logging
          </h3>
          <Input
            placeholder="Search recent logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest mb-2">Internal Protocol</h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Log all staff performance issues, technical errors, or customer escalations here. High priority items will trigger a manager notification.
              </p>
            </div>

            <Input
              label="Subject"
              type="text"
              placeholder="e.g., Transaction Error"
              value={newComplaint.subject}
              onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                title="Select Category"
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                value={newComplaint.category}
                onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
              >
                <option value="service">Customer Service</option>
                <option value="technical">Technical Issue</option>
                <option value="fraud">Fraud Suspicion</option>
                <option value="staff">Staff Performance</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                title="Select Priority"
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <Button
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-200 text-xs font-black uppercase tracking-widest"
              onClick={() => {
                onCreateComplaint?.(newComplaint);
                setNewComplaint({ subject: '', description: '', category: 'service', priority: 'medium' });
              }}
            >
              Log Incident 🚀
            </Button>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Logs</h4>
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                </div>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredComplaints.length > 0 ? (
                  <div className="space-y-3">
                    {filteredComplaints.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-slate-800 text-sm">{c.subject}</h5>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            c.priority === 'high' || c.priority === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {c.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{c.description || 'No description provided.'}</p>
                        <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 capitalize">{c.category} • {new Date(c.created_at || '').toLocaleDateString()}</span>
                          <span className="text-[10px] font-black text-rose-600 uppercase italic">Status: {c.status || 'open'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-sm text-slate-400 font-medium italic">No matching incidents found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdministrativeHub;
