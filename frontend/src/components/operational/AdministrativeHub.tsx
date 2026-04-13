import React, { useState, useEffect, useCallback } from 'react';
import EnhancedUserManagementForm, { UserFormData } from '../EnhancedUserManagementForm';
import { authService, AccountWithDetails, ServiceCharge, User, AccountClosureRequest } from '../../services/api';
import { StaffId } from '../../types';
import GlassCard from '../ui/modern/GlassCard';
import ModernStatCard from '../ui/modern/ModernStatCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
  Building2, 
  UserX, 
  Users, 
  IdCard, 
  Tag, 
  PlusCircle, 
  BarChart3,
  Search,
  Printer,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import OnboardingHub from './OnboardingHub';
import OperationalOverview from './OperationalOverview';
import FieldAssignmentManagement from './FieldAssignmentManagement';
import { MonthlyReportData, CategoryReportData } from '../../types';

interface AdministrativeHubProps {
    initialTab?: 'accounts' | 'closures' | 'users' | 'staff-ids' | 'charges' | 'analytics' | 'field_assignments';
    mode?: 'manager' | 'staff';
    accounts?: AccountWithDetails[];
    loading?: boolean;
}

const AdministrativeHub: React.FC<AdministrativeHubProps> = ({
    initialTab = 'accounts',
    mode = 'staff',
    accounts: propAccounts,
    loading: propLoading
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [accounts, setAccounts] = useState<AccountWithDetails[]>(propAccounts || []);
    const [closures, setClosures] = useState<AccountClosureRequest[]>([]);
    const [loading, setLoading] = useState(propLoading ?? true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // User Management Sub-Tab: 'staff' | 'members'
    const [userSubTab, setUserSubTab] = useState<'staff' | 'members'>('staff');

    // Stats State (for Visual Telemetry)
    const [statsData, setStatsData] = useState<{
        monthlyData: MonthlyReportData[];
        categoryData: CategoryReportData[];
    }>({
        monthlyData: [],
        categoryData: []
    });

    // Administrative State (Staff/Manager management)
    const [staffMembers, setStaffMembers] = useState<User[]>([]);
    const [staffIds, setStaffIds] = useState<StaffId[]>([]);
    const [staffIdFilters, _setStaffIdFilters] = useState<Record<string, string>>({});
    const [actionLoading, setActionLoading] = useState(false);
    const [statsTimeframe, setStatsTimeframe] = useState<string>('monthly');

    // Service Charges State
    const [charges, setCharges] = useState<ServiceCharge[]>([]);
    const [newCharge, setNewCharge] = useState<ServiceCharge>({
        name: '',
        description: '',
        charge_type: 'fixed',
        rate: '',
        applicable_to: []
    });

    // Form data for staff creation
    const [staffFormData, setStaffFormData] = useState<UserFormData>({
        first_name: '', last_name: '', email: '', phone: '', role: 'cashier',
        house_address: '', contact_address: '', government_id: '', ssnit_number: '',
        passport_picture: null, application_letter: null, appointment_letter: null,
        bank_name: '', account_number: '', branch_code: '', routing_number: ''
    });


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'accounts') {
                const res = await authService.getStaffAccounts();
                if (res.success) setAccounts(res.data || []);
            } else if (activeTab === 'closures') {
                const res = await authService.getAccountClosures();
                if (res.success) setClosures(res.data || []);
            } else if (activeTab === 'users') {
                const res = await authService.getAllStaff();
                if (res.success) setStaffMembers(res.data || []);
            } else if (activeTab === 'staff-ids') {
                const res = await authService.getStaffIds(staffIdFilters);
                if (res.success) setStaffIds(res.data as StaffId[] || []);
            } else if (activeTab === 'charges') {
                const res = await authService.getServiceCharges();
                if (res.success) setCharges(res.data || []);
            } else if (activeTab === 'analytics') {
                const res = await authService.getServiceStats(statsTimeframe);
                if (res.success && res.data) {
                    setStatsData({
                        monthlyData: res.data.monthly_volume || [],
                        categoryData: res.data.type_distribution || []
                    });
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch administrative data');
        } finally {
            setLoading(false);
        }
    }, [activeTab, staffIdFilters, statsTimeframe]);

    useEffect(() => {
        if (!propAccounts || activeTab !== 'accounts') {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [activeTab, propAccounts, fetchData]);

    const handleCreateCharge = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const res = await authService.createServiceCharge(newCharge);
            if (res.success) {
                toast.success('Service charge established successfully.');
                setNewCharge({
                    name: '',
                    description: '',
                    charge_type: 'fixed',
                    rate: '',
                    applicable_to: []
                });
                fetchData();
            } else {
                toast.error(res.error || 'Failed to create service charge');
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Establishment failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveStaff = async (staff: StaffId) => {
        if (!confirm(`Approve staff registration and generate ID for ${staff.first_name} ${staff.last_name}?`)) return;
        try {
            setActionLoading(true);
            const blob = await authService.approveStaff(staff.id);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Staff_Welcome_${staff.last_name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            fetchData();
            toast.success('Staff member approved and Welcome Letter downloaded successfully.');
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to approve staff member';
            toast.error(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };


    const renderStaffIds = () => {
        return (
            <div className="space-y-5">
                <GlassCard className="p-4 shadow-lg border border-slate-200/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
                            <IdCard className="w-5 h-5 text-coastal-primary" /> Staff IDs Management
                        </h2>
                        {actionLoading && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                Processing...
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-400">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white text-left">
                                    <th className="p-3 font-black text-[9px] tracking-widest uppercase">Staff ID</th>
                                    <th className="p-3 font-black text-[9px] tracking-widest uppercase">Full Name</th>
                                    <th className="p-3 font-black text-[9px] tracking-widest uppercase">Status</th>
                                    <th className="p-3 font-black text-[9px] tracking-widest uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {staffIds.length === 0 ? (
                                     <tr><td colSpan={4} className="p-10 text-center text-slate-900 font-bold italic">No staff records found.</td></tr>
                                 ) : (
                                     staffIds.map((staff) => (
                                         <tr key={staff.id} className="hover:bg-blue-50/50 transition-colors">
                                             <td className="p-3 font-mono font-bold text-coastal-primary tracking-tighter text-sm">
                                                 {staff.staff_id || <span className="text-amber-600 font-black italic tracking-widest text-[9px]">PENDING</span>}
                                             </td>
                                             <td className="p-3 font-black text-slate-900 text-sm">
                                                 {staff.first_name || staff.name} {staff.last_name || ''}
                                             </td>
                                             <td className="p-3 text-[10px] font-bold">
                                                 {staff.is_approved ? (
                                                     <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">Verified</span>
                                                 ) : (
                                                     <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">Pending</span>
                                                 )}
                                             </td>
                                             <td className="p-3 text-right">
                                                 {!staff.is_approved ? (
                                                     <Button onClick={() => handleApproveStaff(staff)} variant="success" size="sm" disabled={actionLoading} className="flex items-center gap-2 py-1.5 px-3 h-8">
                                                         <Printer className="w-3.5 h-3.5" /> Approve
                                                     </Button>
                                                 ) : (
                                                     <div className="p-2 text-center text-slate-400 font-black uppercase text-[9px] tracking-widest bg-slate-50 border border-dashed border-slate-200 rounded-lg">ID ISSUED</div>
                                                 )}
                                             </td>
                                         </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
        );
    };

    const renderServiceCharges = () => {
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <GlassCard className="p-4 border-t-[6px] border-t-blue-500 shadow-lg">
                        <h4 className="text-base font-black text-slate-900 mb-4 flex items-center gap-3 tracking-tight">
                            <PlusCircle className="w-4.5 h-4.5 text-blue-600" /> Establish Charge Identity
                        </h4>
                        <form className="space-y-4" onSubmit={handleCreateCharge}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Charge Name *" required value={newCharge.name} onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })} />
                                <div>
                                    <label className="block text-xs font-black text-slate-900 mb-2 ml-1 uppercase tracking-tight">Type *</label>
                                    <select 
                                        value={newCharge.charge_type} 
                                        onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })} 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-400 font-black text-slate-900 bg-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        title="Select charge type"
                                    >
                                        <option value="fixed">Fixed (GHS)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                            </div>
                            <Input label="Rate/Amount *" type="number" step="0.01" required value={newCharge.rate} onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })} />
                            <Button type="submit" variant="primary" className="w-full">Save Charge</Button>
                        </form>
                    </GlassCard>

                    <GlassCard className="p-4 shadow-lg border border-slate-200/50">
                        <h4 className="text-base font-black text-slate-900 mb-4 flex items-center gap-3 uppercase tracking-widest text-[11px]">
                             <Tag className="w-4 h-4 text-slate-400" /> Existing Charges ({charges.length})
                        </h4>
                        <div className="space-y-2">
                            {charges.map(c => (
                                <div key={c.id} className="p-2 border border-slate-200 rounded-xl flex justify-between items-center bg-white/50 hover:bg-white transition-colors">
                                    <div>
                                        <div className="font-black text-slate-900 text-sm tracking-tight">{c.name}</div>
                                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{c.charge_type}</div>
                                    </div>
                                    <div className="text-base font-black text-coastal-primary">
                                        {c.charge_type === 'percentage' ? `${c.rate}%` : `GHS ${c.rate}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <div className="p-12 text-center text-slate-900 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Synchronizing Administrative Matrix...</div>;
        if (error) return <div className="p-12 text-center text-red-500">Error: {error}</div>;

        const filteredAccounts = accounts.filter(acc =>
            (acc.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.account_number.toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch (activeTab) {
            case 'accounts':
                return (
                    <div className="space-y-4">
                         <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-300 max-w-sm w-full focus-within:border-coastal-primary transition-colors">
                            <Search className="ml-3 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Filter account matrix..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-none shadow-none mb-0 focus:ring-0 flex-1 h-9 text-sm"
                            />
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                {filteredAccounts.length === 0 ? (
                                    <div className="p-10 text-center text-slate-900 font-bold italic bg-slate-50/50">
                                        No accounts found in current matrix.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {filteredAccounts.map(acc => (
                                            <div key={acc.id} className="px-4 py-3 hover:bg-slate-50 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-coastal-primary group-hover:text-white transition-all duration-300">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 leading-tight text-sm">
                                                            {acc.user?.full_name || acc.account_number}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                                                {acc.account_type}
                                                            </span>
                                                            <span className="text-xs text-coastal-primary font-mono font-bold">
                                                                {acc.account_number}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-black text-slate-900 text-base tracking-tighter">
                                                        GHS {acc.balance.toLocaleString()}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                                                        Available
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'closures': {
                const pendingClosures = closures.filter(c => c.status === 'pending');
                return (
                    <div className="space-y-4">
                        {pendingClosures.length === 0 ? <p className="text-center text-slate-900 font-black uppercase text-[10px] tracking-widest p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">No pending closure requests.</p> :
                            pendingClosures.map(c => (
                                <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center hover:border-coastal-primary transition-colors">
                                    <div>
                                        <div className="font-bold text-slate-900">{c.user_name || c.account_number}</div>
                                        <div className="text-sm text-black font-bold">Reason: <span className="font-normal text-slate-700">{c.reason || 'Not specified'}</span></div>
                                    </div>
                                    <Button variant="danger" size="sm">Review Closure</Button>
                                </div>
                            ))}
                    </div>
                );
            }
            case 'users':
                return (
                    <div className="space-y-6">
                        {/* Sub-navigation for Identity workflows */}
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-4">
                            <button
                                onClick={() => setUserSubTab('staff')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${userSubTab === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Staff Management
                            </button>
                            <button
                                onClick={() => setUserSubTab('members')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${userSubTab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Client Registration
                            </button>
                        </div>

                        {userSubTab === 'staff' ? (
                            <EnhancedUserManagementForm
                                formData={staffFormData}
                                setFormData={setStaffFormData}
                                staffMembers={(Array.isArray(staffMembers) ? staffMembers : []).map(u => ({ id: String(u.id), name: `${u.first_name} ${u.last_name}`, role: u.role, status: u.is_active ? 'active' : 'inactive' }))}
                                fetchStaffMembers={() => fetchData()}
                                handleCreateUser={() => { }}
                            />
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <OnboardingHub mode="manager" />
                            </div>
                        )}
                    </div>
                );
            case 'analytics':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="border-t border-slate-200 pt-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-coastal-primary" /> Visual Telemetry
                            </h3>
                            <OperationalOverview
                                monthlyData={statsData.monthlyData}
                                categoryData={statsData.categoryData}
                                loading={loading}
                                activeTimeframe={statsTimeframe}
                                onTimeframeChange={setStatsTimeframe}
                            />
                        </div>
                    </div>
                );
            case 'staff-ids':
                return renderStaffIds();
            case 'charges':
                return renderServiceCharges();
            case 'field_assignments':
                return <FieldAssignmentManagement />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'accounts', label: 'Accounts', icon: <Building2 className="w-5 h-5" />, roles: ['manager', 'staff'] },
        { id: 'closures', label: 'Closures', icon: <UserX className="w-5 h-5" />, roles: ['manager'] },
        { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" />, roles: ['manager'] },
        { id: 'staff-ids', label: 'IDs', icon: <IdCard className="w-5 h-5" />, roles: ['manager'] },
        { id: 'charges', label: 'Charges', icon: <Tag className="w-5 h-5" />, roles: ['manager'] },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['manager'] },
        { id: 'field_assignments', label: 'Assignments', icon: <MapPin className="w-5 h-5" />, roles: ['manager'] },
    ];

    const visibleTabs = tabs.filter(t => t.roles.includes(mode));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Redesigned Navigation Bar (Compact) */}
            <div className="bg-[#001D3A] p-3 rounded-2xl mb-6 flex items-center justify-between shadow-2xl overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex items-center gap-3">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'accounts' | 'closures' | 'users' | 'staff-ids' | 'charges' | 'analytics')}
                            className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-2.5 border-none ${activeTab === tab.id
                                ? 'bg-[#0052CC] text-white shadow-[0_0_20px_rgba(0,82,204,0.5)] scale-102 relative z-10'
                                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <span className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
                                {React.isValidElement(tab.icon) ? React.cloneElement(tab.icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' }) : tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pb-4">
                <ModernStatCard 
                    label="Volume Summary" 
                    value={String(
                        activeTab === 'accounts' ? accounts.length :
                        activeTab === 'closures' ? closures.filter(c => c.status === 'pending').length :
                        activeTab === 'users' ? staffMembers.length :
                        activeTab === 'staff-ids' ? staffIds.filter(s => !s.is_approved).length :
                        charges.length
                    )} 
                    icon={<BarChart3 className="w-5 h-5" />} 
                    trend="neutral" 
                />
            </div>
        </div>
    );
};

export default AdministrativeHub;
