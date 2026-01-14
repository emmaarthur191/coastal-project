import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

interface Payslip {
    id: number;
    month: number;
    year: number;
    pay_period_start: string;
    pay_period_end: string;
    gross_pay: string;
    net_salary: string;
    is_paid: boolean;
    created_at: string;
}

const StaffPayslipViewer: React.FC = () => {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        month: '',
        year: new Date().getFullYear().toString()
    });

    const months = [
        { value: '', label: 'All Months' },
        { value: '1', label: 'January' },
        { value: '2', label: 'February' },
        { value: '3', label: 'March' },
        { value: '4', label: 'April' },
        { value: '5', label: 'May' },
        { value: '6', label: 'June' },
        { value: '7', label: 'July' },
        { value: '8', label: 'August' },
        { value: '9', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    const fetchMyPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.month) queryParams.append('month', filters.month);
            if (filters.year) queryParams.append('year', filters.year);

            const response = await api.get<Payslip[]>(`operations/payslips/my_payslips/?${queryParams.toString()}`);
            setPayslips(Array.isArray(response.data) ? response.data : []);
            setError('');
        } catch (err) {
            console.error('Error fetching payslips:', err);
            setError('Failed to load payslips.');
        } finally {
            setLoading(false);
        }
    }, [filters.month, filters.year]);

    useEffect(() => {
        fetchMyPayslips();
    }, [fetchMyPayslips]);

    const handleDownload = async (id: number, month: number, year: number) => {
        try {
            const response = await api.get<Blob>(`operations/payslips/${id}/download/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payslip_${month}_${year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download payslip.');
        }
    };

    const getMonthName = (month: number) => {
        return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(parseFloat(amount));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">📄 My Payslips</h2>

            {error && (
                <div className="bg-error-50 text-error-700 p-4 rounded-lg mb-6 border border-error-200">
                    {error}
                </div>
            )}

            <div className="flex flex-wrap gap-4 mb-6 bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Month</label>
                    <select
                        value={filters.month}
                        onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                        aria-label="Filter by month"
                        title="Month Filter"
                        className="w-full p-2 rounded-lg border border-secondary-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
                    >
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-secondary-500 uppercase mb-1">Year</label>
                    <select
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        aria-label="Filter by year"
                        title="Year Filter"
                        className="w-full p-2 rounded-lg border border-secondary-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-secondary-500">Loading payslips...</div>
            ) : payslips.length === 0 ? (
                <div className="text-center py-12 bg-secondary-50 rounded-lg border border-dashed border-secondary-300">
                    <p className="text-secondary-500 font-medium">No payslips available yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary-50 border-b border-secondary-200">
                                <th className="p-4 font-bold text-secondary-700">Period</th>
                                <th className="p-4 font-bold text-secondary-700 text-right">Gross Pay</th>
                                <th className="p-4 font-bold text-secondary-700 text-right">Net Take Home</th>
                                <th className="p-4 font-bold text-secondary-700 text-center">Status</th>
                                <th className="p-4 font-bold text-secondary-700 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.map((payslip) => (
                                <tr key={payslip.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-secondary-900">{getMonthName(payslip.month)} {payslip.year}</div>
                                        <div className="text-xs text-secondary-500">{payslip.pay_period_start} to {payslip.pay_period_end}</div>
                                    </td>
                                    <td className="p-4 text-right font-mono text-secondary-700">
                                        {formatCurrency(payslip.gross_pay)}
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-success-700">
                                        {formatCurrency(payslip.net_salary)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${payslip.is_paid
                                            ? 'bg-success-100 text-success-700'
                                            : 'bg-warning-100 text-warning-700'
                                            }`}>
                                            {payslip.is_paid ? 'PAID' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleDownload(payslip.id, payslip.month, payslip.year)}
                                            className="text-primary-600 hover:text-primary-800 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                                        >
                                            <span>📥</span> Download PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StaffPayslipViewer;
