import React, { useState, useEffect } from 'react';
import { apiService, AccountOpeningRequest, CreateAccountOpeningData } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import AccountOpeningTab from '../staff/AccountOpeningTab';

interface OnboardingHubProps {
  mode: 'staff' | 'manager';
}

const OnboardingHub: React.FC<OnboardingHubProps> = ({ mode }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccountOpeningRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'manager') {
      fetchRequests();
    }
  }, [mode]);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await apiService.getAccountOpenings();
    if (res.success && res.data) {
      setRequests(res.data);
    }
    setLoading(false);
  };

  const handleApproveAndPrint = async (id: string | number) => {
    setLoading(true);
    const res = await apiService.approveAndPrintAccountOpening(id);
    if (res.success && res.blob) {
      // Create PDF download link
      const url = window.URL.createObjectURL(new Blob([res.blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Welcome_Letter_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Account Approved & Welcome Letter Generated');
      fetchRequests();
    } else {
      toast.error(res.error || 'Approval failed');
    }
    setLoading(false);
  };

  const handleReject = async (id: string | number) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    setLoading(true);
    const res = await apiService.rejectAccountOpening(id, reason);
    if (res.success) {
      toast.success('Request Rejected');
      fetchRequests();
    } else {
      toast.error(res.error || 'Rejection failed');
    }
    setLoading(false);
  };

  if (mode === 'staff') {
    return (
      <div className="space-y-6">
        <AccountOpeningTab />
        <GlassCard className="p-6 bg-blue-500/5 border-blue-500/10">
          <p className="text-xs text-blue-400 font-medium italic">
            💡 <b>Note:</b> After submitting, instruct the member to visit an Operations Manager for final document verification and letter collection.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-emerald-500/20 rounded-lg">📋</span>
          Onboarding Approval Queue
        </h3>
        <Button onClick={fetchRequests} variant="ghost" className="text-sm">
          Refresh List
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.filter(r => r.status === 'pending').map((req) => (
              <tr key={req.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-white">{req.first_name} {req.last_name}</div>
                  <div className="text-xs text-gray-400">{req.phone_number}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-blue-400 font-medium uppercase">{req.account_type.replace('_', ' ')}</div>
                  <div className="text-xs text-gray-500">ID: {req.id_type} ({req.id_number})</div>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-full border border-yellow-500/20 uppercase">
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveAndPrint(req.id)}
                      className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30"
                    >
                      Approve & Print
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(req.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 animate-pulse">
                  Loading approval queue...
                </td>
              </tr>
            )}
            {!loading && requests.filter(r => r.status === 'pending').length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                  No pending onboarding requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

export default OnboardingHub;
