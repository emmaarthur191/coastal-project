import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';

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
    member_id: '',
    service_type: 'checkbook',
    priority: 'normal',
    notes: '',
    quantity: 1,
    delivery_method: 'pickup',
    delivery_address: '',
    special_instructions: '',
    statement_type: 'monthly',
    delivery_method_statement: 'digital',
    start_date: '',
    end_date: '',
    account_number: '',
    info_type: 'balance',
    delivery_method_loan: 'digital',
    loan_account_number: ''
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
      const response = await api.get('services/requests/');
      setServiceRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      setMessage({ type: 'error', text: 'Failed to load service requests' });
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceRequestStats = async () => {
    try {
      const response = await api.get('services/stats/');
      setServiceRequestStats(response.data || {});
    } catch (error) {
      console.error('Error fetching service request stats:', error);
    }
  };

  const handleCreateServiceRequest = async () => {
    if (!newServiceRequest.member_id) {
      setMessage({ type: 'error', text: 'Please enter member ID' });
      return;
    }

    try {
      setServiceRequestLoading(true);
      await api.post('services/requests/', newServiceRequest);
      setMessage({ type: 'success', text: 'Service request created successfully' });
      setShowNewRequest(false);
      setNewServiceRequest({
        member_id: '',
        service_type: 'checkbook',
        priority: 'normal',
        notes: '',
        quantity: 1,
        delivery_method: 'pickup',
        delivery_address: '',
        special_instructions: '',
        statement_type: 'monthly',
        delivery_method_statement: 'digital',
        start_date: '',
        end_date: '',
        account_number: '',
        info_type: 'balance',
        delivery_method_loan: 'digital',
        loan_account_number: ''
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
      case 'pending': return '#FDCB6E';
      case 'in_progress': return '#74B9FF';
      case 'completed': return '#00B894';
      case 'cancelled': return '#FF7675';
      default: return '#636E72';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#00B894';
      case 'normal': return '#FDCB6E';
      case 'high': return '#FF7675';
      case 'urgent': return '#E17055';
      default: return '#636E72';
    }
  };

  if (loading) {
    return (
      <PlayfulCard>
        <h2>🛎️ Service Requests</h2>
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="200px" style={{ marginTop: '20px' }} />
      </PlayfulCard>
    );
  }

  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>🛎️ Service Requests</h2>
        <p>Manage customer service requests and track their status.</p>

        {message.text && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
            color: message.type === 'error' ? '#C62828' : '#2E7D32',
            border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div style={{ padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#FDCB6E' }}>Pending</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{serviceRequestStats.pending || 0}</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#74B9FF' }}>In Progress</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{serviceRequestStats.in_progress || 0}</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#00B894' }}>Completed</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{serviceRequestStats.completed || 0}</p>
          </div>
        </div>

        {/* Create New Request Button */}
        <div style={{ marginBottom: '30px' }}>
          <PlayfulButton onClick={() => setShowNewRequest(true)} variant="success">
            New Service Request ➕
          </PlayfulButton>
        </div>

        {/* Service Requests List */}
        <div>
          <h3>All Service Requests ({serviceRequests.length})</h3>
          {serviceRequests.length === 0 ? (
            <p style={{ color: '#636E72', fontStyle: 'italic' }}>No service requests found</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {serviceRequests.map((request) => (
                <div key={request.id} style={{
                  border: '1px solid #DFE6E9',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#2D3436' }}>
                        Request #{request.id.slice(-8)}
                      </h4>
                      <p style={{ margin: '0', color: '#636E72', fontSize: '14px' }}>
                        Member: {request.member_name} ({request.member_id})
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getStatusColor(request.status)
                      }}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getPriorityColor(request.priority)
                      }}>
                        {request.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                      Service: {request.service_type}
                    </p>
                    {request.notes && (
                      <p style={{ margin: '0', color: '#636E72', fontSize: '14px' }}>
                        Notes: {request.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#636E72' }}>
                      Created: {new Date(request.created_at).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <PlayfulButton onClick={() => {/* Update status */}} variant="primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                        Update
                      </PlayfulButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Service Request Modal */}
        {showNewRequest && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3>Create New Service Request</h3>

              <PlayfulInput
                label="Member ID"
                value={newServiceRequest.member_id}
                onChange={(e) => setNewServiceRequest(prev => ({ ...prev, member_id: e.target.value }))}
                placeholder="Enter member ID"
              />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72', marginLeft: '4px' }}>
                  Service Type
                </label>
                <select
                  value={newServiceRequest.service_type || 'checkbook'}
                  onChange={(e) => setNewServiceRequest(prev => ({ ...prev, service_type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `3px solid #DFE6E9`,
                    fontSize: '16px',
                    outline: 'none',
                    background: '#F9F9F9'
                  }}
                >
                  <option value="checkbook">Checkbook Request</option>
                  <option value="statement">Account Statement</option>
                  <option value="card">ATM Card</option>
                  <option value="loan_info">Loan Information</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72', marginLeft: '4px' }}>
                  Priority
                </label>
                <select
                  value={newServiceRequest.priority}
                  onChange={(e) => setNewServiceRequest(prev => ({ ...prev, priority: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: `3px solid #DFE6E9`,
                    fontSize: '16px',
                    outline: 'none',
                    background: '#F9F9F9'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <PlayfulInput
                label="Notes"
                value={newServiceRequest.notes}
                onChange={(e) => setNewServiceRequest(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <PlayfulButton onClick={() => setShowNewRequest(false)} variant="danger">
                  Cancel
                </PlayfulButton>
                <PlayfulButton onClick={handleCreateServiceRequest} disabled={serviceRequestLoading} variant="success">
                  {serviceRequestLoading ? 'Creating...' : 'Create Request'}
                </PlayfulButton>
              </div>
            </div>
          </div>
        )}
      </PlayfulCard>
    </ErrorBoundary>
  );
};

export default ServiceRequestsTab;