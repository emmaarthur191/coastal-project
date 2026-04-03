import React, { useState, useEffect } from 'react';
import EnhancedUserManagementForm from '../EnhancedUserManagementForm';
import { authService, AccountWithDetails, ServiceCharge, User } from '../../services/api';
import { StaffManagementService } from '../../api/services/StaffManagementService';
import GlassCard from '../ui/modern/GlassCard';
import ModernStatCard from '../ui/modern/ModernStatCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface StaffId {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    staff_id: string;
    employment_date: string;
    is_active: boolean;
    is_approved: boolean;
    date_joined: string;
}

interface AdministrativeHubProps {
    initialTab?: 'accounts' | 'closures' | 'users' | 'staff-ids' | 'charges';
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
    const [closures, setClosures] = useState<any[]>([]);
    const [loading, setLoading] = useState(propLoading ?? true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Administrative State (Staff/Manager management)
    const [staffMembers, setStaffMembers] = useState<User[]>([]);
    const [staffIds, setStaffIds] = useState<StaffId[]>([]);
    const [staffIdFilters, _setStaffIdFilters] = useState<any>({});
    const [actionLoading, setActionLoading] = useState(false);

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
    const [staffFormData, setStaffFormData] = useState<any>({
        first_name: '', last_name: '', email: '', phone: '', role: 'cashier',
        house_address: '', contact_address: '', government_id: '', ssnit_number: '',
        passport_picture: null, application_letter: null, appointment_letter: null,
        bank_name: '', account_number: '', branch_code: '', routing_number: ''
    });

    useEffect(() => {
        if (!propAccounts || activeTab !== 'accounts') {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [activeTab, propAccounts]);

    const fetchData = async () => {
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
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch administrative data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveStaff = async (staff: StaffId) => {
        if (!confirm(`Approve staff registration and generate ID for ${staff.first_name} ${staff.last_name}?`)) return;
        try {
            setActionLoading(true);
            const blob = await StaffManagementService.apiUsersStaffManagementApproveAndPrintCreate(Number(staff.id));
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Staff_Welcome_${staff.last_name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            fetchData();
            alert('Staff member approved and Welcome Letter downloaded successfully.');
        } catch (error: any) {
            alert(error.message || 'Failed to approve staff member');
        } finally {
            setActionLoading(false);
        }
    };

    const renderStaffIds = () => {
        return (
            <div className="space-y-6">
                <GlassCard className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span>🆔</span> Staff IDs Management
                        </h2>
                        {actionLoading && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                Processing...
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-coastal-primary text-white text-left">
                                    <th className="p-4 font-bold text-sm tracking-wider">Staff ID</th>
                                    <th className="p-4 font-bold text-sm tracking-wider">Name</th>
                                    <th className="p-4 font-bold text-sm tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {staffIds.length === 0 ? (
                                    <tr><td colSpan={3} className="p-10 text-center text-gray-500">No staff IDs found.</td></tr>
                                ) : (
                                    staffIds.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-coastal-primary">
                                                {staff.staff_id || <span className="text-gray-400 italic">PENDING</span>}
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">{staff.first_name} {staff.last_name}</td>
                                            <td className="p-4 text-right">
                                                {!staff.is_approved ? (
                                                    <Button onClick={() => handleApproveStaff(staff)} variant="success" size="sm" disabled={actionLoading}>
                                                        Approve & Print
                                                    </Button>
                                                ) : <span className="text-xs font-bold text-emerald-600">✅ Verified</span>}
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
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GlassCard className="p-6 border-t-[6px] border-t-blue-500">
                        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><span>➕</span> Create New Charge</h4>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Saved (MOCK)'); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Charge Name *" required value={newCharge.name} onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })} />
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Type *</label>
                                    <select 
                                        value={newCharge.charge_type} 
                                        onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })} 
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200"
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

                    <GlassCard className="p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-6">Existing Charges ({charges.length})</h4>
                        <div className="space-y-3">
                            {charges.map(c => (
                                <div key={c.id} className="p-3 border rounded-xl flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-gray-800">{c.name}</div>
                                        <div className="text-xs text-gray-500 uppercase">{c.charge_type}</div>
                                    </div>
                                    <div className="text-lg font-black text-coastal-primary">
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
        if (loading) return <div className="p-12 text-center text-gray-500">Loading administrative data...</div>;
        if (error) return <div className="p-12 text-center text-red-500">Error: {error}</div>;

        const filteredAccounts = accounts.filter(acc =>
            (acc.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.account_number.toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch (activeTab) {
            case 'accounts':
                return (
                    <div className="space-y-6">
                         <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-md">
                            <Input
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-none shadow-none mb-0 focus:ring-0"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAccounts.map(acc => (
                                <div key={acc.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                    <h3 
                                        className="font-bold text-gray-800 mb-2 truncate" 
                                        title={acc.user?.full_name || acc.account_number}
                                    >
                                        {acc.user?.full_name || acc.account_number}
                                    </h3>
                                    <div className="text-sm text-gray-500 mb-4 font-mono">{acc.account_number}</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">{acc.account_type}</span>
                                        <span className="font-black text-coastal-primary">GHS {acc.balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                            {filteredAccounts.length === 0 && <div className="col-span-full p-8 text-center text-gray-400 italic">No accounts found.</div>}
                        </div>
                    </div>
                );
            case 'closures':
                return (
                    <div className="space-y-4">
                        {closures.length === 0 ? <p className="text-center text-gray-500 p-8 bg-gray-50 rounded-2xl border border-dashed">No pending closure requests.</p> :
                            closures.map(c => (
                                <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center hover:border-coastal-primary transition-colors">
                                    <div>
                                        <div className="font-bold">{c.user_name || c.account_number}</div>
                                        <div className="text-sm text-gray-500">Reason: {c.reason || 'Not specified'}</div>
                                    </div>
                                    <Button variant="danger" size="sm">Review Closure</Button>
                                </div>
                            ))}
                    </div>
                );
            case 'users':
                return (
                    <EnhancedUserManagementForm
                        formData={staffFormData}
                        setFormData={setStaffFormData}
                        staffMembers={staffMembers.map(u => ({ id: String(u.id), name: `${u.first_name} ${u.last_name}`, role: u.role, status: u.is_active ? 'active' : 'inactive' }))}
                        fetchStaffMembers={() => fetchData()}
                        handleCreateUser={() => { }}
                    />
                );
            case 'staff-ids':
                return renderStaffIds();
            case 'charges':
                return renderServiceCharges();
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'accounts', label: 'Accounts', icon: '🏦', roles: ['manager', 'staff'] },
        { id: 'closures', label: 'Closures', icon: '🚫', roles: ['manager'] },
        { id: 'users', label: 'Users', icon: '👥', roles: ['manager'] },
        { id: 'staff-ids', label: 'IDs', icon: '🆔', roles: ['manager'] },
        { id: 'charges', label: 'Charges', icon: '🏷️', roles: ['manager'] },
    ];

    const visibleTabs = tabs.filter(t => t.roles.includes(mode));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
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

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12 pb-8">
                <ModernStatCard label="Total Items" value={String(
                    activeTab === 'accounts' ? accounts.length :
                    activeTab === 'closures' ? closures.length :
                    activeTab === 'users' ? staffMembers.length :
                    activeTab === 'staff-ids' ? staffIds.length :
                    charges.length
                )} icon={<span>📊</span>} trend="neutral" />
            </div>
        </div>
    );
};

export default AdministrativeHub;
