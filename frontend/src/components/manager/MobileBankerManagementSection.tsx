import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { authService } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';

interface MobileBankerManagementSectionProps {
}

const MobileBankerManagementSection: React.FC<MobileBankerManagementSectionProps> = () => {
    const [mobileBankers, setMobileBankers] = useState<any[]>([]);
    const [selectedBanker, setSelectedBanker] = useState<string>('');
    const [metrics, setMetrics] = useState<any>(null);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Modals state
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [targetBankerId, setTargetBankerId] = useState('');

    // Assign Client Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [assignForm, setAssignForm] = useState({ client_id: '', priority: 'medium', location: '' });

    // Initial fetch of mobile bankers
    useEffect(() => {
        fetchMobileBankers();
    }, []);

    // Fetch data when selected banker changes
    useEffect(() => {
        if (selectedBanker) {
            fetchBankerData(selectedBanker);
        } else {
            setMetrics(null);
            setAssignments([]);
        }
    }, [selectedBanker]);

    const fetchMobileBankers = async () => {
        setLoading(true);
        // Fetch staff with role 'mobile_banker'
        const response = await authService.getStaffIds({ role: 'mobile_banker' });
        if (response.success) {
            const bankers = response.data.results || response.data || [];
            setMobileBankers(bankers);
            if (bankers.length > 0 && !selectedBanker) {
                // Automatically select first if none selected, or leave empty to force choice?
                // Let's leave empty to force explicit choice for clarity
            }
        }
        setLoading(false);
    };

    const fetchBankerData = async (bankerId: string) => {
        setLoadingMetrics(true);
        try {
            const [metricsRes, assignmentsRes] = await Promise.all([
                authService.getMobileBankerMetrics(bankerId),
                authService.getClientAssignments({ mobile_banker: bankerId })
            ]);

            if (metricsRes.success) setMetrics(metricsRes.data);
            if (assignmentsRes.success) setAssignments(assignmentsRes.data);
        } catch (error) {
            console.error('Error fetching banker data:', error);
        } finally {
            setLoadingMetrics(false);
        }

    };

    const handleOpenAssignModal = async () => {
        setAssignForm({ client_id: '', priority: 'medium', location: '' });
        setShowAssignModal(true);
        // Fetch candidates (members)
        if (members.length === 0) {
            const res = await authService.getMembers();
            if (res.success) setMembers(res.data);
        }
    };

    const handleAssignClient = async () => {
        if (!selectedBanker || !assignForm.client_id) {
            alert('Banker and Client are required');
            return;
        }

        const response = await authService.assignClient({
            mobile_banker: selectedBanker,
            client: assignForm.client_id,
            priority: assignForm.priority,
            location: assignForm.location || 'Unknown' // Ideally link to profile address
        });

        if (response.success) {
            alert('Client assigned successfully!');
            setShowAssignModal(false);
            fetchBankerData(selectedBanker); // Refresh list
        } else {
            alert('Failed to assign: ' + (response.error || 'Unknown error'));
        }
    };

    const handleReassign = async (assignmentId: number) => {
        if (!targetBankerId) {
            alert('Please select a target mobile banker');
            return;
        }

        const response = await authService.updateAssignment(assignmentId, {
            mobile_banker_id: targetBankerId
        });

        if (response.success) {
            alert('Client reassigned successfully');
            setShowReassignModal(false);
            fetchBankerData(selectedBanker); // Refresh list
        } else {
            alert('Failed to reassign: ' + response.error);
        }
    };

    // Calculate total due for display
    const totalDue = assignments.reduce((sum, a) => {
        // Clean currency string "GHS 100.00" -> 100.00
        const amount = a.amountDue ? parseFloat(a.amountDue.replace(/[^0-9.-]+/g, "")) : 0;
        return sum + amount;
    }, 0);

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-secondary-200">
                <div>
                    <h2 className="text-xl font-bold text-secondary-900">Mobile Banker Management</h2>
                    <p className="text-sm text-secondary-500">Monitor performance and manage client assignments</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <label className="text-sm font-medium text-secondary-700 whitespace-nowrap">Select Banker:</label>
                    <select
                        className="w-full md:w-64 p-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={selectedBanker}
                        onChange={(e) => setSelectedBanker(e.target.value)}
                    >
                        <option value="">-- Choose Mobile Banker --</option>
                        {mobileBankers.map(mb => (
                            <option key={mb.id} value={mb.id}>
                                {mb.name} ({mb.staff_id || 'No ID'})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && !metrics ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-secondary-500">Loading data...</p>
                </div>
            ) : !selectedBanker ? (
                <div className="text-center py-12 bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200">
                    <div className="text-4xl mb-4">👈</div>
                    <p className="text-secondary-500 font-medium">Please select a Mobile Banker from the dropdown to view details.</p>
                </div>
            ) : (
                <>
                    {/* Performance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-primary-50 to-white border-l-4 border-l-primary-500">
                            <div className="text-primary-600 mb-1 font-medium">Total Collections Today</div>
                            <div className="text-2xl font-bold text-secondary-900">
                                {formatCurrencyGHS(metrics?.cash_collected || 0)}
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-success-50 to-white border-l-4 border-l-success-500">
                            <div className="text-success-600 mb-1 font-medium">Visits Completed</div>
                            <div className="text-2xl font-bold text-secondary-900">
                                {metrics?.visits_completed || 0}
                            </div>
                        </Card>
                        <Card className="bg-gradient-to-br from-info-50 to-white border-l-4 border-l-info-500">
                            <div className="text-info-600 mb-1 font-medium">Accounts Opened</div>
                            <div className="text-2xl font-bold text-secondary-900">
                                {metrics?.accounts_opened || 0}
                            </div>
                        </Card>
                    </div>

                    {/* Assignments Table */}
                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-secondary-900">
                                Assigned Clients
                                <span className="ml-2 text-sm font-normal text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">
                                    {assignments.length}
                                </span>
                            </h3>
                            <div className="text-right">
                                <p className="text-xs text-secondary-500 uppercase tracking-wider">Total Due</p>
                                <p className="font-bold text-primary-600">{formatCurrencyGHS(totalDue)}</p>
                            </div>
                            <Button size="sm" onClick={handleOpenAssignModal} className="ml-4">
                                ➕ Assign Client
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-secondary-500 border-b border-secondary-200">
                                        <th className="p-3 font-medium uppercase tracking-wider">Client Name</th>
                                        <th className="p-3 font-medium uppercase tracking-wider">Location</th>
                                        <th className="p-3 font-medium uppercase tracking-wider">Status</th>
                                        <th className="p-3 font-medium uppercase tracking-wider">Priority</th>
                                        <th className="p-3 font-medium uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {assignments.length > 0 ? (
                                        assignments.map((assignment) => (
                                            <tr key={assignment.id} className="hover:bg-secondary-50 transition-colors">
                                                <td className="p-3 font-medium text-secondary-900">{assignment.name}</td>
                                                <td className="p-3 text-secondary-600">{assignment.location}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.status === 'Completed' ? 'bg-success-100 text-success-700' :
                                                        assignment.status === 'Pending Visit' ? 'bg-warning-100 text-warning-700' :
                                                            'bg-secondary-100 text-secondary-700'
                                                        }`}>
                                                        {assignment.status}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`text-xs font-bold ${assignment.priority === 'high' ? 'text-error-600' :
                                                        assignment.priority === 'medium' ? 'text-warning-600' : 'text-secondary-500'
                                                        }`}>
                                                        {assignment.priority?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAssignment(assignment);
                                                            setTargetBankerId(''); // Reset selection
                                                            setShowReassignModal(true);
                                                        }}
                                                    >
                                                        Reassign
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-secondary-500">
                                                No clients assigned to this mobile banker.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}

            {/* Reassign Modal */}
            {showReassignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Reassign Client</h3>
                        <p className="text-secondary-600 mb-4">
                            Reassign <strong>{selectedAssignment?.name}</strong> to:
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-secondary-700 mb-2">New Mobile Banker</label>
                            <select
                                className="w-full p-2 border border-secondary-300 rounded-lg"
                                value={targetBankerId}
                                onChange={(e) => setTargetBankerId(e.target.value)}
                            >
                                <option value="">-- Select --</option>
                                {mobileBankers
                                    .filter(mb => mb.id !== parseInt(selectedBanker)) // Exclude current
                                    .map(mb => (
                                        <option key={mb.id} value={mb.id}>
                                            {mb.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowReassignModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={() => handleReassign(selectedAssignment.id)}>
                                Confirm Reassign
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Client Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Assign New Client</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Select Client (Customer)</label>
                                <select
                                    className="w-full p-2 border border-secondary-300 rounded-lg"
                                    value={assignForm.client_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, client_id: e.target.value })}
                                >
                                    <option value="">-- Choose Client --</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Location Override</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-secondary-300 rounded-lg"
                                    placeholder="Area/Town (Optional)"
                                    value={assignForm.location}
                                    onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                                <select
                                    className="w-full p-2 border border-secondary-300 rounded-lg"
                                    value={assignForm.priority}
                                    onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleAssignClient}>
                                Assign Client
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileBankerManagementSection;
