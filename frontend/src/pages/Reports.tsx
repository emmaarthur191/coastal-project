import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/modern/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DashboardLayout from '../components/layout/DashboardLayout';

function Reports() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('templates');
    const [loading, setLoading] = useState(true);
    const [reportTemplates, setReportTemplates] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [reportSchedules, setReportSchedules] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any[]>([]);

    // Form states
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        template_type: 'financial',
        config: {}
    });

    const [newSchedule, setNewSchedule] = useState({
        template: '',
        name: '',
        schedule_type: 'daily',
        config: {}
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
        if (result.success) setReportTemplates(result.data);
    };

    const fetchReports = async () => {
        const result = await authService.getReports();
        if (result.success) setReports(result.data);
    };

    const fetchSchedules = async () => {
        const result = await authService.getReportSchedules();
        if (result.success) setReportSchedules(result.data);
    };

    const fetchAnalytics = async () => {
        const result = await authService.getReportAnalytics();
        if (result.success) setAnalytics(result.data);
    };

    const handleCreateTemplate = async () => {
        const result = await authService.createReportTemplate(newTemplate);
        if (result.success) {
            setReportTemplates([...reportTemplates, result.data]);
            setNewTemplate({ name: '', description: '', template_type: 'financial', config: {} });
            alert('Report template created successfully!');
        } else {
            alert('Failed to create template: ' + result.error);
        }
    };

    const handleCreateSchedule = async () => {
        const result = await authService.createReportSchedule(newSchedule);
        if (result.success) {
            setReportSchedules([...reportSchedules, result.data]);
            setNewSchedule({ template: '', name: '', schedule_type: 'daily', config: {} });
            alert('Report schedule created successfully!');
        } else {
            alert('Failed to create schedule: ' + result.error);
        }
    };


    const handleGenerateReport = async (templateId: string) => {
        const result = await authService.generateReport({ template: templateId });
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
        { id: 'templates', name: 'Templates', icon: '📋' },
        { id: 'reports', name: 'Reports', icon: '📊' },
        { id: 'schedules', name: 'Schedules', icon: '⏰' },
        { id: 'analytics', name: 'Analytics', icon: '📈' }
    ];

    const renderContent = () => {
        if (loading) {
            return (
                <GlassCard className="flex flex-col items-center justify-center p-12">
                    <div className="text-6xl mb-4 animate-bounce-slow">📊</div>
                    <h2 className="text-xl font-bold text-gray-800">Loading Reports...</h2>
                </GlassCard>
            );
        }

        switch (activeView) {
            case 'templates':
                return (
                    <div className="space-y-6">
                        <GlassCard className="p-6 border-t-[6px] border-t-emerald-500">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <span>➕</span> Create New Template
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
                                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Type</label>
                                    <div className="relative">
                                        <select
                                            value={newTemplate.template_type}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, template_type: e.target.value })}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none transition-all appearance-none font-medium text-gray-700"
                                        >
                                            <option value="financial">Financial</option>
                                            <option value="operational">Operational</option>
                                            <option value="compliance">Compliance</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Description</label>
                                <textarea
                                    placeholder="Describe the purpose of this report template..."
                                    value={newTemplate.description}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none transition-all font-medium text-gray-700 min-h-[100px] resize-y"
                                />
                            </div>
                            <Button onClick={handleCreateTemplate} variant="primary">
                                Create Template 📋
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
                                                <h4 className="font-bold text-gray-800 text-lg">{template.name}</h4>
                                                <span className="px-2 py-1 rounded-lg bg-gray-100 text-xs font-bold uppercase text-gray-500">
                                                    {template.template_type}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleGenerateReport(template.id)}
                                                className="w-full"
                                            >
                                                Generate Report 🚀
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
                            <span>📂</span> Generated Reports
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
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">📄</span>
                                                <h4 className="font-bold text-gray-800 text-lg">{report.name}</h4>
                                            </div>
                                            <p className="text-sm text-gray-500 ml-8 mt-1">
                                                Generated: <span className="font-medium text-gray-700">{new Date(report.created_at).toLocaleDateString()}</span>
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
                                            >
                                                Download 📥
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Template</label>
                                    <div className="relative">
                                        <select
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

                                <Input
                                    label="Schedule Name"
                                    type="text"
                                    placeholder="e.g. Daily Operations"
                                    value={newSchedule.name}
                                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                                />

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Frequency</label>
                                    <div className="relative">
                                        <select
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
                            <Button onClick={handleCreateSchedule} variant="warning" className="text-white">
                                Create Schedule ⏰
                            </Button>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Active Schedules</h3>
                            <div className="space-y-4">
                                {reportSchedules.map((schedule) => (
                                    <div key={schedule.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg mb-1">{schedule.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs font-bold">{schedule.schedule_type}</span>
                                                <span>•</span>
                                                <span>Next run: {new Date(schedule.next_run).toLocaleDateString()}</span>
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
                            <span>📈</span> Report Analytics
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analytics.map((item, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
                                    <div className="text-4xl mb-4 opacity-90">{item.icon || '📊'}</div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{item.metric}</h4>
                                    <p className="text-4xl font-black text-coastal-primary">{item.value}</p>
                                </div>
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
