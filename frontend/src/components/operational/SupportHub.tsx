import React, { useState, useEffect, useCallback } from 'react';
import { apiService, Complaint, ServiceRequestExtended, ComplaintStats, CreateComplaintData, CreateServiceRequestData, LoginAttemptRecord, AuditLogRecord, ChatRoomData, ChatMessageData, User } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  MessageSquareQuote, 
  ClipboardList, 
  ShieldAlert, 
  PlusCircle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import OperationalMessenger from './OperationalMessenger';
import ErrorBoundary from '../ErrorBoundary';

interface SupportHubProps {
  mode: 'staff' | 'manager';
  initialTab?: 'complaints' | 'service_requests' | 'messaging';
}

type TabType = 'complaints' | 'service_requests' | 'messaging';

const SupportHub: React.FC<SupportHubProps> = ({ mode, initialTab = 'complaints' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestExtended[]>([]);
  const [complaintSummary, setComplaintSummary] = useState<ComplaintStats | null>(null);
  const [serviceStats, setServiceStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');

  // Messaging State
  const [threads, setThreads] = useState<ChatRoomData[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatRoomData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Form States
  const [complaintForm, setComplaintForm] = useState<CreateComplaintData>({
    category: 'account', priority: 'medium', subject: '', description: ''
  });
  const [serviceForm, setServiceForm] = useState<CreateServiceRequestData>({
    service_type: 'checkbook', delivery_method: 'pickup', notes: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'complaints') {
        const res = await apiService.getComplaints();
        if (res.success && res.data) setComplaints(res.data);
        if (mode === 'manager') {
          const sum = await apiService.getComplaintSummary();
          if (sum.success && sum.data) setComplaintSummary(sum.data);
        }
      } else if (activeTab === 'service_requests') {
        const res = await apiService.getServiceRequests();
        if (res.success && res.data) setServiceRequests(res.data);
        if (mode === 'manager') {
          const stats = await apiService.getServiceRequestStats();
          if (stats.success && stats.data) setServiceStats(stats.data);
        }
      } else if (activeTab === 'messaging') {
        const res = await apiService.getChatRooms();
        if (res.success && res.data) setThreads(res.data);
      } else {
        // Always ensure we have user context for messaging
        const authRes = await apiService.checkAuth();
        if (authRes.authenticated) setCurrentUser(authRes.user || null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to sync support data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, mode]);

  const fetchMessages = useCallback(async (roomId: string | number) => {
    setIsProcessing('loading_messages');
    try {
      const res = await apiService.getChatMessages(roomId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } finally {
      setIsProcessing(null);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;
    
    setIsProcessing('sending');
    try {
      const res = await apiService.sendChatMessage(selectedThread.id, newMessage);
      if (res.success) {
        setNewMessage('');
        fetchMessages(selectedThread.id);
      } else {
        toast.error(res.error || 'Failed to send message');
      }
    } finally {
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, mode, fetchData]);

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

  const handleResolveComplaint = async (id: number | string) => {
    if (!resolution) {
      toast.error('Resolution details required');
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.resolveComplaint(id, resolution);
      
      if (res.success) {
        toast.success('Complaint resolved');
        setSelectedComplaint(null);
        setResolution('');
        fetchData();
      } else {
        toast.error(res.error || 'Failed to resolve complaint');
      }
    } catch (error) {
      console.error('Complaint Resolution Error:', error);
      let errorMessage = 'An unexpected error occurred';
      
      interface ApiErrorResponse {
        response?: {
          data?: {
            error?: string;
            message?: string;
          };
        };
        message?: string;
      }

      if (typeof error === 'object' && error !== null) {
        const err = error as ApiErrorResponse;
        errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'complaints':
        return (
          <div className="space-y-6">
            {mode === 'manager' && complaintSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4 bg-emerald-500/5 items-center justify-center flex flex-col border border-emerald-200/20">
                  <span className="text-2xl font-black text-emerald-600">{complaintSummary.resolved_complaints}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Resolved</span>
                </GlassCard>
                <GlassCard className="p-4 bg-amber-500/5 items-center justify-center flex flex-col border border-amber-200/20">
                  <span className="text-2xl font-black text-amber-600">{complaintSummary.open_complaints}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Active</span>
                </GlassCard>
                <GlassCard className="p-4 bg-red-500/5 items-center justify-center flex flex-col border border-red-200/20">
                  <span className="text-2xl font-black text-red-600">{complaintSummary.escalated_complaints}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Escalated</span>
                </GlassCard>
                <GlassCard className="p-4 bg-blue-500/5 items-center justify-center flex flex-col border border-blue-200/20">
                  <span className="text-2xl font-black text-blue-600">{complaintSummary.total_complaints}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Total Logged</span>
                </GlassCard>
              </div>
            )}
            
            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 border-b border-black/5 bg-black/5 flex justify-between items-center">
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] ml-1">
                  Active Complaints
                </h4>
                <span className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Live Sync</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest px-2">Active Complaints Queue</h4>
              {complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length > 0 ? (
                complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').map((c) => (
                    <div key={c.id} className="p-4 hover:bg-black/5 transition-all cursor-pointer" onClick={() => setSelectedComplaint(c)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h5 className="text-sm font-black text-slate-900">{c.subject}</h5>
                             <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${c.priority === 'critical' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-900 border border-slate-300'}`}>
                               {c.priority}
                             </span>
                          </div>
                           <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest line-clamp-1">{c.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'}`}>
                            {c.status}
                          </span>
                          <p className="text-[8px] text-slate-900 font-black uppercase mt-1">{new Date(c.created_at || '').toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 italic text-sm">No active complaints found</div>
                )}
              </div>
              </div>
            </GlassCard>
          </div>
        );
      case 'service_requests':
        return (
          <div className="space-y-6">
            {mode === 'manager' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 bg-amber-500/5 items-center justify-center flex flex-col border border-amber-200/20">
                  <span className="text-2xl font-black text-amber-600">{serviceStats.pending || 0}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Pending</span>
                </GlassCard>
                <GlassCard className="p-4 bg-blue-500/5 items-center justify-center flex flex-col border border-blue-200/20">
                  <span className="text-2xl font-black text-blue-600">{serviceStats.in_progress || 0}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">In Progress</span>
                </GlassCard>
                <GlassCard className="p-4 bg-emerald-500/5 items-center justify-center flex flex-col border border-emerald-200/20">
                  <span className="text-2xl font-black text-emerald-600">{serviceStats.completed || 0}</span>
                  <span className="text-[10px] text-slate-900 uppercase font-black tracking-widest">Completed</span>
                </GlassCard>
              </div>
            )}
            
            <GlassCard className="p-0 overflow-hidden">
               <div className="p-4 border-b border-black/5 bg-black/5 flex justify-between items-center">
                <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] ml-1">
                  Active Service Requests
                </h4>
              </div>
              <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest px-2">Pending Service Queue</h4>
              {serviceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected').length > 0 ? (
                serviceRequests.filter(r => r.status !== 'completed' && r.status !== 'rejected').map((r) => (
                    <div key={r.id} className="p-4 hover:bg-black/5 transition-all">
                       <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-sm font-black text-slate-900">{r.service_type?.toUpperCase()}</h5>
                           <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest mt-1">Member: <span className="text-black font-black">{r.member_name}</span> ({r.member_id})</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-800 border border-blue-500/20'}`}>
                            {r.status?.replace('_', ' ')}
                          </span>
                          <span className="text-[8px] text-slate-900 font-black uppercase tracking-widest">{r.priority} Priority</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 italic text-sm">No pending service requests</div>
                )}
              </div>
            </GlassCard>
          </div>
        );
      case 'messaging':
        return (
          <ErrorBoundary>
            <OperationalMessenger
              threads={threads.map(t => ({
                id: t.id,
                subject: t.display_name || t.name || 'Conversation',
                participants: t.members,
                created_at: t.created_at
              }))}
              selectedThread={selectedThread ? {
                id: selectedThread.id,
                subject: selectedThread.display_name || selectedThread.name || 'Conversation',
                created_at: selectedThread.created_at
              } : null}
              messages={messages.map(m => ({
                id: m.id,
                content: m.content,
                is_me: m.sender === currentUser?.id,
                sender_name: m.sender_name,
                created_at: m.created_at
              }))}
              newMessage={newMessage}
              onSelectThread={(t) => {
                const fullThread = threads.find(thread => thread.id === t.id);
                if (fullThread) {
                  setSelectedThread(fullThread);
                  fetchMessages(fullThread.id);
                }
              }}
              onSendMessage={handleSendMessage}
              onNewMessageChange={(val) => setNewMessage(val)}
              isProcessing={isProcessing}
            />
          </ErrorBoundary>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex p-1 bg-black/5 rounded-xl border border-black/5">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'complaints' ? 'bg-coastal-primary text-white shadow-lg shadow-blue-500/20' : 'text-slate-900 hover:text-black font-black'}`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" /> Complaints Logging
          </button>
          <button
            onClick={() => setActiveTab('service_requests')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'service_requests' ? 'bg-coastal-primary text-white shadow-lg shadow-blue-500/20' : 'text-slate-900 hover:text-black'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Service Requests
          </button>
        </div>
        {mode === 'staff' && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
            {showForm ? 'Cancel Application' : `New ${activeTab === 'complaints' ? 'Complaint' : 'Request'}`}
            {!showForm && <PlusCircle className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {showForm && mode === 'staff' && (
        <GlassCard className="p-6 border border-black/10">
          <h3 className="text-lg font-black text-slate-900 mb-4">
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

      {renderContent()}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl border border-white/20 shadow-2xl relative">
            <button onClick={() => setSelectedComplaint(null)} className="absolute top-4 right-4 text-slate-900 hover:text-black p-2" aria-label="Close complaint details" title="Close complaint details">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 pt-4">
                <div>
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block mb-1">Issue Overview</span>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedComplaint.subject}</h2>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${selectedComplaint.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {selectedComplaint.status}
                  </span>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    Ref: #{selectedComplaint.id}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <GlassCard className="p-4 bg-black/5 border-0">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">Original Complaint</span>
                  <p className="text-sm text-slate-900 leading-relaxed font-black">{selectedComplaint.description}</p>
                </GlassCard>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">Category</span>
                    <span className="text-sm font-black text-slate-900">{selectedComplaint.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-1">Priority</span>
                    <span className={`text-sm font-bold ${selectedComplaint.priority === 'critical' ? 'text-red-600' : 'text-slate-900'}`}>
                      {selectedComplaint.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {selectedComplaint.status !== 'resolved' && mode === 'manager' && (
                  <div className="pt-6 border-t border-black/5">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-4 whitespace-nowrap">Admin Resolution Notes</span>
                    <Input 
                      as="textarea"
                      placeholder="Detail the steps taken to resolve this issue..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={4}
                      className="mb-4"
                    />
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>Close View</Button>
                      <Button onClick={() => handleResolveComplaint(selectedComplaint.id || '')} disabled={loading} className="flex items-center gap-2">
                        {loading ? 'Processing...' : 'Mark as Resolved'}
                        {!loading && <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedComplaint.status === 'resolved' && (
                  <div className="pt-6 border-t border-black/5">
                    <GlassCard className="p-4 bg-emerald-500/5 border-emerald-500/20">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Outcome / Resolution</span>
                      <p className="text-sm text-emerald-900 leading-relaxed font-bold italic">
                        {selectedComplaint.resolution || 'No explicit notes provided.'}
                      </p>
                    </GlassCard>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default SupportHub;
