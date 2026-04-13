import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { ClientsForMappingResult, StaffId } from '../../types';
import GlassCard from '../ui/modern/GlassCard';
import { Search, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FieldAssignmentManagement: React.FC = () => {
    const [clients, setClients] = useState<ClientsForMappingResult[]>([]);
    const [bankers, setBankers] = useState<StaffId[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [clientsRes, bankersRes] = await Promise.all([
                apiService.getClientsToMap(),
                apiService.getStaffIds({ role: 'mobile_banker' })
            ]);

            if (clientsRes.success) setClients(clientsRes.data || []);
            // bankersRes returns { success, data: StaffId[] }
            if (bankersRes.success) setBankers(bankersRes.data || []);
        } catch (_error) {
            toast.error('Failed to load assignment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (clientId: string | number, bankerId: string | number | null) => {
        try {
            setActionLoading(String(clientId));
            const res = await apiService.assignBankerToClient(clientId, bankerId);
            if (res.success) {
                toast.success(res.message || 'Banker assigned successfully');
                await fetchData();
            } else {
                toast.error(res.error || 'Assignment failed');
            }
        } catch (_error) {
            toast.error('An unexpected error occurred during assignment');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.member_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-10 h-10 text-coastal-primary animate-spin" />
                <p className="text-slate-600 font-bold animate-pulse">Syncing Field Operations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <GlassCard className="p-5 border-l-4 border-l-coastal-primary shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-coastal-primary" /> Field Operations Mapping
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Assign trusted Mobile Bankers to your member portfolio</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, member ID or email..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coastal-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white text-left">
                                <th className="p-4 font-black text-[10px] tracking-widest uppercase">Member Identity</th>
                                <th className="p-4 font-black text-[10px] tracking-widest uppercase">Contact Intelligence</th>
                                <th className="p-4 font-black text-[10px] tracking-widest uppercase">Current Assignment</th>
                                <th className="p-4 font-black text-[10px] tracking-widest uppercase text-right">Operational Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">
                                        No matching members found for assignment.
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 leading-tight">{client.name}</span>
                                                <span className="text-[11px] font-mono font-bold text-coastal-primary uppercase tracking-tighter">
                                                    {client.member_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">{client.email}</span>
                                                <span className="text-xs font-medium text-slate-500">{client.phone}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {client.assigned_banker ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-emerald-900">{client.assigned_banker.name}</span>
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                            {client.assigned_banker.staff_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Unassigned</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <select 
                                                    aria-label="Assign mobile banker to member"
                                                    className="text-xs font-black p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-coastal-primary/20 outline-none min-w-[150px]"
                                                    onChange={(e) => handleAssign(client.id, e.target.value || null)}
                                                    value={client.assigned_banker?.id || ""}
                                                    disabled={actionLoading === String(client.id)}
                                                >
                                                    <option value="">-- UNASSIGN --</option>
                                                    {bankers.map(banker => (
                                                        <option key={banker.id} value={banker.id}>
                                                            {banker.name} ({banker.staff_id})
                                                        </option>
                                                    ))}
                                                </select>
                                                
                                                {actionLoading === String(client.id) && (
                                                    <Loader2 className="w-4 h-4 text-coastal-primary animate-spin" />
                                                )}
                                            </div>
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

export default FieldAssignmentManagement;
