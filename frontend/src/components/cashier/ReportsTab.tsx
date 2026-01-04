import React, { useState, useEffect } from 'react';
import { api, API_BASE_URL } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface Report {
  id: string;
  title: string;
  type: string;
  generated_at: string;
  data: any;
  status: string;
  format?: string;
  report_url?: string | null;
}

const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [reportTemplates, setReportTemplates] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchReports();
    fetchReportTemplates();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('reports/reports/');
      const data = response.data?.results || response.data || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      setMessage({ type: 'error', text: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReportTemplates = async () => {
    try {
      const response = await api.get('reports/templates/');
      const data = response.data?.results || response.data || [];
      setReportTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching report templates:', error);
      setReportTemplates([]);
    }
  };

  const handleDownload = (report: Report) => {
    if (!report.report_url) {
      setMessage({ type: 'error', text: 'Download URL not available for this report' });
      return;
    }

    // Construct full API URL
    const apiBaseUrl = API_BASE_URL;
    let cleanUrl = report.report_url;
    if (cleanUrl.startsWith('/api/')) cleanUrl = cleanUrl.substring(4);
    const downloadUrl = cleanUrl.startsWith('http')
      ? cleanUrl
      : `${apiBaseUrl.replace(/\/$/, '')}${cleanUrl}`;

    // SECURITY: Auth handled by HTTP-only cookies (credentials: 'include')
    // Do NOT use localStorage for token storage - vulnerable to XSS attacks

    fetch(downloadUrl, {
      credentials: 'include' // Cookies are sent automatically
    })
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.title}.${report.format || 'csv'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: `Downloaded ${report.title}` });
      })
      .catch(error => {
        console.error('Download error:', error);
        setMessage({ type: 'error', text: 'Failed to download report' });
      });
  };

  const generateReport = async () => {
    if (!selectedTemplate) {
      setMessage({ type: 'error', text: 'Please select a report template' });
      return;
    }

    try {
      setGenerating(true);
      await api.post('reports/generate/', {
        template_id: selectedTemplate,
        format: selectedFormat
      });
      setMessage({ type: 'success', text: `Report generation started (${selectedFormat.toUpperCase()})` });
      setSelectedTemplate('');
      fetchReports();
    } catch (error) {
      console.error('Error generating report:', error);
      setMessage({ type: 'error', text: 'Failed to generate report' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>📑</span> Reports & Analytics
        </h2>
        <p className="text-gray-500">Generate and view financial and operational reports.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Generate New Report */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Generate New Report</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Report Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
            >
              <option value="">Select a template...</option>
              {reportTemplates.map((template: any) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Format</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
            >
              <option value="pdf">PDF Document</option>
              <option value="csv">CSV Spreadsheet</option>
              <option value="docs">Word Document</option>
            </select>
          </div>
          <Button
            onClick={generateReport}
            disabled={generating || !selectedTemplate}
            variant="success"
            className="w-full md:w-auto h-[50px] shadow-lg shadow-green-100"
          >
            {generating ? 'Generating...' : 'Generate Report 📊'}
          </Button>
        </div>
      </GlassCard>

      {/* Reports List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Available Reports</h3>
          <div className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">{reports.length}</div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-10 text-gray-400 italic">No reports available</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-1">{report.title}</h4>
                    <p className="text-gray-500 text-xs font-mono">
                      {report.type.toUpperCase()} • {new Date(report.generated_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${report.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {report.status}
                  </span>
                </div>

                {/* Simple Table for Report Data Preview */}
                {report.data && report.data.length > 0 && (
                  <div className="mt-4 mb-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                          <tr>
                            {Object.keys(report.data[0]).map(key => (
                              <th key={key} className="px-4 py-2 border-b border-gray-200 whitespace-nowrap">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {report.data.slice(0, 5).map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              {Object.values(row).map((value: any, j: number) => (
                                <td key={j} className="px-4 py-2 whitespace-nowrap text-gray-600">
                                  {typeof value === 'number' && value.toString().includes('.') ? formatCurrencyGHS(value) : value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {report.data.length > 5 && (
                      <div className="bg-gray-50 px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-200 font-medium">
                        Previewing first 5 rows of {report.data.length}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleDownload(report)}
                    variant="primary"
                    disabled={!report.report_url || report.status !== 'completed'}
                    size="sm"
                  >
                    Download {report.format ? report.format.toUpperCase() : 'PDF'} 📥
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ReportsTab;
