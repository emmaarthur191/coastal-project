import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, CreateReportTemplateData, CreateReportScheduleData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import ModernStatCard from '../components/ui/modern/ModernStatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ReportTypeEnum } from '../api/models/ReportTypeEnum';
import { ReportTemplate } from '../api/models/ReportTemplate';
import { Report } from '../api/models/Report';
import { ReportSchedule } from '../api/models/ReportSchedule';
import { 
  Plus,
  Play,
  Download,
  ClipboardList,
  FileText,
  Calendar,
  TrendingUp,
  BarChart2,
  Zap,
  Clock,
  Folder
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
        report_type: ReportTypeEnum.FINANCIAL,
        parameters: {}
    });

    const [newSchedule, setNewSchedule] = useState<CreateReportScheduleData>({
        template: '',
        schedule_type: 'daily',
        is_active: true
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
                    value: result.data.total_reports
                },
                {
                    icon: <Zap className="w-10 h-10 text-amber-500" />,
                    metric: 'Reports Generated',
                    value: result.data.generation_stats.total_generated
                },
                {
                    icon: <Clock className="w-10 h-10 text-emerald-500" />,
                    metric: 'Avg Generation Time',
                    value: `${result.data.generation_stats.avg_generation_time.toFixed(2)}s`
                }
            ];
            setAnalytics(analyticsItems);
        }
    };

    const handleCreateTemplate = async () => {
        const result = await authService.createReportTemplate(newTemplate);
        if (result.success && result.data) {
            setReportTemplates([...reportTemplates, result.data]);
            setNewTemplate({ name: '', description: '', report_type: ReportTypeEnum.FINANCIAL, parameters: {} });
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


    const handleGenerateReport = async (templateId: string | number) => {
        const result = await authService.generateReport(templateId);
        if (result.success) {
            alert('Report generated successfully!');
            fetchReports();
        } else {
            alert('Failed to generate report: ' + result.error);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = [
        { id: 'templates', name: 'Templates', icon: <ClipboardList className="w-5 h-5 text-indigo-500" /> },
        { id: 'reports', name: 'Archive', icon: <FileText className="w-5 h-5 text-blue-500" /> },
        { id: 'schedules', name: 'Scheduled', icon: <Calendar className="w-5 h-5 text-amber-500" /> },
        { id: 'analytics', name: 'Insights', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> }
    ];

    const renderContent = () => {
        if (loading) {
            return (
                <GlassCard className="flex flex-col items-center justify-center p-12">
                    <BarChart2 className="w-16 h-16 mb-4 animate-pulse text-blue-600" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tighter">Loading Reports...</h2>
                </GlassCard>
            );
        }

        switch (activeView) {
            case 'templates':
                return (
                    <div className="space-y-6">
                        <GlassCard className="p-6 border-t-[6px] border-t-primary-500">
                            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tighter">
                                <Plus className="w-6 h-6 text-primary-600" /> 
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
                                    <label htmlFor="report-type-select" className="block text-xs font-black text-slate-900 mb-2 ml-1 uppercase tracking-tight">Type</label>
                                    <div className="relative">
                                        <select
                                            id="report-type-select"
                                            value={newTemplate.report_type}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, report_type: e.target.value as ReportTypeEnum })}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border border-slate-400 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all appearance-none font-bold text-slate-900"
                                        >
                                            {Object.values(ReportTypeEnum).map((type) => (
                                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900 font-black">▼</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-black text-slate-900 mb-2 ml-1 uppercase tracking-tight">Description</label>
                                <textarea
                                    placeholder="Describe the purpose of this report template..."
                                    value={newTemplate.description}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-400 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900 min-h-[100px] resize-y placeholder-slate-500"
                                />
                            </div>
                            <Button onClick={handleCreateTemplate} variant="primary" className="gap-2">
                                <ClipboardList className="w-4 h-4" />
                                Create Template
                            </Button>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Available Templates</h3>
                            {reportTemplates.length === 0 ? (
                                <p className="text-gray-400 italic">No templates created yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {reportTemplates.map((template) => (
                                        <div key={template.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-black text-slate-900 text-lg tracking-tight">{template.name}</h4>
                                                <span className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                                    {template.report_type_display}
                                                </span>
                                            </div>
                                            <p className="text-slate-900 text-sm font-medium mb-4 line-clamp-2">{template.description}</p>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleGenerateReport(template.id)}
                                                className="w-full gap-2"
                                            >
                                                <Play className="w-4 h-4" />
                                                Generate Report
                                            </Button>
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
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Folder className="w-6 h-6 text-blue-500" />
                            Generated Reports
                        </h3>
                        <div className="space-y-4">
                            {reports.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    No reports generated yet.
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div key={report.id} className="flex flex-col md:flex-row justify-between items-center p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="mb-4 md:mb-0">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-8 h-8 text-blue-500" />
                                                <h4 className="font-bold text-gray-800 text-lg">{report.template_name}</h4>
                                            </div>
                                            <p className="text-xs text-black ml-11 mt-1 font-bold tracking-tight">
                                                Generated: <span className="font-mono text-slate-900 font-bold">{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`
                            px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider
                            ${report.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                                                {report.status}
                                            </span>
                                            <Button
                                                size="sm"
                                                onClick={() => window.open(report.file_url, '_blank')}
                                                disabled={report.status !== 'completed'}
                                                variant="primary"
                                                className="gap-2"
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
                        <GlassCard className="p-6 border-t-[6px] border-t-amber-400">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Schedule New Report</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="template-select" className="block text-sm font-bold text-gray-700 mb-1 ml-1">Template</label>
                                    <div className="relative">
                                        <select
                                            id="template-select"
                                            value={newSchedule.template}
                                            onChange={(e) => setNewSchedule({ ...newSchedule, template: e.target.value })}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-4 focus:ring-amber-50 focus:border-amber-400 outline-none transition-all appearance-none font-medium text-gray-700"
                                        >
                                            <option value="">Select Template</option>
                                            {reportTemplates.map(template => (
                                                <option key={template.id} value={template.id}>{template.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="frequency-select" className="block text-sm font-bold text-gray-700 mb-1 ml-1">Frequency</label>
                                    <div className="relative">
                                        <select
                                            id="frequency-select"
                                            value={newSchedule.schedule_type}
                                            onChange={(e) => setNewSchedule({ ...newSchedule, schedule_type: e.target.value })}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-4 focus:ring-amber-50 focus:border-amber-400 outline-none transition-all appearance-none font-medium text-gray-700"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleCreateSchedule} variant="primary" className="gap-2">
                                <Calendar className="w-4 h-4" />
                                Create Schedule
                            </Button>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Active Schedules</h3>
                            <div className="space-y-4">
                                {reportSchedules.map((schedule) => (
                                    <div key={schedule.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg mb-1">{schedule.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                                                <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-xs font-black">{schedule.frequency_display}</span>
                                                <span className="font-bold">•</span>
                                                <span>Next run: <span className="font-bold text-black">{schedule.next_run ? new Date(schedule.next_run).toLocaleDateString() : 'Never'}</span></span>
                                            </div>
                                        </div>
                                        <div className={`
                        px-3 py-1 rounded-full text-xs font-bold uppercase
                        ${schedule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                    `}>
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
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
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
                        <div className="mt-8 p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                            <p className="text-gray-400 font-medium">Detailed usage charts coming soon.</p>
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
