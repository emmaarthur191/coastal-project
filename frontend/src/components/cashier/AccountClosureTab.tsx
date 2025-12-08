import React, { useState } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';

const AccountClosureTab: React.FC = () => {
  const [accountClosureData, setAccountClosureData] = useState({
    account_id: '',
    closure_reason: '',
    other_reason: '',
    confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAccountDetails = async () => {
    if (!accountClosureData.account_id) {
      setMessage({ type: 'error', text: 'Please enter account ID' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`banking/accounts/${accountClosureData.account_id}/`);
      setAccountDetails(response.data);
      setMessage({ type: 'success', text: 'Account details loaded successfully' });
    } catch (error) {
      console.error('Error fetching account details:', error);
      setMessage({ type: 'error', text: 'Account not found or access denied' });
      setAccountDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClosureSubmit = async () => {
    if (!accountDetails) {
      setMessage({ type: 'error', text: 'Please load account details first' });
      return;
    }

    if (!accountClosureData.closure_reason) {
      setMessage({ type: 'error', text: 'Please select a closure reason' });
      return;
    }

    if (accountClosureData.closure_reason === 'other' && !accountClosureData.other_reason.trim()) {
      setMessage({ type: 'error', text: 'Please provide details for other reason' });
      return;
    }

    if (accountClosureData.confirmation !== 'CLOSE') {
      setMessage({ type: 'error', text: 'Please type "CLOSE" to confirm' });
      return;
    }

    try {
      setLoading(true);
      const closureData = {
        account_id: accountClosureData.account_id,
        closure_reason: accountClosureData.closure_reason,
        other_reason: accountClosureData.other_reason,
        confirmed: true
      };

      await api.post('banking/account-closures/', closureData);
      setMessage({ type: 'success', text: 'Account closure request submitted successfully' });

      // Reset form
      setAccountClosureData({
        account_id: '',
        closure_reason: '',
        other_reason: '',
        confirmation: ''
      });
      setAccountDetails(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error submitting closure:', error);
      setMessage({ type: 'error', text: 'Failed to submit account closure request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>🔒 Account Closure</h2>
        <p>Securely close customer accounts with proper validation and documentation.</p>

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

        {/* Account Lookup */}
        <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #DFE6E9', borderRadius: '12px' }}>
          <h3>Account Lookup</h3>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <PlayfulInput
                label="Account ID"
                value={accountClosureData.account_id}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, account_id: e.target.value }))}
                placeholder="Enter account ID to lookup"
              />
            </div>
            <PlayfulButton onClick={fetchAccountDetails} disabled={loading} variant="primary">
              {loading ? 'Loading...' : 'Lookup Account 🔍'}
            </PlayfulButton>
          </div>
        </div>

        {/* Account Details */}
        {accountDetails && (
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>
            <h3>Account Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Account ID:</strong> {accountDetails.id}
              </div>
              <div>
                <strong>Account Type:</strong> {accountDetails.account_type}
              </div>
              <div>
                <strong>Balance:</strong> ₵{accountDetails.balance}
              </div>
              <div>
                <strong>Status:</strong> {accountDetails.status}
              </div>
              <div>
                <strong>Owner:</strong> {accountDetails.customer_name}
              </div>
              <div>
                <strong>Opened:</strong> {new Date(accountDetails.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Closure Form */}
        {accountDetails && (
          <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #FF7675', borderRadius: '12px' }}>
            <h3 style={{ color: '#D63031' }}>Closure Request</h3>
            <p style={{ color: '#D63031', fontWeight: 'bold' }}>
              ⚠️ Warning: This action cannot be undone. The account will be permanently closed.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72', marginLeft: '4px' }}>
                Reason for Closure *
              </label>
              <select
                value={accountClosureData.closure_reason}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, closure_reason: e.target.value }))}
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
                <option value="">Select reason...</option>
                <option value="customer_request">Customer Request</option>
                <option value="account_inactive">Account Inactive</option>
                <option value="fraud_suspected">Fraud Suspected</option>
                <option value="compliance">Compliance Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            {accountClosureData.closure_reason === 'other' && (
              <PlayfulInput
                label="Please specify reason"
                value={accountClosureData.other_reason}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, other_reason: e.target.value }))}
                placeholder="Provide details..."
              />
            )}

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#FFF3CD', borderRadius: '8px', border: '1px solid #FFEAA7' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#D68910' }}>
                Confirmation Required
              </p>
              <p style={{ margin: '0 0 10px 0', color: '#856404' }}>
                Type "CLOSE" in the box below to confirm account closure:
              </p>
              <PlayfulInput
                value={accountClosureData.confirmation}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, confirmation: e.target.value }))}
                placeholder="Type CLOSE to confirm"
              />
            </div>

            <PlayfulButton
              onClick={() => setShowConfirmation(true)}
              disabled={loading || !accountClosureData.closure_reason || accountClosureData.confirmation !== 'CLOSE'}
              variant="danger"
            >
              {loading ? 'Processing...' : 'Submit Closure Request 🚫'}
            </PlayfulButton>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
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
              width: '400px',
              maxWidth: '90%'
            }}>
              <h3 style={{ color: '#D63031' }}>⚠️ Final Confirmation</h3>
              <p>Are you absolutely sure you want to close account <strong>{accountClosureData.account_id}</strong>?</p>
              <p>This will permanently close the account and cannot be reversed.</p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <PlayfulButton onClick={() => setShowConfirmation(false)} variant="primary">
                  Cancel
                </PlayfulButton>
                <PlayfulButton onClick={handleClosureSubmit} disabled={loading} variant="danger">
                  {loading ? 'Closing...' : 'Yes, Close Account'}
                </PlayfulButton>
              </div>
            </div>
          </div>
        )}
      </PlayfulCard>
    </ErrorBoundary>
  );
};

export default AccountClosureTab;