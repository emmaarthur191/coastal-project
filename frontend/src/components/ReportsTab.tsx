import React from 'react';
import { formatCurrencyGHS } from '../utils/formatters';
import GlassCard from './ui/modern/GlassCard';
import { Button } from './ui/Button';

interface ReportsTabProps {
  handleGenerateReport: (reportType: string) => void;
  authService: any;
  reportData?: any;
  setReportData?: React.Dispatch<React.SetStateAction<any>>;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ handleGenerateReport, authService, reportData, setReportData }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span>🧾</span> Report Generation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            type: 'daily_transaction',
            title: 'Daily Transaction Report',
            description: 'Comprehensive daily transaction summary',
            icon: '📊',
            color: 'blue'
          },
          {
            type: 'system_performance',
            title: 'System Performance Report',
            description: 'System uptime and performance metrics',
            icon: '⚡',
            color: 'amber'
          },
          {
            type: 'staff_activity',
            title: 'Staff Activity Report',
            description: 'Staff productivity and activity logs',
            icon: '👥',
            color: 'emerald'
          },
          {
            type: 'security_audit',
            title: 'Security Audit Report',
            description: 'Security incidents and compliance status',
            icon: '🔒',
            color: 'red'
          }
        ].map((report, index) => (
          <button
            key={index}
            onClick={() => handleGenerateReport(report.type)}
            className={`
                group text-left p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                bg-white border-gray-200 hover:border-${report.color}-300 hover:bg-${report.color}-50/30
            `}
          >
            <div className={`text-3xl mb-4 p-3 rounded-xl inline-block bg-${report.color}-100 text-${report.color}-600`}>
              {report.icon}
            </div>
            <h4 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-coastal-primary transition-colors">
              {report.title}
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              {report.description}
            </p>
          </button>
        ))}
      </div>

      {reportData && (
        <GlassCard className="p-0 overflow-hidden animate-fade-in-up border-t-[6px] border-t-coastal-primary">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h4 className="text-xl font-bold text-gray-800">
                {reportData.report_type}
              </h4>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Period: <span className="text-gray-700">{reportData.period}</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setReportData && setReportData(null)}
              className="shadow-sm"
            >
              Close Report ✕
            </Button>
          </div>

          <div className="p-8">
            {/* Daily Transaction Report */}
            {reportData.report_type === 'Daily Transaction Report' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-6 rounded-2xl text-center border border-blue-100">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-3xl font-black text-gray-800 mb-1">{reportData.total_transactions?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Transactions</div>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-2xl text-center border border-emerald-100">
                    <div className="text-4xl mb-2">💰</div>
                    <div className="text-3xl font-black text-emerald-600 mb-1">{formatCurrencyGHS(reportData.total_volume || 0)}</div>
                    <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Volume</div>
                  </div>
                </div>

                {reportData.by_type && (
                  <div>
                    <h5 className="font-bold text-gray-800 mb-4 ml-1">Breakdown by Type</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(reportData.by_type).map(([type, data]: [string, any]) => (
                        <div key={type} className="p-4 rounded-xl border border-gray-200 hover:border-blue-200 bg-white transition-colors">
                          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{type}</div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-xs text-gray-400">Count</div>
                              <div className="font-bold text-gray-800">{data.count?.toLocaleString() || 0}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400">Volume</div>
                              <div className="font-bold text-coastal-primary">{formatCurrencyGHS(data.volume || 0)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Performance Report */}
            {reportData.report_type === 'System Performance Report' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-3xl mb-3">⏱️</div>
                  <div className="text-2xl font-black text-blue-600 mb-1">{reportData.uptime}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase">System Uptime</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <div className="text-2xl font-black text-gray-800 mb-1">{reportData.avg_response_time}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Avg Response</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-3xl mb-3">📈</div>
                  <div className="text-2xl font-black text-gray-800 mb-1">{reportData.total_requests?.toLocaleString() || 0}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Total Requests</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <div className="text-3xl mb-3">❌</div>
                  <div className="text-2xl font-black text-red-500 mb-1">{reportData.failed_requests?.toLocaleString() || 0}</div>
                  <div className="text-xs text-gray-400 font-bold uppercase">Failed Requests</div>
                </div>
              </div>
            )}

            {/* Staff Activity Report */}
            {reportData.report_type === 'Staff Activity Report' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-indigo-100">
                  <div className="text-4xl mb-4 opacity-80">👥</div>
                  <div className="text-4xl font-black mb-1">{reportData.total_staff || 0}</div>
                  <div className="text-indigo-100 font-medium">Total Staff Members</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-emerald-100">
                  <div className="text-4xl mb-4 opacity-80">🟢</div>
                  <div className="text-4xl font-black mb-1">{reportData.active_staff || 0}</div>
                  <div className="text-emerald-100 font-medium">Currently Active</div>
                </div>
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 text-white text-center shadow-lg shadow-gray-200">
                  <div className="text-4xl mb-4 opacity-80">📊</div>
                  <div className="text-4xl font-black mb-1">{reportData.transactions_processed?.toLocaleString() || 0}</div>
                  <div className="text-gray-300 font-medium">Transactions Processed</div>
                </div>
              </div>
            )}

            {/* Security Audit Report */}
            {reportData.report_type === 'Security Audit Report' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-2xl bg-red-50 border border-red-100 text-center">
                  <div className="text-3xl mb-2">🚨</div>
                  <div className="text-2xl font-black text-red-600 mb-1">{reportData.failed_login_attempts || 0}</div>
                  <div className="text-xs font-bold text-red-400 uppercase">Failed Logins</div>
                </div>
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-2xl font-black text-amber-600 mb-1">{reportData.suspicious_activities || 0}</div>
                  <div className="text-xs font-bold text-amber-400 uppercase">Suspicious Activity</div>
                </div>
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <div className="text-3xl mb-2">🛡️</div>
                  <div className="text-2xl font-black text-gray-800 mb-1">{reportData.security_incidents || 0}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase">Incidents</div>
                </div>
                <div className={`
                    p-6 rounded-2xl border text-center
                    ${reportData.compliance_status === 'Compliant' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}
                 `}>
                  <div className="text-3xl mb-2">
                    {reportData.compliance_status === 'Compliant' ? '✅' : '❌'}
                  </div>
                  <div className={`text-xl font-black mb-1 ${reportData.compliance_status === 'Compliant' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {reportData.compliance_status}
                  </div>
                  <div className="text-xs font-bold opacity-60 uppercase">Compliance</div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default ReportsTab;
