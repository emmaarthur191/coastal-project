import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { AccountOpeningRequest } from '../../types';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import AccountOpeningTab from '../staff/AccountOpeningTab';
import { getImageSrc } from '../../utils/image';
import { ShieldCheck, Lightbulb, User, X, RefreshCw } from 'lucide-react';

interface OnboardingHubProps {
  mode: 'staff' | 'manager';
}

const OnboardingHub: React.FC<OnboardingHubProps> = ({ mode }) => {
  const { user: _user } = useAuth();
  const [requests, setRequests] = useState<AccountOpeningRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AccountOpeningRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'manager') {
      fetchRequests();
    }
  }, [mode]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAccountOpenings();
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (_err) {
      toast.error('Failed to load onboarding requests');
    } finally {
      setLoading(false);
    }
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

  const handleApprove = async (id: string | number) => {
    if (!confirm('Are you sure you want to approve this application?')) return;

    setLoading(true);
    try {
      const res = await apiService.approveAccountOpening(id);
      if (res.success) {
        toast.success('Account Opening Approved Successfully');
        fetchRequests();
        setSelectedRequest(null);
      } else {
        toast.error(res.error || 'Approval failed');
      }
    } catch (_err) {
      toast.error('An unexpected error occurred during approval');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'staff') {
    return (
      <div className="space-y-6">
        <AccountOpeningTab />
        <GlassCard className="p-6 bg-blue-500/5 border-blue-500/10">
          <p className="text-xs text-blue-400 font-medium italic flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-400 shrink-0" />
            <span><b>Note:</b> After submitting, instruct the member to visit an Operations Manager for final document verification and letter collection.</span>
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 shadow-lg border border-slate-200/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-200/20 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </span>
              Secure Paper-First Queue
            </div>
            <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] ml-9 font-black">
              Physical KYC Compliance: April 2026
            </span>
          </h3>
          <Button 
            onClick={fetchRequests} 
            variant="ghost" 
            className="text-sm flex items-center gap-2"
            title="Refresh the onboarding requests list"
            aria-label="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-900 text-[10px] font-black uppercase tracking-widest border-b border-black/5">
                 <th className="px-4 py-2.5">Applicant</th>
                 <th className="px-4 py-2.5">Photo</th>
                 <th className="px-4 py-2.5">Type & Location</th>
                 <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.filter(r => r.status === 'pending').map((req) => (
                <tr key={req.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-black text-slate-900">{req.first_name} {req.last_name}</div>
                    <div className="text-[10px] text-slate-700 font-bold">{req.phone_number}</div>
                  </td>
                   <td className="px-4 py-3">
                     <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                       {req.photo ? (
                         <img 
                            src={getImageSrc(req.photo)} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                         />
                       ) : (
                         <User className="w-6 h-6 text-slate-300 opacity-50" />
                       )}
                     </div>
                   </td>
                   <td className="px-4 py-3">
                     <div className="text-xs text-blue-700 font-black uppercase tracking-widest">{req.account_type?.replace('_', ' ')}</div>
                     <div className="text-[10px] text-cyan-700 font-black font-mono mt-0.5">{req.digital_address || 'NO-GPS'}</div>
                     <div className="text-[10px] text-slate-800 font-bold mt-0.5 truncate max-w-[150px]">{req.address}</div>
                   </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] font-bold rounded-full border border-yellow-500/20 uppercase">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRequest(req)}
                        className="text-blue-700 font-black hover:text-blue-900 hover:bg-blue-500/10"
                        title="View applicant detailed information"
                        aria-label={`View details for ${req.first_name} ${req.last_name}`}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(req.id)}
                        className="text-red-700 font-black hover:text-red-900 hover:bg-red-500/10"
                        title="Reject account opening application"
                        aria-label={`Reject application for ${req.first_name} ${req.last_name}`}
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
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-900 font-black uppercase text-[10px] tracking-[0.3em] bg-slate-50 border-2 border-dashed border-slate-200 rounded-b-2xl">
                    No Active Onboarding Sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Applicant Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto border border-black/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-0.5">
                  {selectedRequest.first_name} {selectedRequest.last_name}
                </h3>
                <p className="text-blue-700 font-black uppercase tracking-widest text-xs">
                  {selectedRequest.account_type?.replace('_', ' ')} Application
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                }}
                className="p-2 hover:bg-black/10 rounded-full transition-colors text-slate-900"
                title="Close details modal"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Photo Section */}
              <div className="flex flex-col items-center gap-4">
                <h4 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] w-full text-center">Applicant Photo</h4>
                <div className="w-full aspect-square rounded-2xl bg-black/5 border border-black/10 overflow-hidden flex items-center justify-center shadow-inner group">
                  {selectedRequest.photo ? (
                    <img
                      src={getImageSrc(selectedRequest.photo)}
                      alt="Applicant"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <User className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                      <span className="text-[10px] text-slate-600 font-black">No Photo Attached</span>
                    </div>
                  )}
                </div>
                {selectedRequest.photo && (
                   <p className="text-[9px] text-emerald-700 font-black uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">Verified Capture</p>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <section>
                    <h4 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Personal Information</h4>
                    <div className="space-y-2 bg-black/5 p-4 rounded-xl border border-black/5">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Nationality</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.nationality || 'Ghanaian'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Date of Birth</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.date_of_birth}</span>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Contact Details</h4>
                    <div className="space-y-2 bg-black/5 p-4 rounded-xl border border-black/5">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Phone</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.phone_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Email</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.email || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-600 font-bold">Digital Address</span>
                        <span className="text-xs text-cyan-700 font-black font-mono tracking-wider">{selectedRequest.digital_address || 'Not Provided'}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-black/5 pt-2 mt-1">
                        <span className="text-xs text-slate-600 font-bold">Home Address</span>
                        <span className="text-xs text-slate-900 font-bold leading-relaxed">{selectedRequest.address}</span>
                      </div>
                    </div>
                  </section>
                </div>
                <div className="space-y-4">
                  <section>
                    <h4 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Identification</h4>
                    <div className="space-y-2 bg-black/5 p-4 rounded-xl border border-black/5">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Type</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.id_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">ID Number</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.id_number}</span>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h4 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Employment</h4>
                    <div className="space-y-2 bg-black/5 p-4 rounded-xl border border-black/5">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Occupation</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.occupation || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-600 font-bold">Work Location</span>
                        <span className="text-xs text-slate-900 font-black">{selectedRequest.location || '—'}</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Paper-First Compliance Information */}
            <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-200/20 rounded-xl mb-6">
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="block text-sm font-black text-slate-900 mb-1">KYC Verified Review</span>
                  <span className="block text-xs text-slate-600 leading-relaxed font-bold">
                    This applicant has provided all required physical documents. Review the details below and proceed with approval to generate their 24-month high-interest savings account.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-black/10">
              <Button
                variant="secondary"
                onClick={() => {
                  handleReject(selectedRequest.id);
                  setSelectedRequest(null);
                }}
                className="flex-1 py-3 border border-black/10 text-red-700 font-black hover:bg-red-500/10"
                title="Reject this onboarding application"
              >
                Reject Application
              </Button>
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
                disabled={loading}
                className="flex-[2] py-3 bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                title="Approve applicant and generate account credentials"
              >
                {loading ? 'Processing...' : 'Approve & Issue Credentials'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default OnboardingHub;
