import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { authService } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MobileBankerManagementSectionProps {
    // Props interface for MobileBankerManagementSection component
    // No props required for this component
}

interface MobileBanker {
    id: number;
    name: string;
    staff_id: string;
    role?: string;
}

interface MobileBankerMetrics {
    cash_collected: number;
    visits_completed: number;
    accounts_opened: number;
}

interface ClientAssignment {
    id: number;
    client_name: string;
    location: string;
    status: string;
    priority: string;
    amount_due?: string;
    mobile_banker?: string | number;
}

interface Member {
    id: number | string;
    name: string;
    email: string;
    current_assignment?: {
        id: number;
        banker: {
            id: number;
            name: string;
        } | null;
    } | null;
}

const MobileBankerManagementSection: React.FC<MobileBankerManagementSectionProps> = () => {
    const [mobileBankers, setMobileBankers] = useState<MobileBanker[]>([]);
    const [selectedBanker, setSelectedBanker] = useState<string>('');
    const [metrics, setMetrics] = useState<MobileBankerMetrics | null>(null);
    const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Modals state
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<ClientAssignment | null>(null);
    const [targetBankerId, setTargetBankerId] = useState('');

    // Assign Client Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [assignForm, setAssignForm] = useState({ client_id: '', priority: 'medium', location: '' });

    // Initial fetch of mobile bankers
    useEffect(() => {
        const fetchMobileBankers = async () => {
            setLoading(true);
            // Fetch staff with role 'mobile_banker'
            const response = await authService.getStaffIds({ role: 'mobile_banker' });
            if (response.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const bankers = ((response.data as any).results || response.data || []) as MobileBanker[];
                // Strictly filter to ensure only mobile_banker role appears (safety check)
                // Note: The backend should already do this, but this guarantees "only mobile bankers"
                const filteredBankers = bankers.filter(b => !b.role || b.role === 'mobile_banker');
                setMobileBankers(filteredBankers);

                // Auto-select the first banker for "easy access" if none selected
                if (filteredBankers.length > 0 && !selectedBanker) {
                    setSelectedBanker(String(filteredBankers[0].id));
                }
            }
            setLoading(false);
        };
        fetchMobileBankers();
    }, [selectedBanker]);

    // Fetch data when selected banker changes
    useEffect(() => {
        if (selectedBanker) {
            fetchBankerData(selectedBanker);
        } else {
            setMetrics(null);
            setAssignments([]);
        }
    }, [selectedBanker]);



    const fetchBankerData = async (_bankerId: string) => {
        setLoadingMetrics(true);
        try {
            const [metricsRes, assignmentsRes] = await Promise.all([
                authService.getMobileBankerMetrics(),
                authService.getAssignments({ mobile_banker: _bankerId })
            ]);

            if (metricsRes.success) setMetrics(metricsRes.data as unknown as MobileBankerMetrics);
            if (assignmentsRes.success) setAssignments(assignmentsRes.data as unknown as ClientAssignment[]);
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
            if (res.success) setMembers(res.data as Member[]);
        }
    };

    const handleAssignClient = async () => {
        if (!selectedBanker || !assignForm.client_id) {
            alert('Banker and Client are required');
            return;
        }

        // Frontend check: warn if client is already assigned to this banker
        const existingAssignment = assignments.find(
            a => String(a.mobile_banker) === String(selectedBanker) && String(a.id) === String(assignForm.client_id)
        );
        if (existingAssignment) {
            alert(`This client is already assigned to the selected banker. Use 'Reassign' to change their banker.`);
            return;
        }

        const response = await authService.assignClient({
            mobile_banker: selectedBanker,
            client: assignForm.client_id,
            priority: assignForm.priority,
            location: assignForm.location || 'Unknown'
        });

        if (response.success) {
            alert('Client assigned successfully!');
            setShowAssignModal(false);
            fetchBankerData(selectedBanker); // Refresh list
        } else {
            // Check if it's a "already assigned" error and offer a better path
            if (response.error?.includes('already assigned')) {
                const confirmReassign = window.confirm(`${response.error}\n\nWould you like to reassign them to the current banker instead?`);
                if (confirmReassign) {
                    // Find the existing assignment ID from members list
                    const member = members.find(m => String(m.id) === String(assignForm.client_id));
                    if (member?.current_assignment?.id) {
                        const reassignRes = await authService.updateAssignment(member.current_assignment.id, {
                            mobile_banker: selectedBanker
                        });
                        if (reassignRes.success) {
                            alert('Client reassigned successfully!');
                            setShowAssignModal(false);
                            fetchBankerData(selectedBanker);
                            return;
                        }
                    }
                }
            }
            alert('Failed to assign: ' + (response.error || 'Unknown error'));
        }
    };

    const handleReassign = async (assignmentId: number) => {
        if (!targetBankerId) {
            alert('Please select a target mobile banker');
            return;
        }

        const response = await authService.updateAssignment(assignmentId, {
            mobile_banker: targetBankerId
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
        const amount = a.amount_due ? parseFloat(a.amount_due.replace(/[^0-9.-]+/g, "")) : 0;
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
                    <label htmlFor="banker-select" className="text-sm font-medium text-secondary-700 whitespace-nowrap">Select Banker:</label>
                    <select
                        id="banker-select"
                        title="Select Mobile Banker"
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

            {(loading || loadingMetrics) && !metrics ? (
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
                                                <td className="p-3 font-medium text-secondary-900">{assignment.client_name}</td>
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
                                                        variant="secondary"
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
                            Reassign <strong>{selectedAssignment?.client_name}</strong> to:
                        </p>

                        <div className="mb-6">
                            <label htmlFor="reassign-banker-select" className="block text-sm font-medium text-secondary-700 mb-2">New Mobile Banker</label>
                            <select
                                id="reassign-banker-select"
                                title="Select New Mobile Banker"
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
                                <label htmlFor="assign-client-select" className="block text-sm font-medium text-secondary-700 mb-1">Select Client (Customer)</label>
                                <select
                                    id="assign-client-select"
                                    title="Select Client"
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
                                {assignForm.client_id && members.find(m => String(m.id) === String(assignForm.client_id))?.current_assignment && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                        ⚠️ Note: This client is currently assigned to <strong>{members.find(m => String(m.id) === String(assignForm.client_id))?.current_assignment?.banker?.name || 'another banker'}</strong>.
                                        Clicking "Assign" will prompt you to reassign them to the current banker.
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="location-input" className="block text-sm font-medium text-secondary-700 mb-1">Location Override</label>
                                <input
                                    id="location-input"
                                    title="Enter Location"
                                    type="text"
                                    className="w-full p-2 border border-secondary-300 rounded-lg"
                                    placeholder="Area/Town (Optional)"
                                    value={assignForm.location}
                                    onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="priority-select" className="block text-sm font-medium text-secondary-700 mb-1">Priority</label>
                                <select
                                    id="priority-select"
                                    title="Select Priority"
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
