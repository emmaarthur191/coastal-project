import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

const AccountClosureTab: React.FC = () => {
  const [accountClosureData, setAccountClosureData] = useState({
    account_id: '',
    closure_reason: '',
    other_reason: '',
    confirmation: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  const fetchAccountDetails = async () => {
    if (!accountClosureData.account_id) {
      setMessage({ type: 'error', text: 'Please enter account ID' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`accounts/${accountClosureData.account_id}/`);
      setAccountDetails(response.data);
      // Auto-fill phone number from account if available
      if (response.data.phone_number) {
        setAccountClosureData(prev => ({ ...prev, phone_number: response.data.phone_number }));
      }
      setMessage({ type: 'success', text: 'Account details loaded successfully' });
    } catch (error) {
      console.error('Error fetching account details:', error);
      setMessage({ type: 'error', text: 'Account not found or access denied' });
      setAccountDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for account closure verification
  const sendOtp = async () => {
    if (!accountClosureData.phone_number.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required for OTP verification' });
      return;
    }

    try {
      setOtpLoading(true);
      const response = await api.post('banking/account-openings/send_otp/', {
        phone_number: accountClosureData.phone_number,
        operation_type: 'account_closure'
      });

      setOtpSent(true);
      setDebugOtp(response.data.debug_otp || '');
      setMessage({ type: 'success', text: `OTP sent to ${accountClosureData.phone_number}` });
    } catch (error) {
      console.error('Error sending OTP:', error);
      setMessage({ type: 'error', text: 'Failed to send OTP. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and submit account closure
  const verifyAndSubmit = async () => {
    if (!otpCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter the OTP code' });
      return;
    }

    try {
      setOtpLoading(true);

      // First verify OTP
      const verifyResponse = await api.post('users/verify-otp/', {
        phone_number: accountClosureData.phone_number,
        otp_code: otpCode,
        verification_type: 'account_closure'
      });

      // If verification successful, proceed with closure
      if (verifyResponse.data.success || verifyResponse.data.verified) {
        const closureData = {
          account_id: accountClosureData.account_id,
          closure_reason: accountClosureData.closure_reason,
          other_reason: accountClosureData.other_reason,
          phone_number: accountClosureData.phone_number,
          confirmed: true,
          otp_verified: true
        };

        await api.post('banking/account-closures/', closureData);
        setMessage({ type: 'success', text: 'Account closure request submitted successfully with OTP verification!' });

        // Reset form
        setAccountClosureData({
          account_id: '',
          closure_reason: '',
          other_reason: '',
          confirmation: '',
          phone_number: ''
        });
        setAccountDetails(null);
        setShowConfirmation(false);
        setShowOtpModal(false);
        setOtpCode('');
        setOtpSent(false);
        setDebugOtp('');
      } else {
        setMessage({ type: 'error', text: 'OTP verification failed' });
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to verify OTP. Please try again.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setOtpSent(false);
    setDebugOtp('');
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

    if (!accountClosureData.phone_number.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required for OTP verification' });
      return;
    }

    // Show OTP modal instead of direct submission
    setShowConfirmation(false);
    setShowOtpModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🔒</span> Account Closure
        </h2>
        <p className="text-gray-500">Securely close customer accounts with OTP verification.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      {/* Account Lookup */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Account Lookup</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Input
              label="Account ID"
              value={accountClosureData.account_id}
              onChange={(e) => setAccountClosureData(prev => ({ ...prev, account_id: e.target.value }))}
              placeholder="Enter account ID to lookup"
            />
          </div>
          <Button onClick={fetchAccountDetails} disabled={loading} variant="primary" className="w-full sm:w-auto">
            {loading ? 'Loading...' : 'Lookup Account 🔍'}
          </Button>
        </div>
      </GlassCard>

      {/* Account Details */}
      {accountDetails && (
        <GlassCard className="p-6 bg-gradient-to-br from-gray-50 to-white">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Account Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Account ID</span>
              <span className="font-mono text-gray-800">{accountDetails.id}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Type</span>
              <span className="text-gray-800">{accountDetails.account_type}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</span>
              <span className="text-xl font-bold text-coastal-primary">₵{accountDetails.balance}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${accountDetails.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {accountDetails.status || 'Active'}
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</span>
              <span className="text-gray-800">{accountDetails.customer_name || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Opened</span>
              <span className="text-gray-800">{new Date(accountDetails.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Closure Form */}
      {accountDetails && (
        <GlassCard className="p-8 border-l-4 border-l-red-500 ring-1 ring-red-100">
          <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">⚠️ Closure Request</h3>
          <p className="text-red-800 font-medium mb-6 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
            Warning: This action cannot be undone. The account will be permanently closed.
          </p>

          <div className="space-y-6">
            <Input
              label="Customer Phone Number (for OTP verification) *"
              value={accountClosureData.phone_number}
              onChange={(e) => setAccountClosureData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+233 XX XXX XXXX"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Reason for Closure *
              </label>
              <select
                value={accountClosureData.closure_reason}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, closure_reason: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none bg-white"
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
              <Input
                label="Please specify reason"
                value={accountClosureData.other_reason}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, other_reason: e.target.value }))}
                placeholder="Provide details..."
              />
            )}

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-amber-800 font-bold mb-2 text-sm uppercase tracking-wide">
                Confirmation Required
              </p>
              <p className="text-amber-700 mb-3 text-sm">
                Type "CLOSE" in the box below to confirm account closure:
              </p>
              <Input
                value={accountClosureData.confirmation}
                onChange={(e) => setAccountClosureData(prev => ({ ...prev, confirmation: e.target.value }))}
                placeholder="Type CLOSE to confirm"
                className="border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={loading || !accountClosureData.closure_reason || accountClosureData.confirmation !== 'CLOSE' || !accountClosureData.phone_number.trim()}
              variant="danger"
              className="w-full justify-center py-4 font-bold text-lg shadow-lg shadow-red-100"
            >
              {loading ? 'Processing...' : 'Submit Closure Request 🚫'}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Final Confirmation</h3>
            <p className="mb-2">Are you absolutely sure you want to close account <strong>{accountClosureData.account_id}</strong>?</p>
            <p className="mb-4 text-gray-500 text-sm">This will permanently close the account and cannot be reversed.</p>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100 mb-6">
              📱 An OTP will be sent to <strong>{accountClosureData.phone_number}</strong> for verification.
            </p>

            <div className="flex gap-3 justify-end">
              <Button onClick={() => setShowConfirmation(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleClosureSubmit} disabled={loading} variant="danger">
                {loading ? 'Processing...' : 'Proceed with OTP Verification'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📱 Phone Verification
            </h3>

            <p className="text-gray-600 mb-6">
              For security, we need to verify via phone: <strong>{accountClosureData.phone_number}</strong>
            </p>

            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl mb-6 text-sm border border-amber-100">
              ⚠️ Closing account: <strong>{accountClosureData.account_id}</strong>
            </div>

            {!otpSent ? (
              <div>
                <Button
                  onClick={sendOtp}
                  disabled={otpLoading}
                  variant="primary"
                  className="w-full justify-center"
                >
                  {otpLoading ? 'Sending...' : '📤 Send OTP Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 text-green-700 p-3 rounded-xl text-center border border-green-100">
                  <p className="font-bold">✅ OTP sent successfully!</p>
                  {debugOtp && (
                    <p className="text-xs mt-1 text-green-600/70">Debug OTP: {debugOtp}</p>
                  )}
                </div>

                <Input
                  label="Enter 6-digit OTP Code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />

                <div className="flex gap-3">
                  <Button
                    onClick={verifyAndSubmit}
                    disabled={otpLoading || otpCode.length !== 6}
                    variant="danger"
                    className="flex-1 justify-center"
                  >
                    {otpLoading ? 'Verifying...' : '✅ Verify & Close'}
                  </Button>
                  <Button
                    onClick={sendOtp}
                    disabled={otpLoading}
                    variant="secondary"
                  >
                    🔄 Resend
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={closeOtpModal}
              variant="ghost"
              className="w-full mt-6 text-gray-400 hover:text-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountClosureTab;
