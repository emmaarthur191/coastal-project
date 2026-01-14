import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import RequestServicesTab from '../components/member/RequestServicesTab';
import { MemberDashboardData, Transaction, Account, ServiceRequest } from '../services/api';

interface BackendStatus {
  balance: boolean;
  accounts: boolean;
  services: boolean;
  password: boolean;
  twofa: boolean;
}

function MemberDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [activeView, setActiveView] = useState('balance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab-specific state
  const [accountBalance, setAccountBalance] = useState<MemberDashboardData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false });

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  // Backend availability checks
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    balance: true,
    accounts: true,
    services: true,
    password: true,
    twofa: true
  });

  // --- DATA FETCHING FUNCTIONS ---
  // Using refs to avoid circular dependencies in useCallback
  const fetchAccountBalance = useCallback(async () => {
    try {
      const data = await authService.getMemberDashboardData();
      setAccountBalance(data);
      setTransactions(data.recent_transactions || []);
      return true;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return false;
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const result = await authService.getAccounts();
      if (result.success) {
        setAccounts(result.data);
        return true;
      } else {
        console.error('Error fetching accounts:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return false;
    }
  }, []);

  const fetchServiceRequests = useCallback(async () => {
    try {
      const result = await authService.getServiceRequests();
      if (result.success && result.data) {
        setServiceRequests(result.data.results || []);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching service requests:', error);
      return false;
    }
  }, []);

  const menuItems = [
    { id: 'balance', name: 'Account Balance', icon: '💰', available: backendStatus.balance },
    { id: 'accounts', name: 'Account Types', icon: '🏦', available: backendStatus.accounts },
    { id: 'services', name: 'Request Services', icon: '📋', available: backendStatus.services },
    { id: 'password', name: 'Change Password', icon: '🔒', available: true },
    { id: 'twofa', name: 'Activate 2FA', icon: '🔐', available: true }
  ];

  // --- EFFECTS ---
  // Single effect for initial data load - runs only once on mount
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [balanceOk, accountsOk, servicesOk] = await Promise.all([
          fetchAccountBalance(),
          fetchAccounts(),
          fetchServiceRequests()
        ]);

        if (isMounted) {
          setBackendStatus({
            balance: balanceOk,
            accounts: accountsOk,
            services: servicesOk,
            password: true,
            twofa: true
          });
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        if (isMounted) {
          setError('Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchAccountBalance, fetchAccounts, fetchServiceRequests]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backendStatus.password) {
      alert('Password change service unavailable');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    try {
      const result = await authService.changePassword(passwordForm);
      if (result.success) {
        alert('Password changed successfully!');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        alert('Failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };



  const handleSendOTP = async () => {
    try {
      const result = await authService.sendOTP({ phone_number: user.phone, verification_type: '2fa_setup' });
      if (result.success) {
        setOtpSent(true);
        setOtpExpiresIn(300);
        const timer = setInterval(() => {
          setOtpExpiresIn(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setOtpSent(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert('Failed to send OTP: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const result = await authService.verifyOTP({ phone_number: user.phone, otp_code: otpCode, verification_type: '2fa_setup' });
      if (result.success) {
        setTwoFactorStatus({ enabled: true });
        setOtpCode('');
        setOtpSent(false);
        alert('2FA enabled successfully!');
      } else {
        alert('Failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="Member Hub"
      user={user}
      menuItems={menuItems}
      activeView={activeView}
      onNavigate={setActiveView}
      onLogout={handleLogout}
    >
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <span className="mr-2">⚠️</span> {error}
        </div>
      )}

      {/* --- BALANCE VIEW --- */}
      {activeView === 'balance' && (
        <div className="space-y-6">
          {!backendStatus.balance ? (
            <Card className="bg-error-50 border-error-200">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-error-800">Service Unavailable</h3>
                <p className="text-error-600">Account balance service is currently down.</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none">
                  <h3 className="text-primary-100 font-medium mb-2">Total Balance</h3>
                  <div className="text-4xl font-bold mb-4">
                    {formatCurrencyGHS(accountBalance?.account_balance || 0)}
                  </div>
                  <div className="text-sm text-primary-200 flex items-center">
                    <span className="w-2 h-2 bg-success-400 rounded-full mr-2"></span>
                    Available
                  </div>
                </Card>
                <Card>
                  <h3 className="text-secondary-500 font-medium mb-2">Account Status</h3>
                  <div className="flex items-center mt-2">
                    <span className="px-3 py-1 bg-success-50 text-success-700 rounded-full text-sm font-bold border border-success-200">
                      Active
                    </span>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-secondary-900">Recent Transactions</h3>
                </div>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction, index) => {
                    const amount = parseFloat(transaction.amount);
                    const isPositive = amount > 0;
                    return (
                      <div key={index} className="flex justify-between items-center p-4 bg-secondary-50 rounded-lg border border-secondary-100 hover:border-primary-200 transition-colors">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-4 ${isPositive ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600'}`}>
                            {isPositive ? '↓' : '↑'}
                          </div>
                          <div>
                            <p className="font-semibold text-secondary-900">{transaction.description}</p>
                            <p className="text-xs text-secondary-500">{new Date(transaction.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${isPositive ? 'text-success-600' : 'text-secondary-900'}`}>
                          {formatCurrencyGHS(amount)}
                        </span>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <p className="text-center text-secondary-500 py-4">No recent transactions found.</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* --- ACCOUNTS VIEW --- */}
      {activeView === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account, index) => (
            <Card key={index} className="hover:border-primary-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600 text-xl">🏦</div>
                <span className="text-xs font-mono bg-secondary-100 text-secondary-600 px-2 py-1 rounded">
                  ****{account.account_number?.slice(-4) || '****'}
                </span>
              </div>
              <h4 className="text-lg font-bold text-secondary-900 mb-1">{account.account_type_display} Account</h4>
              <p className="text-2xl font-bold text-primary-600">{formatCurrencyGHS(parseFloat(account.balance || '0'))}</p>
            </Card>
          ))}
        </div>
      )}

      {/* --- SERVICES VIEW --- */}
      {activeView === 'services' && (
        <RequestServicesTab
          serviceRequests={serviceRequests}
          onRequestUpdate={fetchServiceRequests}
        />
      )}

      {/* --- PASSWORD VIEW --- */}
      {activeView === 'password' && (
        <div className="max-w-md mx-auto">
          <Card>
            <h3 className="text-lg font-bold text-secondary-900 mb-6">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-secondary-700 mb-1">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full rounded-lg border-secondary-300 border p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-secondary-700 mb-1">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full rounded-lg border-secondary-300 border p-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary-700 mb-1">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="w-full rounded-lg border-secondary-300 border p-2"
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="w-full mt-4">Update Password</Button>
            </form>
          </Card>
        </div>
      )}

      {/* --- 2FA VIEW --- */}
      {activeView === 'twofa' && (
        <div className="max-w-md mx-auto">
          <Card>
            <h3 className="text-lg font-bold text-secondary-900 mb-6">Two-Factor Authentication</h3>
            <p className="text-sm text-secondary-600 mb-6">Secure your account by enabling SMS-based 2FA. We'll send a code to your registered phone.</p>

            {twoFactorStatus.enabled && (
              <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center">
                <span className="text-success-600 mr-2">✓</span>
                <span className="text-sm font-medium text-success-700">2FA is currently enabled on your account</span>
              </div>
            )}

            {!otpSent ? (
              <Button onClick={handleSendOTP} className="w-full" disabled={twoFactorStatus.enabled}>
                {twoFactorStatus.enabled ? '2FA Already Enabled' : 'Send Verification Code'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-primary-700 mb-2">Code sent to your phone</p>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    className="text-center text-2xl tracking-widest w-full border-b-2 border-primary-300 focus:border-primary-600 outline-none bg-transparent py-2"
                    maxLength={6}
                  />
                  <p className="text-xs text-secondary-500 mt-2">Expires in {otpExpiresIn}s</p>
                </div>
                <Button onClick={handleVerifyOTP} variant="success" className="w-full">Verify & Enable</Button>
              </div>
            )}
          </Card>
        </div>
      )}

    </DashboardLayout>
  );
}

export default MemberDashboard;
