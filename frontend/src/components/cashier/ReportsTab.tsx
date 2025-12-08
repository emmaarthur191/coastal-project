import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput } from './CashierTheme';
import { api } from '../../services/api.ts';
import { formatCurrencyGHS } from '../../utils/formatters';

interface Report {
  id: string;
  title: string;
  type: string;
  generated_at: string;
  data: any;
  status: string;
}

const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
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
      setReports(response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setMessage({ type: 'error', text: 'Failed to load reports' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReportTemplates = async () => {
    try {
      const response = await api.get('reports/templates/');
      setReportTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching report templates:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedTemplate) {
      setMessage({ type: 'error', text: 'Please select a report template' });
      return;
    }

    try {
      setGenerating(true);
      await api.post('reports/generate/', { template_id: selectedTemplate });
      setMessage({ type: 'success', text: 'Report generation started' });
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
    return (
      <PlayfulCard>
        <h2>📑 Reports</h2>
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="200px" style={{ marginTop: '20px' }} />
      </PlayfulCard>
    );
  }

  return (
    <PlayfulCard>
      <h2>📑 Reports</h2>
      <p>Generate and view financial and operational reports.</p>

      {message.text && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
          color: message.type === 'error' ? '#C62828' : '#2E7D32',
          border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Generate New Report */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '2px dashed #DFE6E9', borderRadius: '12px' }}>
        <h3>Generate New Report</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Report Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #DFE6E9',
                fontSize: '16px'
              }}
            >
              <option value="">Select a template...</option>
              {reportTemplates.map((template: any) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
          <PlayfulButton
            onClick={generateReport}
            disabled={generating || !selectedTemplate}
            variant="success"
          >
            {generating ? 'Generating...' : 'Generate Report 📊'}
          </PlayfulButton>
        </div>
      </div>

      {/* Reports List */}
      <div>
        <h3>Available Reports ({reports.length})</h3>
        {reports.length === 0 ? (
          <p style={{ color: '#636E72', fontStyle: 'italic' }}>No reports available</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {reports.map((report) => (
              <div key={report.id} style={{
                border: '1px solid #DFE6E9',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2D3436' }}>{report.title}</h4>
                    <p style={{ margin: '0', color: '#636E72', fontSize: '14px' }}>
                      Type: {report.type} • Generated: {new Date(report.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: report.status === 'completed' ? '#00B894' : '#FDCB6E'
                  }}>
                    {report.status.toUpperCase()}
                  </span>
                </div>

                {/* Simple Table for Report Data */}
                {report.data && report.data.length > 0 && (
                  <div style={{ marginTop: '15px', maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8F9FA' }}>
                          {Object.keys(report.data[0]).map(key => (
                            <th key={key} style={{ padding: '8px', textAlign: 'left', border: '1px solid #DFE6E9' }}>
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.data.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i}>
                            {Object.values(row).map((value: any, j: number) => (
                              <td key={j} style={{ padding: '8px', border: '1px solid #DFE6E9' }}>
                                {typeof value === 'number' && value.toString().includes('.') ? formatCurrencyGHS(value) : value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {report.data.length > 10 && <p style={{ fontSize: '12px', color: '#636E72', marginTop: '10px' }}>Showing first 10 rows</p>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <PlayfulButton onClick={() => {/* Download logic */}} variant="primary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                    Download 📥
                  </PlayfulButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PlayfulCard>
  );
};

export default ReportsTab;