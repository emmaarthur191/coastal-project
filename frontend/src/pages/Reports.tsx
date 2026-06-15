import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  api,
  authService,
  CreateReportTemplateData,
  CreateReportScheduleData,
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import GlassCard from '../components/ui/modern/GlassCard';
import ModernStatCard from '../components/ui/modern/ModernStatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DashboardLayout from '../components/layout/DashboardLayout';
import type { ReportTypeEnum } from '../api/types.gen';
import type { ReportTemplate } from '../api/types.gen';
import type { Report } from '../api/types.gen';
import type { ReportSchedule } from '../api/types.gen';
import {
  Plus,
  Play,
  Download,
  ClipboardList,
  FileText,
  FileSpreadsheet,
  Calendar,
  TrendingUp,
  BarChart2,
  Zap,
  Clock,
  Folder,
  ChevronDown,
} from 'lucide-react';

interface ReportAnalyticsItem {
  icon?: React.ReactNode;
  metric: string;
  value: string | number;
}

function Reports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportSchedules, setReportSchedules] = useState<ReportSchedule[]>([]);
  const [analytics, setAnalytics] = useState<ReportAnalyticsItem[]>([]);

  // Form states
  const [newTemplate, setNewTemplate] = useState<CreateReportTemplateData>({
    name: '',
    description: '',
    report_type: 'financial',
    parameters: {},
  });

  const [newSchedule, setNewSchedule] = useState<CreateReportScheduleData>({
    template: '',
    schedule_type: 'daily',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeView) {
        case 'templates':
          await fetchTemplates();
          break;
        case 'reports':
          await fetchReports();
          break;
        case 'schedules':
          await fetchSchedules();
          break;
        case 'analytics':
          await fetchAnalytics();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (fileUrl: string, reportId: number | string) => {
    const resolvedUrl = fileUrl?.startsWith('/reports/download/') ? `/api${fileUrl}` : fileUrl;
    if (resolvedUrl) {
      const toastId = toast.loading('Initiating secure PDF download...');
      try {
        const filename =
          resolvedUrl.substring(resolvedUrl.lastIndexOf('/') + 1) || `report_${reportId}.pdf`;
        const apiPath = resolvedUrl.startsWith('/api/') ? resolvedUrl.substring(5) : resolvedUrl;
        const response = await api.get<Blob>(apiPath, { responseType: 'blob' as unknown });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const localUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = localUrl;
        link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(localUrl);
        toast.success('Report downloaded successfully!', { id: toastId });
      } catch (err) {
        console.error('Failed to download report:', err);
        toast.error('Download failed. Ensure the report has completed processing.', {
          id: toastId,
        });
      }
    }
  };

  const fetchTemplates = async () => {
    const result = await authService.getReportTemplates();
    if (result.success && result.data) setReportTemplates(result.data);
  };

  const fetchReports = async () => {
    const result = await authService.getReports();
    if (result.success && result.data) setReports(result.data);
  };

  const fetchSchedules = async () => {
    const result = await authService.getReportSchedules();
    if (result.success && result.data) setReportSchedules(result.data);
  };

  const fetchAnalytics = async () => {
    const result = await authService.getReportAnalytics();
    if (result.success && result.data) {
      // Transform ReportAnalytics object into ReportAnalyticsItem array
      const analyticsItems: ReportAnalyticsItem[] = [
        {
          icon: <BarChart2 className="w-10 h-10 text-blue-500" />,
          metric: 'Total Reports',
          value: result.data.total_reports,
        },
        {
          icon: <Zap className="w-10 h-10 text-amber-500" />,
          metric: 'Reports Generated',
          value: result.data.generation_stats.total_generated,
        },
        {
          icon: <Clock className="w-10 h-10 text-emerald-500" />,
          metric: 'Avg Generation Time',
          value: `${result.data.generation_stats.avg_generation_time.toFixed(2)}s`,
        },
      ];
      setAnalytics(analyticsItems);
    }
  };

  const handleCreateTemplate = async () => {
    const result = await authService.createReportTemplate(newTemplate);
    if (result.success && result.data) {
      setReportTemplates([...reportTemplates, result.data]);
      setNewTemplate({ name: '', description: '', report_type: 'financial', parameters: {} });
      alert('Report template created successfully!');
    } else {
      alert('Failed to create template: ' + result.error);
    }
  };

  const handleCreateSchedule = async () => {
    const result = await authService.createReportSchedule(newSchedule);
    if (result.success && result.data) {
      setReportSchedules([...reportSchedules, result.data]);
      setNewSchedule({ template: '', schedule_type: 'daily', is_active: true });
      alert('Report schedule created successfully!');
    } else {
      alert('Failed to create schedule: ' + result.error);
    }
  };

  const handleGenerateReport = async (
    templateId: string | number,
    format: 'pdf' | 'xlsx' = 'pdf'
  ) => {
    const result = await authService.generateReport(templateId, format);
    if (result.success) {
      if (format === 'xlsx' && result.blob) {
        // Trigger browser download for the XLSX blob
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'financial_report.xlsx';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Excel report downloaded successfully!');
      } else {
        toast.success('Report generated successfully!');
      }
      fetchReports();
    } else {
      toast.error('Failed to generate report: ' + (result.error || 'Unknown error'));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      id: 'templates',
      name: 'Templates',
      icon: <ClipboardList className="w-5 h-5 text-indigo-500" />,
    },
    { id: 'reports', name: 'Archive', icon: <FileText className="w-5 h-5 text-blue-500" /> },
    { id: 'schedules', name: 'Scheduled', icon: <Calendar className="w-5 h-5 text-amber-500" /> },
    {
      id: 'analytics',
      name: 'Insights',
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <GlassCard className="flex flex-col items-center justify-center p-12">
          <BarChart2 className="w-16 h-16 mb-4 animate-pulse text-blue-600 dark:text-amber-500" />
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
            Loading Reports...
          </h2>
        </GlassCard>
      );
    }

    switch (activeView) {
      case 'templates':
        return (
          <div className="space-y-6">
            <GlassCard className="p-6 border-t-[6px] border-t-blue-500 dark:border-t-amber-500">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 tracking-tighter">
                <Plus className="w-6 h-6 text-blue-600 dark:text-amber-500" />
                Create New Template
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  type="text"
                  placeholder="e.g. Monthly Revenue Summary"
                  label="Template Name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
                <div>
                  <label
                    htmlFor="report-type-select"
                    className="block text-xs font-black text-slate-800 dark:text-slate-300 mb-2 ml-1 uppercase tracking-tight"
                  >
                    Type
                  </label>
                  <div className="relative">
                    <select
                      id="report-type-select"
                      value={newTemplate.report_type}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          report_type: e.target.value as ReportTypeEnum,
                        })
                      }
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-amber-900/25 focus:border-blue-500 dark:focus:border-amber-500 outline-none transition-all appearance-none font-bold text-slate-800 dark:text-slate-100"
                    >
                      {[
                        { value: 'transaction', label: 'Transaction' },
                        { value: 'account', label: 'Account' },
                        { value: 'loan', label: 'Loan' },
                        { value: 'cash_advance', label: 'Cash Advance' },
                        { value: 'fraud', label: 'Fraud' },
                        { value: 'compliance', label: 'Compliance' },
                        { value: 'financial', label: 'Financial' },
                        { value: 'audit', label: 'Audit' },
                        { value: 'performance', label: 'Performance' },
                      ].map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-800 dark:text-slate-200 font-black">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-300 mb-2 ml-1 uppercase tracking-tight">
                  Description
                </label>
                <textarea
                  placeholder="Describe the purpose of this report template..."
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-amber-900/25 focus:border-blue-500 dark:focus:border-amber-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 min-h-[100px] resize-y placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <Button
                onClick={handleCreateTemplate}
                variant="primary"
                className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950"
              >
                <ClipboardList className="w-4 h-4" />
                Create Template
              </Button>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                Available Templates
              </h3>
              {reportTemplates.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 italic font-medium">
                  No templates created yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reportTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-lg tracking-tight truncate">
                          {template.name}
                        </h4>
                        <span className="px-2 py-1 rounded-lg bg-slate-900 dark:bg-amber-600 text-white dark:text-black text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                          {template.report_type_display}
                        </span>
                      </div>
                      <p className="text-slate-650 dark:text-slate-400 text-sm font-medium mb-4 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleGenerateReport(template.id, 'pdf')}
                          className="flex-1 gap-2 hover:bg-blue-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-black transition-all"
                        >
                          <Play className="w-4 h-4" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleGenerateReport(template.id, 'xlsx')}
                          className="flex-1 gap-2 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-black transition-all"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Excel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        );

      case 'reports':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 tracking-tighter">
              <Folder className="w-6 h-6 text-blue-500 dark:text-amber-500" />
              Generated Reports Archive
            </h3>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/60 font-medium">
                  No reports generated yet.
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col md:flex-row justify-between items-center p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-lg transition-all duration-300 gap-4"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="p-3 bg-blue-50 dark:bg-amber-950/20 text-blue-600 dark:text-amber-500 rounded-xl">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 dark:text-white text-lg tracking-tight truncate">
                          {report.template_name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">
                          Generated:{' '}
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                            {report.created_at
                              ? new Date(report.created_at).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <span
                        className={`
                                                px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border
                                                ${
                                                  report.status === 'completed'
                                                    ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-250/20'
                                                    : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-250/20'
                                                }
                                            `}
                      >
                        {report.status}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadReport(report.file_url || '', report.id)}
                        disabled={report.status !== 'completed'}
                        variant="primary"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 transition-all shadow-sm hover:shadow"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        );

      case 'schedules':
        return (
          <div className="space-y-6">
            <GlassCard className="p-6 border-t-[6px] border-t-blue-500 dark:border-t-amber-500">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                Schedule New Report
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="template-select"
                    className="block text-sm font-bold text-slate-800 dark:text-slate-300 mb-1 ml-1"
                  >
                    Template
                  </label>
                  <div className="relative">
                    <select
                      id="template-select"
                      value={newSchedule.template}
                      onChange={(e) => setNewSchedule({ ...newSchedule, template: e.target.value })}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-amber-900/25 focus:border-blue-500 dark:focus:border-amber-500 outline-none transition-all appearance-none font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="">Select Template</option>
                      {reportTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="frequency-select"
                    className="block text-sm font-bold text-slate-800 dark:text-slate-300 mb-1 ml-1"
                  >
                    Frequency
                  </label>
                  <div className="relative">
                    <select
                      id="frequency-select"
                      value={newSchedule.schedule_type}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, schedule_type: e.target.value })
                      }
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-4 focus:ring-blue-100 dark:focus:ring-amber-900/25 focus:border-blue-500 dark:focus:border-amber-500 outline-none transition-all appearance-none font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCreateSchedule}
                variant="primary"
                className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950"
              >
                <Calendar className="w-4 h-4" />
                Create Schedule
              </Button>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">
                Active Schedules
              </h3>
              <div className="space-y-4">
                {reportSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-amber-500/50 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-lg mb-1">
                        {schedule.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-bold">
                        <span className="capitalize px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-black tracking-wider text-slate-700 dark:text-slate-350">
                          {schedule.frequency_display}
                        </span>
                        <span className="font-bold">•</span>
                        <span>
                          Next run:{' '}
                          <span className="text-slate-800 dark:text-slate-200 font-bold">
                            {schedule.next_run
                              ? new Date(schedule.next_run).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div
                      className={`
                                            px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border
                                            ${
                                              schedule.is_active
                                                ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-250/20'
                                                : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-250/20'
                                            }
                                        `}
                    >
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        );

      case 'analytics':
        return (
          <GlassCard className="p-6">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              Report Analytics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.map((item, index) => (
                <ModernStatCard
                  key={index}
                  label={item.metric}
                  value={item.value}
                  icon={item.icon || <BarChart2 className="w-6 h-6" />}
                  trend="neutral"
                />
              ))}
            </div>
            <div className="mt-8 p-8 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50 text-center flex flex-col items-center justify-center">
              <p className="text-slate-400 dark:text-slate-500 font-extrabold text-xs uppercase tracking-widest">
                Detailed usage charts coming soon.
              </p>
            </div>
          </GlassCard>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Reports Hub"
      user={user}
      menuItems={menuItems}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

export default Reports;
