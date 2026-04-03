import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import ModernStatCard from '../ui/modern/ModernStatCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export interface Expense {
    id?: number;
    category: string;
    amount: string | number;
    description: string;
    date?: string;
}

export interface CashFlowResponse {
    inflow: { total: number; deposits: number; [key: string]: number };
    outflow: { total: number; withdrawals: number; [key: string]: number };
    net_cash_flow: number;
    period: string;
}

export interface CalculatedValue {
    id?: number;
    label: string;
    value: string | number;
    type: string;
}

interface FinancialOperationsHubProps {
    initialTab?: 'expenses' | 'payroll' | 'cash-flow' | 'analysis' | 'statements';
    mode?: 'manager' | 'staff';
}

const FinancialOperationsHub: React.FC<FinancialOperationsHubProps> = ({
    initialTab = 'expenses',
    mode = 'staff'
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Financial States
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlowResponse | null>(null);
    const [analysis, setAnalysis] = useState<CalculatedValue | null>(null);

    // Form States
    const [newExpense, setNewExpense] = useState({ category: 'Utilities', amount: '', description: '' });
    const [payrollData, setPayrollData] = useState({ staff_id: '', month: 'April', year: '2026' });
    const [statementData, setStatementData] = useState({ account_number: '', start_date: '', end_date: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'expenses') {
                const res = await authService.getExpenses();
                if (res.success) setExpenses(res.data as Expense[] || []);
            } else if (activeTab === 'cash-flow') {
                const res = await authService.getCashFlow();
                if (res.success) setCashFlow(res.data as CashFlowResponse);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch financial data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await authService.createExpense(newExpense as any);
        if (res.success) {
            setNewExpense({ category: 'Utilities', amount: '', description: '' });
            fetchData();
        }
        setLoading(false);
    };

    const renderExpenses = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
                <h4 className="text-lg font-bold mb-6">Record New Expense</h4>
                <form onSubmit={handleCreateExpense} className="space-y-4">
                    <Input as="select" 
                        label="Category" 
                        value={newExpense.category} 
                        title="Select expense category"
                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                    >
                        <option value="Utilities">Utilities</option>
                        <option value="Rent">Rent</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Other">Other</option>
                    </Input>
                    <Input label="Amount (GHS)" type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                    <Input label="Description" required value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                    <Button type="submit" disabled={loading} className="w-full">Save Expense</Button>
                </form>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-sm text-gray-500 uppercase tracking-widest">Recent Expenses</div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                    {expenses.map((ex, i) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div>
                                <div className="font-bold text-gray-800">{ex.description}</div>
                                <div className="text-xs text-gray-400 capitalize">{ex.category} • {ex.date}</div>
                            </div>
                            <div className="font-black text-red-500">GHS {Number(ex.amount).toLocaleString()}</div>
                        </div>
                    ))}
                    {expenses.length === 0 && <div className="p-12 text-center text-gray-400 italic">No expenses recorded yet.</div>}
                </div>
            </GlassCard>
        </div>
    );

    const renderPayroll = () => (
        <GlassCard className="p-8 max-w-2xl mx-auto border-t-[8px] border-t-emerald-500">
            <h3 className="text-xl font-black text-gray-800 mb-2">Staff Payslip Generation</h3>
            <p className="text-sm text-gray-500 mb-8 text-center px-4">Generate and authorize official employee payslips for the current payroll cycle.</p>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Payroll Gen Triggered (MOCK)'); }}>
                <Input label="Staff Member ID" placeholder="e.g. CA001" required value={payrollData.staff_id} onChange={e => setPayrollData({ ...payrollData, staff_id: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <Input as="select" 
                        label="Month" 
                        value={payrollData.month} 
                        title="Select payroll month"
                        onChange={e => setPayrollData({ ...payrollData, month: e.target.value })}
                    >
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                    </Input>
                    <Input label="Year" type="number" value={payrollData.year} onChange={e => setPayrollData({ ...payrollData, year: e.target.value })} />
                </div>
                <Button type="submit" variant="primary" className="w-full py-4 text-lg shadow-xl shadow-emerald-100">Generate & Download Payslip 📄</Button>
            </form>
        </GlassCard>
    );

    const renderCashFlow = () => {
        if (!cashFlow) return <div className="text-center p-12 text-gray-400">No cash flow data available.</div>;
        const currencyColor = cashFlow.net_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-500';

        return (
            <div className="space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800">
                            GH₵{Math.abs(cashFlow.net_cash_flow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h2>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Net Cash Flow ({cashFlow.period})</div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-xs font-black uppercase ${cashFlow.net_cash_flow >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                        {cashFlow.net_cash_flow >= 0 ? 'Surplus' : 'Deficit'}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ModernStatCard 
                        label="Total Inflow" 
                        value={`GH₵${cashFlow.inflow.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                        icon={<span>💰</span>} 
                        trend="up"
                        subtext={`Deposits: GH₵${cashFlow.inflow.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    />
                    <ModernStatCard 
                        label="Total Outflow" 
                        value={`GH₵${cashFlow.outflow.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                        icon={<span>💸</span>} 
                        trend="down"
                        subtext={`Withdrawals: GH₵${cashFlow.outflow.withdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    />
                </div>
            </div>
        );
    };

    const renderAnalysis = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-8 border-t-[6px] border-t-amber-500">
                <h4 className="text-lg font-bold mb-4">Interest Accrual Projection</h4>
                <p className="text-xs text-gray-500 mb-6">Calculate estimated interest payouts for all active savings accounts.</p>
                <Button className="w-full" variant="secondary">Run Calculation 🧮</Button>
            </GlassCard>
            <GlassCard className="p-8 border-t-[6px] border-t-purple-500">
                <h4 className="text-lg font-bold mb-4">Commission Distribution</h4>
                <p className="text-xs text-gray-500 mb-6">Verify and process commission shares for group holdings.</p>
                <Button className="w-full" variant="secondary">Analyze Commissions 📊</Button>
            </GlassCard>
        </div>
    );

    const renderStatements = () => (
        <GlassCard className="p-8 max-w-2xl mx-auto border-t-[8px] border-t-blue-500">
            <h3 className="text-xl font-black text-gray-800 mb-2 font-display">System Audit Statements</h3>
            <p className="text-sm text-gray-500 mb-8 text-center px-4 italic">Internal audit-grade statement generation for system-wide reconciliation.</p>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Statement Gen Triggered (MOCK)'); }}>
                <Input label="Target Account / System ID" required value={statementData.account_number} onChange={e => setStatementData({ ...statementData, account_number: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Start Date" type="date" required value={statementData.start_date} onChange={e => setStatementData({ ...statementData, start_date: e.target.value })} />
                    <Input label="End Date" type="date" required value={statementData.end_date} onChange={e => setStatementData({ ...statementData, end_date: e.target.value })} />
                </div>
                <Button type="submit" variant="primary" className="w-full py-4 text-lg shadow-xl shadow-blue-100">Export Audit-Ready PDF 📥</Button>
            </form>
        </GlassCard>
    );

    const renderContent = () => {
        if (loading && !expenses.length && !cashFlow) return <div className="p-12 text-center text-gray-500">Loading financials...</div>;
        if (error) return <div className="p-12 text-center text-red-500">Error: {error}</div>;

        switch (activeTab) {
            case 'expenses': return renderExpenses();
            case 'payroll': return renderPayroll();
            case 'cash-flow': return renderCashFlow();
            case 'analysis': return renderAnalysis();
            case 'statements': return renderStatements();
            default: return null;
        }
    };

    const tabs = [
        { id: 'expenses', label: 'Expenses', icon: '📝', roles: ['manager', 'staff'] },
        { id: 'payroll', label: 'Payroll', icon: '💰', roles: ['manager'] },
        { id: 'cash-flow', label: 'Cash Flow', icon: '📈', roles: ['manager'] },
        { id: 'analysis', label: 'Analysis', icon: '🧪', roles: ['manager'] },
        { id: 'statements', label: 'Audit', icon: '🧾', roles: ['manager'] },
    ];

    const visibleTabs = tabs.filter(t => t.roles.includes(mode));

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-wrap gap-2">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border ${activeTab === tab.id
                            ? 'bg-coastal-primary text-white border-coastal-primary shadow-lg shadow-blue-100'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-100'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default FinancialOperationsHub;
