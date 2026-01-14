import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface ServiceRequest {
  id: string;
  member_id: string;
  member_name: string;
  service_type: string;
  priority: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const ServiceRequestsTab: React.FC = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [serviceRequestStats, setServiceRequestStats] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newServiceRequest, setNewServiceRequest] = useState({
    request_type: 'checkbook',
    description: '',
    delivery_method: 'pickup',
  });
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchServiceRequests();
    fetchServiceRequestStats();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('services/requests/');
      const data = response.data?.results || response.data || [];
      setServiceRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      setServiceRequests([]);
      setMessage({ type: 'error', text: 'Failed to load service requests' });
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceRequestStats = async () => {
    try {
      const response = await api.get<any>('services/stats/');
      setServiceRequestStats(response.data || {});
    } catch (error) {
      console.error('Error fetching service request stats:', error);
    }
  };

  const handleCreateServiceRequest = async () => {
    if (!newServiceRequest.request_type) {
      setMessage({ type: 'error', text: 'Please select a request type' });
      return;
    }

    try {
      setServiceRequestLoading(true);
      await api.post<any>('services/requests/', newServiceRequest);
      setMessage({ type: 'success', text: 'Service request created successfully' });
      setShowNewRequest(false);
      setNewServiceRequest({
        request_type: 'checkbook',
        description: '',
        delivery_method: 'pickup',
      });
      fetchServiceRequests();
      fetchServiceRequestStats();
    } catch (error) {
      console.error('Error creating service request:', error);
      setMessage({ type: 'error', text: 'Failed to create service request' });
    } finally {
      setServiceRequestLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-gray-500 bg-gray-50 border-gray-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'urgent': return 'text-red-600 bg-red-50 border-red-100 font-bold';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Service Requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>🛎️</span> Service Requests
          </h2>
          <p className="text-gray-500">Manage customer service requests and track their status.</p>
        </div>
        <Button onClick={() => setShowNewRequest(true)} variant="success">
          New Request ➕
        </Button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 text-center border-b-4 border-amber-300">
          <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-2">Pending</h4>
          <p className="text-4xl font-black text-amber-500">{serviceRequestStats.pending || 0}</p>
        </GlassCard>
        <GlassCard className="p-6 text-center border-b-4 border-blue-300">
          <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-2">In Progress</h4>
          <p className="text-4xl font-black text-blue-500">{serviceRequestStats.in_progress || 0}</p>
        </GlassCard>
        <GlassCard className="p-6 text-center border-b-4 border-emerald-300">
          <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-2">Completed</h4>
          <p className="text-4xl font-black text-emerald-500">{serviceRequestStats.completed || 0}</p>
        </GlassCard>
      </div>

      {/* Service Requests List */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">All Service Requests ({serviceRequests.length})</h3>
        {serviceRequests.length === 0 ? (
          <p className="text-gray-400 italic text-center py-8">No service requests found</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {serviceRequests.map((request) => (
              <div key={request.id} className="bg-white border boundary-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-lg">
                        {request.service_type === 'checkbook' ? 'Checkbook' :
                          request.service_type === 'statement' ? 'Statement' :
                            request.service_type === 'card' ? 'ATM Card' : request.service_type}
                      </h4>
                      <span className="text-xs font-mono text-gray-400">#{request.id.slice(-8)}</span>
                    </div>

                    <p className="text-sm text-gray-500">
                      Member: <span className="text-gray-800 font-semibold">{request.member_name}</span> ({request.member_id})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getPriorityColor(request.priority)}`}>
                      {request.priority} Priority
                    </span>
                  </div>
                </div>

                {request.notes && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4 border border-gray-100 italic">
                    "{request.notes}"
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                  <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                  <Button size="sm" variant="ghost" className="text-coastal-primary hover:bg-blue-50">View Details →</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* New Service Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 border-b border-gray-100 pb-2">Create New Service Request</h3>

            <div className="space-y-4">
              <Input
                as="select"
                label="Request Type"
                id="request-type"
                title="Select the type of service being requested"
                value={newServiceRequest.request_type}
                onChange={(e) => setNewServiceRequest(prev => ({ ...prev, request_type: e.target.value }))}
              >
                <option value="checkbook">Cheque Book</option>
                <option value="statement">Account Statement</option>
                <option value="card_replacement">Card Replacement</option>
                <option value="account_closure">Account Closure</option>
                <option value="address_change">Address Change</option>
                <option value="other">Other</option>
              </Input>

              <Input
                as="select"
                label="Delivery Method"
                id="delivery-method"
                title="Select how to deliver this request"
                value={newServiceRequest.delivery_method}
                onChange={(e) => setNewServiceRequest(prev => ({ ...prev, delivery_method: e.target.value }))}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="pickup">Branch Pickup</option>
                <option value="mail">Postal Mail</option>
              </Input>

              <Input
                as="textarea"
                label="Description"
                id="description"
                title="Additional details for the service request"
                value={newServiceRequest.description}
                onChange={(e) => setNewServiceRequest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end mt-8 border-t border-gray-100 pt-4">
              <Button onClick={() => setShowNewRequest(false)} variant="secondary" disabled={serviceRequestLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateServiceRequest} disabled={serviceRequestLoading} variant="success">
                {serviceRequestLoading ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestsTab;
