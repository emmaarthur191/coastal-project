import React, { useState } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';

const AccountOpeningTab: React.FC = () => {
  const [accountOpeningData, setAccountOpeningData] = useState({
    account_type: 'savings',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nationality: '',
    address: '',
    phone_number: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [newAccountId, setNewAccountId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!accountOpeningData.first_name.trim() || !accountOpeningData.last_name.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required' });
      return;
    }

    if (!accountOpeningData.date_of_birth) {
      setMessage({ type: 'error', text: 'Date of birth is required' });
      return;
    }

    if (!accountOpeningData.phone_number.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return;
    }

    if (!accountOpeningData.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(accountOpeningData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('banking/account-openings/', accountOpeningData);
      setMessage({ type: 'success', text: 'Account opening request submitted successfully!' });
      setNewAccountId(response.data.account_id || 'New Account');
      setShowSuccess(true);

      // Reset form
      setAccountOpeningData({
        account_type: 'savings',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        nationality: '',
        address: '',
        phone_number: '',
        email: ''
      });
    } catch (error) {
      console.error('Error submitting account opening:', error);
      setMessage({ type: 'error', text: 'Failed to submit account opening request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setAccountOpeningData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>👶 Account Opening</h2>
        <p>Open new accounts for customers with complete validation and documentation.</p>

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

        {showSuccess && (
          <div style={{
            padding: '20px',
            marginBottom: '20px',
            borderRadius: '12px',
            backgroundColor: '#E8F5E8',
            border: '2px solid #4CAF50',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2E7D32', margin: '0 0 10px 0' }}>🎉 Account Opening Successful!</h3>
            <p style={{ margin: '0', color: '#2E7D32' }}>
              New account <strong>{newAccountId}</strong> has been created and is pending approval.
            </p>
            <PlayfulButton onClick={() => setShowSuccess(false)} variant="success" style={{ marginTop: '15px' }}>
              Create Another Account
            </PlayfulButton>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Account Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#636E72', marginLeft: '4px' }}>
              Account Type *
            </label>
            <select
              value={accountOpeningData.account_type}
              onChange={(e) => handleInputChange('account_type', e.target.value)}
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
              <option value="savings">Savings Account</option>
              <option value="checking">Checking Account</option>
              <option value="business">Business Account</option>
              <option value="student">Student Account</option>
            </select>
          </div>

          {/* Personal Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <PlayfulInput
              label="First Name *"
              value={accountOpeningData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter first name"
              required
            />
            <PlayfulInput
              label="Last Name *"
              value={accountOpeningData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <PlayfulInput
              label="Date of Birth *"
              type="date"
              value={accountOpeningData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              required
            />
            <PlayfulInput
              label="Nationality"
              value={accountOpeningData.nationality}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              placeholder="e.g., Ghanaian"
            />
          </div>

          {/* Contact Information */}
          <PlayfulInput
            label="Address"
            value={accountOpeningData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter full address"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <PlayfulInput
              label="Phone Number *"
              type="tel"
              value={accountOpeningData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              placeholder="+233 XX XXX XXXX"
              required
            />
            <PlayfulInput
              label="Email Address *"
              type="email"
              value={accountOpeningData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#F8F9FA', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2D3436' }}>Ready to Submit?</h3>
            <p style={{ margin: '0 0 20px 0', color: '#636E72' }}>
              Please review all information carefully. Once submitted, the account opening request will be processed for approval.
            </p>
            <PlayfulButton type="submit" disabled={loading} variant="success" style={{ width: '100%' }}>
              {loading ? 'Submitting...' : 'Submit Account Opening Request 📝'}
            </PlayfulButton>
          </div>
        </form>

        {/* Information Section */}
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#E3F2FD', borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1976D2' }}>📋 Requirements</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1976D2' }}>
            <li>Valid identification document</li>
            <li>Proof of address</li>
            <li>Initial deposit (varies by account type)</li>
            <li>Completed application form</li>
          </ul>
        </div>
      </PlayfulCard>
    </ErrorBoundary>
  );
};

export default AccountOpeningTab;