import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../../services/api';
import { ExpenseCategory } from '../../types';
import { ClipboardList, Banknote, TrendingUp, LineChart, FileText, User, Download, Calculator, BarChart3, ArrowDownRight } from 'lucide-react';

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
    status: string;
}

export interface CashFlowResponse {
    inflow: { total: number; deposits: number; [key: string]: number };
    outflow: { total: number; withdrawals: number; operational_expenses: number; [key: string]: number };
    net_cash_flow: number;
    period: string;
}

export interface CalculatedValue {
    id?: number;
    label: string;
    value: string | number;
    type: string;
}

interface InterestProjection {
    estimated_monthly_payout: number;
    total_savings_base: number;
}

interface CommissionAnalysis {
    accrued_commissions: number;
    monthly_volume: number;
}

interface FinancialAnalysis {
    interest_projection?: InterestProjection;
    commissions?: CommissionAnalysis;
}

interface StaffMember {
    id: string | number;
    first_name: string;
    last_name: string;
    email: string;
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Financial States
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [cashFlow, setCashFlow] = useState<CashFlowResponse | null>(null);
    const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);

    // Form States
    const [newExpense, setNewExpense] = useState({ category: 'Utilities', amount: '', description: '' });
    const [payrollData, setPayrollData] = useState({ 
        staff_id: '', 
        month: 'April', 
        year: '2026', 
        base_pay: '', 
        allowances: '',
        overtime_pay: '0',
        bonuses: '0',
        tax_deduction: '0',
        other_deductions: '0'
    });

    const [statementData, setStatementData] = useState({ account_number: '', start_date: '', end_date: '' });

    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authService.getAllStaff();
            if (res.success && res.data) {
                const data = Array.isArray(res.data) ? res.data : (res.data as { results?: StaffMember[] }).results;
                setStaffMembers(Array.isArray(data) ? data : []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'expenses') {
                const res = await authService.getExpenses();
                if (res.success) setExpenses(res.data as Expense[] || []);
            } else if (activeTab === 'cash-flow') {
                const res = await authService.getCashFlow();
                if (res.success) setCashFlow(res.data as CashFlowResponse);
            } else if (activeTab === 'analysis') {
                const res = await authService.getReportAnalytics();
                if (res.success) setAnalysis(res.data as FinancialAnalysis);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
        if (activeTab === 'payroll') {
            fetchStaff();
        }
    }, [activeTab, fetchData, fetchStaff]); // Fully specified dependencies


    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            const res = await authService.createExpense({
                category: newExpense.category as ExpenseCategory,
                description: newExpense.description,
                amount: Number(newExpense.amount)
            });

            if (res.success) {
                setNewExpense({ category: 'Utilities', amount: '', description: '' });
                fetchData();
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleGeneratePayslip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await authService.generatePayslip(payrollData);
            if (res.success) {
                alert('Payslip generated and pushed to staff dashboard! ✅');
                setPayrollData({ 
                    ...payrollData, 
                    staff_id: '', 
                    base_pay: '', 
                    allowances: '',
                    overtime_pay: '0',
                    bonuses: '0',
                    tax_deduction: '0',
                    other_deductions: '0'
                });
            } else {
                alert('Generation failed: ' + res.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateStatement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await authService.generateStatement(statementData);
            if (res.success) {
                alert('Audit statement generated and stored in records! ✅');
                setStatementData({ account_number: '', start_date: '', end_date: '' });
            } else {
                alert('Generation failed: ' + res.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderExpenses = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div> 
                  Record New Expense
                </h4>
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
                    <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full"
                        title="Save and record this expense"
                    >
                        {isSubmitting ? 'Recording...' : 'Save Expense'}
                    </Button>
                </form>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden border border-black/5">
                 <div className="p-4 border-b border-black/5 bg-black/5 flex justify-between items-center">
                    <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] ml-1">Pending Expense Queue</h4>
                </div>
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                    {expenses.filter(ex => ex.status === 'pending').length === 0 ? (
                        <div className="p-8 text-center text-slate-900 font-black uppercase text-[10px] tracking-widest bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">No pending expenses found.</div>
                    ) : (
                        expenses.filter(ex => ex.status === 'pending').map((ex, i) => (
                        <div key={i} className="p-4 flex justify-between items-center hover:bg-black/5 transition-all group border-b border-black/5 last:border-0">
                            <div>
                                <div className="font-black text-slate-900">{ex.description}</div>
                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{ex.category} • {ex.date}</div>
                            </div>
                            <div className="font-black text-red-700 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/10">GHS {Number(ex.amount).toLocaleString()}</div>
                        </div>
                    )))}
                    {expenses.length === 0 && <div className="p-12 text-center text-slate-900 font-black uppercase text-[10px] tracking-widest bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">No expenses recorded yet.</div>}
                </div>
            </GlassCard>
        </div>
    );

    const renderPayroll = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-8 border-t-[8px] border-t-emerald-500">
                <h3 className="text-xl font-black text-slate-900 mb-2">Generate Staff Payslip</h3>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-8">Authorize official employee payslips with full earnings and deductions.</p>

                <form className="space-y-6" onSubmit={handleGeneratePayslip}>
                    <div>
                        <label className="block text-[10px] font-black text-slate-900 uppercase mb-2 ml-1 tracking-widest">Select Staff Member</label>
                        <select 
                            title="Select Staff Member"
                            required 
                            className="w-full p-4 rounded-xl border border-black/10 bg-white/50 focus:bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-slate-900 text-sm transition-all"
                            value={payrollData.staff_id}
                            onChange={e => setPayrollData({ ...payrollData, staff_id: e.target.value })}
                        >
                            <option value="">-- Choose Staff --</option>
                            {Array.isArray(staffMembers) && staffMembers.map(s => (
                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>
                            ))}
                        </select>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Base Pay (GHS)" 
                            type="number" 
                            step="0.01" 
                            required 
                            value={payrollData.base_pay} 
                            onChange={e => setPayrollData({ ...payrollData, base_pay: e.target.value })} 
                        />
                        <Input 
                            label="Allowances (GHS)" 
                            type="number" 
                            step="0.01" 
                            value={payrollData.allowances} 
                            onChange={e => setPayrollData({ ...payrollData, allowances: e.target.value })} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Overtime (GHS)" 
                            type="number" 
                            step="0.01" 
                            value={payrollData.overtime_pay} 
                            onChange={e => setPayrollData({ ...payrollData, overtime_pay: e.target.value })} 
                        />
                        <Input 
                            label="Bonuses (GHS)" 
                            type="number" 
                            step="0.01" 
                            value={payrollData.bonuses} 
                            onChange={e => setPayrollData({ ...payrollData, bonuses: e.target.value })} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                        <Input 
                            label="Income Tax (GHS)" 
                            type="number" 
                            step="0.01" 
                            value={payrollData.tax_deduction} 
                            onChange={e => setPayrollData({ ...payrollData, tax_deduction: e.target.value })} 
                        />
                        <Input 
                            label="Other Deductions (GHS)" 
                            type="number" 
                            step="0.01" 
                            value={payrollData.other_deductions} 
                            onChange={e => setPayrollData({ ...payrollData, other_deductions: e.target.value })} 
                        />
                    </div>

                    {/* Calculation Summary */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 shadow-2xl">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                            <span>Income Summary</span>
                            <span>GHS</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Gross Earnings</span>
                            <span className="text-lg font-black">
                                {((Number(payrollData.base_pay) || 0) + 
                                  (Number(payrollData.allowances) || 0) + 
                                  (Number(payrollData.overtime_pay) || 0) + 
                                  (Number(payrollData.bonuses) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-red-400">
                            <span className="text-xs">SSNIT (5.5%)</span>
                            <span className="text-xs font-bold">-{(Number(payrollData.base_pay) * 0.055).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-400">
                            <span className="text-xs">Other Deductions</span>
                            <span className="text-xs font-bold">-{(Number(payrollData.tax_deduction) + Number(payrollData.other_deductions)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/20">
                            <span className="font-black text-emerald-400 uppercase tracking-tighter">Net Take Home</span>
                            <span className="text-2xl font-black text-emerald-400">
                                {(((Number(payrollData.base_pay) || 0) + 
                                   (Number(payrollData.allowances) || 0) + 
                                   (Number(payrollData.overtime_pay) || 0) + 
                                   (Number(payrollData.bonuses) || 0)) - 
                                  ((Number(payrollData.base_pay) * 0.055) + 
                                   (Number(payrollData.tax_deduction) || 0) + 
                                   (Number(payrollData.other_deductions) || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isSubmitting} 
                        className="w-full py-4 text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                        title="Generate payslip for selected staff member"
                    >
                        {isSubmitting ? 'Generating...' : (
                            <>
                                Generate & Download <Download className="w-5 h-5" />
                            </>
                        )}
                    </Button>
                </form>
            </GlassCard>

            <GlassCard className="p-0 overflow-hidden border border-black/5">
                <div className="p-4 border-b border-black/5 bg-black/5 font-black text-[10px] text-slate-900 uppercase tracking-[0.2em] ml-1">Payroll Distribution</div>
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {Array.isArray(staffMembers) && staffMembers.map((s) => (
                        <div key={s.id} className="p-4 flex items-center justify-between hover:bg-emerald-500/5 transition-all cursor-pointer group border-b border-black/5 last:border-0" onClick={() => setPayrollData({...payrollData, staff_id: String(s.id)})}>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center border border-black/5">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900">{s.first_name} {s.last_name}</div>
                                    <div className="text-[10px] text-slate-600 uppercase font-black tracking-widest">{s.email}</div>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-emerald-700 font-black opacity-0 group-hover:opacity-100 scale-90 bg-emerald-500/10 border border-emerald-500/20">Quick Pay</Button>
                        </div>
                    ))}
                    {(!Array.isArray(staffMembers) || staffMembers.length === 0) && <div className="p-12 text-center text-gray-400 italic">No staff found.</div>}
                </div>
            </GlassCard>
        </div>
    );

    const renderCashFlow = () => {
        if (!cashFlow) return <div className="text-center p-12 text-gray-400">No cash flow data available.</div>;

        return (
            <div className="space-y-8">
                <GlassCard className="flex justify-between items-center p-8 border border-black/5">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                            GH₵{Math.abs(cashFlow.net_cash_flow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h2>
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 ml-1">Net Cash Flow ({cashFlow.period})</div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${cashFlow.net_cash_flow >= 0 ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20' : 'bg-red-500/10 text-red-800 border-red-500/20'}`}>
                        {cashFlow.net_cash_flow >= 0 ? 'Surplus Balance' : 'Deficit Reported'}
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ModernStatCard
                        label="Total Inflow"
                        value={`GH₵${cashFlow.inflow.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        icon={<Banknote className="w-5 h-5" />}
                        trend="up"
                        subtext={`Deposits: GH₵${cashFlow.inflow.deposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    />
                    <ModernStatCard
                        label="Total Outflow"
                        value={`GH₵${cashFlow.outflow.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        icon={<ArrowDownRight className="w-5 h-5" />}
                        trend="down"
                        subtext={`WD: GH₵${cashFlow.outflow.withdrawals.toLocaleString(undefined, { minimumFractionDigits: 2 })} | Expenses: GH₵${(cashFlow.outflow.operational_expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    />
                </div>
            </div>
        );
    };

    const renderAnalysis = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-8 border-t-[6px] border-t-amber-500">
                <h4 className="text-lg font-black text-slate-900 mb-4">Interest Accrual Projection</h4>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-6">Calculate estimated interest payouts for all active savings accounts.</p>
                
                {analysis?.interest_projection && (
                    <div className="mb-6 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Monthly Payout</span>
                            <span className="text-xl font-black text-amber-600">GH₵{analysis.interest_projection.estimated_monthly_payout.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-black italic">Based on GH₵{analysis.interest_projection.total_savings_base.toLocaleString()} total liquid assets</div>
                    </div>
                )}
                
                <Button 
                    className="w-full flex items-center justify-center gap-2" 
                    variant="secondary" 
                    onClick={() => fetchData()}
                    title="Recalculate interest accrual projections"
                >
                    <Calculator className="w-4 h-4" /> Refresh Projection
                </Button>
                
            </GlassCard>

            <GlassCard className="p-8 border-t-[6px] border-t-purple-500">
                <h4 className="text-lg font-black text-slate-900 mb-4">Commission Distribution</h4>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-6">Verify and process commission shares for active mobile banking agents.</p>
                
                {analysis?.commissions && (
                    <div className="mb-6 p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accrued this Month</span>
                            <span className="text-xl font-black text-purple-600">GH₵{analysis.commissions.accrued_commissions.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-black italic">Calculated from GH₵{analysis.commissions.monthly_volume.toLocaleString()} deposit volume</div>
                    </div>
                )}

                <Button 
                    className="w-full flex items-center justify-center gap-2" 
                    variant="secondary" 
                    onClick={() => fetchData()}
                    title="Analyze and verify commission distribution"
                >
                    <BarChart3 className="w-4 h-4" /> Analyze Commissions
                </Button>
            </GlassCard>
        </div>
    );

    const renderStatements = () => (
        <GlassCard className="p-8 max-w-2xl mx-auto border-t-[8px] border-t-blue-500">
            <h3 className="text-xl font-black text-slate-900 mb-2 font-display">System Audit Statements</h3>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-8 text-center px-4 italic leading-relaxed">Internal audit-grade statement generation for system-wide reconciliation.</p>
            <form className="space-y-6" onSubmit={handleGenerateStatement}>
                <Input label="Target Account / System ID" value={statementData.account_number} onChange={e => setStatementData({ ...statementData, account_number: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Start Date" type="date" required value={statementData.start_date} onChange={e => setStatementData({ ...statementData, start_date: e.target.value })} />
                    <Input label="End Date" type="date" required value={statementData.end_date} onChange={e => setStatementData({ ...statementData, end_date: e.target.value })} />
                </div>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full py-4 text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Generating...' : (
                        <>
                            <Download className="w-5 h-5" /> Export Audit-Ready PDF
                        </>
                    )}
                </Button>
            </form>
        </GlassCard>
    );

    const renderContent = () => {
        if (loading && !expenses.length && !cashFlow) return <div className="p-12 text-center text-slate-900 font-black uppercase text-[11px] tracking-[0.4em] animate-pulse">Synchronizing Banking Matrix...</div>;
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
        { id: 'expenses', label: 'Expenses', icon: <ClipboardList className="w-5 h-5" />, roles: ['manager', 'staff'] },
        { id: 'payroll', label: 'Payroll', icon: <Banknote className="w-5 h-5" />, roles: ['manager'] },
        { id: 'cash-flow', label: 'Cash Flow', icon: <TrendingUp className="w-5 h-5" />, roles: ['manager'] },
        { id: 'analysis', label: 'Analysis', icon: <LineChart className="w-5 h-5" />, roles: ['manager'] },
        { id: 'statements', label: 'Audit', icon: <FileText className="w-5 h-5" />, roles: ['manager'] },
    ];

    const visibleTabs = tabs.filter(t => t.roles.includes(mode));

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-wrap gap-2">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'expenses' | 'payroll' | 'cash-flow' | 'analysis' | 'statements')}
                        title={`View ${tab.label} section`}
                        aria-label={`Switch to ${tab.label}`}
                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === tab.id
                            ? 'bg-coastal-primary text-white border-coastal-primary shadow-xl shadow-blue-500/20'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100'
                            }`}
                    >
                        <span className="flex items-center justify-center" aria-hidden="true">{tab.icon}</span>
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
