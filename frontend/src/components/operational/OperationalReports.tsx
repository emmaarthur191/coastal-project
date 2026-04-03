import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface ReportParams {
  type: string;
  format: 'pdf' | 'csv';
  date_from: string;
  date_to: string;
}

interface OperationalReportsProps {
  reportParams: ReportParams;
  onParamsChange: (params: ReportParams) => void;
  onGenerateReport: () => void;
  isGenerating?: boolean;
}

const OperationalReports: React.FC<OperationalReportsProps> = ({
  reportParams,
  onParamsChange,
  onGenerateReport,
  isGenerating = false
}) => {
  return (
    <div className="space-y-8">
      <GlassCard className="p-8 border-t-[8px] border-t-emerald-500 shadow-xl">
        <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
          <span className="p-2 bg-emerald-100 rounded-xl">📑</span> 
          On-Demand Financial Reporting
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Report Domain</label>
            <select
              title="Report Domain"
              value={reportParams.type}
              onChange={(e) => onParamsChange({ ...reportParams, type: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none bg-gray-50 text-sm font-bold text-gray-700 appearance-none shadow-sm"
            >
              <option value="transactions">Transaction Ledger</option>
              <option value="loans">Loan Portfolio</option>
              <option value="cash_advances">Cash Advance Registry</option>
              <option value="audit_logs">System Audit Logs</option>
            </select>
          </div>
          
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 ml-1">Export Format</label>
            <div className="flex p-1.5 bg-gray-100 rounded-2xl shadow-inner h-[54px] items-center">
              <button
                onClick={() => onParamsChange({ ...reportParams, format: 'pdf' })}
                className={`flex-1 h-full text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${reportParams.format === 'pdf' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Adobe PDF
              </button>
              <button
                onClick={() => onParamsChange({ ...reportParams, format: 'csv' })}
                className={`flex-1 h-full text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${reportParams.format === 'csv' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Excel CSV
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Input 
              label="Start Date" 
              type="date" 
              className="h-[54px] rounded-2xl bg-gray-50 border-gray-100"
              value={reportParams.date_from} 
              onChange={(e) => onParamsChange({ ...reportParams, date_from: e.target.value })} 
            />
          </div>
          
          <div className="lg:col-span-1">
            <Input 
              label="End Date" 
              type="date" 
              className="h-[54px] rounded-2xl bg-gray-50 border-gray-100"
              value={reportParams.date_to} 
              onChange={(e) => onParamsChange({ ...reportParams, date_to: e.target.value })} 
            />
          </div>

          <div className="lg:col-span-1">
            <Button 
              className="w-full h-[54px] rounded-2xl shadow-emerald-200 shadow-lg text-xs font-black uppercase tracking-widest" 
              onClick={onGenerateReport} 
              disabled={isGenerating}
            >
              {isGenerating ? 'Compiling...' : 'Export Now 📥'}
            </Button>
          </div>
        </div>
        
        <p className="mt-8 pt-6 border-t border-gray-50 text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
          <span>🔒</span> All reports are automatically watermarked and logged for security auditing.
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Tax Compliant', icon: '📝', desc: 'Ready for official filing' },
          { title: 'Binary Encoded', icon: '⚡', desc: 'Secure direct stream export' },
          { title: 'Full Traceability', icon: '🔗', desc: 'Includes Maker-Checker IDs' }
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="text-3xl p-3 bg-gray-50 rounded-2xl">{item.icon}</div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
              <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationalReports;
