import React, { useState, useEffect } from 'react';
import { apiService, Complaint, ServiceRequestExtended, CashAdvanceExtended, RefundExtended, ComplaintStats, CreateComplaintData, CreateServiceRequestData } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'react-hot-toast';
import OperationalMessenger from './OperationalMessenger';
import ErrorBoundary from '../ErrorBoundary';

interface SupportHubProps {
  mode: 'staff' | 'manager';
  initialTab?: 'complaints' | 'service_requests' | 'messaging';
}

const SupportHub: React.FC<SupportHubProps> = ({ mode, initialTab = 'complaints' }) => {
  const [activeTab, setActiveTab] = useState<'complaints' | 'service_requests' | 'messaging'>(initialTab);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestExtended[]>([]);
  const [complaintSummary, setComplaintSummary] = useState<ComplaintStats | null>(null);
  const [serviceStats, setServiceStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form States
  const [complaintForm, setComplaintForm] = useState<CreateComplaintData>({
    category: 'account', priority: 'medium', subject: '', description: ''
  });
  const [serviceForm, setServiceForm] = useState<CreateServiceRequestData>({
    service_type: 'checkbook', delivery_method: 'pickup', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, mode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'complaints') {
        const res = await apiService.getComplaints();
        if (res.success && res.data) setComplaints(res.data.results || []);
        if (mode === 'manager') {
          const sum = await apiService.getComplaintSummary();
          if (sum.success && sum.data) setComplaintSummary(sum.data);
        }
      } else if (activeTab === 'service_requests') {
        const res = await apiService.getServiceRequests();
        if (res.success && res.data) setServiceRequests(res.data.results || []);
        if (mode === 'manager') {
          const stats = await apiService.getServiceRequestStats();
          if (stats.success && stats.data) setServiceStats(stats.data);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync support data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiService.submitComplaint(complaintForm);
    if (res.success) {
      toast.success('Complaint logged successfully');
      setShowForm(false);
      setComplaintForm({ category: 'account', priority: 'medium', subject: '', description: '' });
      fetchData();
    } else {
      toast.error(res.error || 'Submission failed');
    }
    setLoading(false);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiService.submitServiceRequest(serviceForm);
    if (res.success) {
      toast.success('Service request submitted');
      setShowForm(false);
      setServiceForm({ service_type: 'checkbook', delivery_method: 'pickup', notes: '' });
      fetchData();
    } else {
      toast.error(res.error || 'Submission failed');
    }
    setLoading(false);
  };

  const renderStats = () => {
    if (mode !== 'manager') return null;
    switch (activeTab) {
      case 'complaints':
        if (!complaintSummary) return null;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-4 bg-emerald-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">{complaintSummary.resolved_complaints}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Resolved</span>
            </GlassCard>
            <GlassCard className="p-4 bg-amber-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-amber-400">{complaintSummary.open_complaints}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Active</span>
            </GlassCard>
            <GlassCard className="p-4 bg-red-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-red-400">{complaintSummary.escalated_complaints}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Escalated</span>
            </GlassCard>
            <GlassCard className="p-4 bg-blue-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-blue-400">{complaintSummary.total_complaints}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Total Logged</span>
            </GlassCard>
          </div>
        );
      case 'service_requests':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <GlassCard className="p-4 bg-amber-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-amber-400">{serviceStats.pending || 0}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Pending Approval</span>
            </GlassCard>
            <GlassCard className="p-4 bg-blue-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-blue-400">{serviceStats.in_progress || 0}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">In Fulfillment</span>
            </GlassCard>
            <GlassCard className="p-4 bg-emerald-500/5 items-center justify-center flex flex-col">
              <span className="text-2xl font-bold text-emerald-400">{serviceStats.completed || 0}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Completed</span>
            </GlassCard>
          </div>
        );
      case 'messaging':
        return (
          <ErrorBoundary>
            <OperationalMessenger
              threads={[]}
              selectedThread={null}
              messages={[]}
              newMessage=""
              onSelectThread={() => {}}
              onSendMessage={() => {}}
              onNewMessageChange={() => {}}
            />
          </ErrorBoundary>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'complaints' ? 'bg-coastal-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Complaints Logging
          </button>
          <button
            onClick={() => setActiveTab('service_requests')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'service_requests' ? 'bg-coastal-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Service Requests
          </button>
        </div>
        {mode === 'staff' && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Cancel Application' : `New ${activeTab === 'complaints' ? 'Complaint' : 'Request'} ➕`}
          </Button>
        )}
      </div>

      {renderStats()}

      {/* Forms */}
      {showForm && mode === 'staff' && (
        <GlassCard className="p-6 border border-coastal-primary/20">
          <h3 className="text-lg font-bold text-white mb-4">
            {activeTab === 'complaints' ? 'Log New Complaint' : 'New Service Request'}
          </h3>
          <form onSubmit={activeTab === 'complaints' ? handleSubmitComplaint : handleSubmitService} className="space-y-4">
            {activeTab === 'complaints' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input as="select" label="Category" value={complaintForm.category} onChange={e => setComplaintForm({...complaintForm, category: e.target.value})}>
                    <option value="account">Account Issues</option>
                    <option value="transaction">Transaction Dispute</option>
                    <option value="technical">App/System Bug</option>
                    <option value="service" >Service Quality</option>
                  </Input>
                  <Input as="select" label="Priority" value={complaintForm.priority} onChange={e => setComplaintForm({...complaintForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Input>
                </div>
                <Input label="Subject" value={complaintForm.subject} onChange={e => setComplaintForm({...complaintForm, subject: e.target.value})} required placeholder="Short summary of issue" />
                <Input as="textarea" label="Description" value={complaintForm.description} onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} required rows={3} />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input as="select" label="Request Type" value={serviceForm.service_type} onChange={e => setServiceForm({...serviceForm, service_type:e.target.value})}>
                    <option value="checkbook">Cheque Book</option>
                    <option value="statement">Account Statement</option>
                    <option value="card_replacement">Card Replacement</option>
                  </Input>
                  <Input as="select" label="Delivery" value={serviceForm.delivery_method} onChange={e => setServiceForm({...serviceForm, delivery_method:e.target.value})}>
                    <option value="pickup">Branch Pickup</option>
                    <option value="email">Email (E-Statement)</option>
                    <option value="post">Registered Mail</option>
                  </Input>
                </div>
                <Input as="textarea" label="Additional Notes" value={serviceForm.notes} onChange={e => setServiceForm({...serviceForm, notes: e.target.value})} rows={2} />
              </>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Submit to System'}
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* List Views */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h4 className="font-bold text-gray-300 uppercase text-xs tracking-widest">
            Recent {activeTab === 'complaints' ? 'Complaints' : 'Requests'}
          </h4>
          <span className="text-[10px] text-gray-500 font-mono">Live Sync Active</span>
        </div>
        <div className="divide-y divide-white/5">
          {activeTab === 'complaints' ? (
            complaints.length > 0 ? complaints.map(c => (
              <div key={c.id} className="p-4 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-bold text-white">{c.subject}</h5>
                    <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500 italic text-sm">No complaints logged yet</div>
          ) : (
            serviceRequests.length > 0 ? serviceRequests.map(r => (
              <div key={r.id} className="p-4 hover:bg-white/5 transition-all">
                 <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-bold text-white">{r.service_type?.toUpperCase()}</h5>
                    <p className="text-xs text-gray-500">Member: {r.member_name} ({r.member_id})</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono uppercase">{r.priority} Priority</span>
                  </div>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500 italic text-sm">No service requests found</div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default SupportHub;
