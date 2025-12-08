import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { apiService, authService } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#F0F4F8',
    primary: '#6C5CE7', // Purple
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon Red
    warning: '#FDCB6E', // Mustard
    info: '#74B9FF', // Sky Blue
    white: '#FFFFFF',
    text: '#2D3436',
    muted: '#636E72',
    border: '#DFE6E9',
  },
  shadows: {
    card: '0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.15)', // "Pressed" 3D effect
    buttonActive: '0 2px 0px rgba(0,0,0,0.15)',
  },
  radius: {
    small: '12px',
    medium: '20px',
    large: '35px',
    round: '50px'
  }
};

// --- STYLED SUB-COMPONENTS ---

const PlayfulCard = ({ children, color = THEME.colors.white, style = {} }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.medium,
    boxShadow: THEME.shadows.card,
    padding: '24px',
    border: '3px solid white',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style, disabled = false }) => {
  const bg = variant === 'danger' ? THEME.colors.danger :
            variant === 'success' ? THEME.colors.success :
            THEME.colors.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#ccc' : bg,
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: THEME.radius.round,
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: THEME.shadows.button,
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(4px)';
          e.currentTarget.style.boxShadow = THEME.shadows.buttonActive;
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = THEME.shadows.button;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = THEME.shadows.button;
        }
      }}
    >
      {children}
    </button>
  );
};

function MemberDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- ACCESSIBILITY STATE ---
  const mainContentRef = useRef(null);
  const sidebarRef = useRef(null);
  const menuRefs = useRef({});

  // --- STATE MANAGEMENT ---
  const [activeView, setActiveView] = useState('balance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState('');

  const [menuItems, setMenuItems] = useState([]);

  // Tab-specific state
  const [accountBalance, setAccountBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false });

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [serviceRequestForm, setServiceRequestForm] = useState({
    request_type: 'statement',
    description: '',
    delivery_method: 'email'
  });
  const [serviceRequestError, setServiceRequestError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  // Define menuItems early – example static array
  const defaultMenuItems = [
    { id: 'balance', name: 'Account Balance', icon: '💰', color: THEME.colors.primary, available: true },
    { id: 'accounts', name: 'Account Types', icon: '🏦', color: THEME.colors.secondary, available: true },
    { id: 'services', name: 'Request Services', icon: '📋', color: THEME.colors.success, available: true },
    { id: 'password', name: 'Change Password', icon: '🔒', color: THEME.colors.warning, available: true },
    { id: 'twofa', name: 'Activate 2FA', icon: '🔐', color: THEME.colors.danger, available: true }
  ];

  // Backend availability checks
  const [backendStatus, setBackendStatus] = useState({
    balance: true,
    accounts: true,
    services: true,
    password: true,
    twofa: true
  });

  // --- EFFECTS ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeView === 'balance') fetchAccountBalance();
    if (activeView === 'accounts') fetchAccounts();
    if (activeView === 'services') fetchServiceRequests();
  }, [activeView]);

  // --- ACCESSIBILITY EFFECTS ---
  useEffect(() => {
    // Announce page changes to screen readers
    const currentTab = menuItems.find(item => item.id === activeView);
    if (currentTab) {
      setAnnouncements(`Navigated to ${currentTab.name} tab`);
    }
  }, [activeView]);

  useEffect(() => {
    // If menuItems is async (e.g., from API), load here
    const loadMenu = () => {
      // Since backendStatus is set, update menuItems
      setMenuItems(defaultMenuItems.map(item => ({ ...item, available: backendStatus[item.id] })));
    };

    loadMenu();
  }, [backendStatus]);  // Run when backendStatus changes

  // Keyboard navigation for sidebar menu
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle keyboard navigation when sidebar is focused
      if (!sidebarRef.current?.contains(document.activeElement)) return;

      const availableItems = menuItems.filter(item => item.available);
      const currentIndex = availableItems.findIndex(item => item.id === activeView);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % availableItems.length;
        setActiveView(availableItems[nextIndex].id);
        menuRefs.current[availableItems[nextIndex].id]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? availableItems.length - 1 : currentIndex - 1;
        setActiveView(availableItems[prevIndex].id);
        menuRefs.current[availableItems[prevIndex].id]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveView(availableItems[0].id);
        menuRefs.current[availableItems[0].id]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        const lastIndex = availableItems.length - 1;
        setActiveView(availableItems[lastIndex].id);
        menuRefs.current[availableItems[lastIndex].id]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeView, menuItems]);

  // Focus management
  const handleTabChange = (tabId) => {
    setActiveView(tabId);
    // Focus main content area for screen readers
    setTimeout(() => {
      mainContentRef.current?.focus();
    }, 100);
  };

  // --- DATA FETCHING FUNCTIONS ---
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Check backend availability for each service
      await checkBackendAvailability();

      // Fetch initial data
      await Promise.allSettled([
        fetchAccountBalance(),
        fetchAccounts(),
        fetchServiceRequests()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkBackendAvailability = async () => {
    const checks = {
      balance: apiService.getMemberDashboardData(),
      accounts: apiService.getAccounts(),
      services: apiService.getServiceRequests ? apiService.getServiceRequests() : Promise.resolve([]),
      password: Promise.resolve(true), // Assume available
      twofa: Promise.resolve(true) // Assume available
    };

    const results = await Promise.allSettled(Object.values(checks));
    const status = {};

    Object.keys(checks).forEach((key, index) => {
      status[key] = results[index].status === 'fulfilled';
    });

    setBackendStatus(status);
  };

  const fetchAccountBalance = async () => {
    if (!backendStatus.balance) return;
    try {
      const data = await apiService.getMemberDashboardData();
      setAccountBalance(data);
      setTransactions(data.recent_transactions || []);
    } catch (error) {
      console.error('Error fetching account balance:', error);
      setBackendStatus(prev => ({ ...prev, balance: false }));
    }
  };

  const fetchAccounts = async () => {
    if (!backendStatus.accounts) return;
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setBackendStatus(prev => ({ ...prev, accounts: false }));
    }
  };

  const fetchServiceRequests = async () => {
    if (!backendStatus.services) return;
    try {
      const data = await apiService.getServiceRequests();
      setServiceRequests(data);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      setBackendStatus(prev => ({ ...prev, services: false }));
    }
  };

  // --- HANDLERS ---
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (!backendStatus.password) {
      alert('Password change service is currently unavailable');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    try {
      const result = await apiService.changePassword(passwordForm);
      if (result.success) {
        alert('Password changed successfully!');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        alert('Failed to change password: ' + result.error);
      }
    } catch (error) {
      alert('Failed to change password: ' + error.message);
    }
  };

  const handleServiceRequest = async () => {
    if (!backendStatus.services) {
      alert('Service request system is currently unavailable');
      return;
    }

    try {
      // This would need to be implemented in apiService
      // const response = await apiService.createServiceRequest(serviceRequestForm);
      const response = await fetch('/api/users/service-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(serviceRequestForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Service request submitted successfully!');
        setServiceRequestForm({ request_type: 'statement', description: '', delivery_method: 'email' });
        setServiceRequestError('');
        fetchServiceRequests();
      } else {
        if (data.requires_2fa) {
          setServiceRequestError('Two-factor authentication is required for SMS delivery. Please enable 2FA first.');
          // Optionally, navigate to 2FA tab
          setActiveView('twofa');
        } else {
          setServiceRequestError(data.error || 'Failed to submit service request');
        }
      }
    } catch (error) {
      setServiceRequestError('Failed to submit service request: ' + error.message);
    }
  };

  const handleSendOTP = async () => {
    if (!backendStatus.twofa) {
      alert('Two-factor authentication service is currently unavailable');
      return;
    }

    try {
      const result = await authService.sendOTP({ phone_number: user.phone, verification_type: '2fa_setup' });
      if (result.success) {
        setOtpSent(true);
        setOtpExpiresIn(300);
        alert('OTP sent to your phone number.');

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
      alert('Failed to send OTP: ' + error.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      alert('Please enter the OTP code');
      return;
    }

    try {
      const result = await authService.verifyOTP({ phone_number: user.phone, otp_code: otpCode, verification_type: '2fa_setup' });
      if (result.success) {
        setTwoFactorStatus({ enabled: true });
        setOtpCode('');
        setOtpSent(false);
        alert('Two-factor authentication enabled successfully!');
      } else {
        alert('Failed to verify OTP: ' + result.error);
      }
    } catch (error) {
      alert('Failed to verify OTP: ' + error.message);
    }
  };

  // --- LOADING VIEW ---
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: THEME.colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PlayfulCard>
          <div style={{ fontSize: '60px', animation: 'bounce 1s infinite' }}>🐘</div>
          <h2 style={{ fontFamily: "'Nunito', sans-serif" }}>Member Dashboard Loading...</h2>
        </PlayfulCard>
        <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      </div>
    );
  }
// --- MENU ITEMS CONFIG ---

// menuItems is now defined as state above

// --- RENDER ---
  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', background: THEME.colors.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
          /* Custom Scrollbar */
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: #fff; }
          ::-webkit-scrollbar-thumb { background: ${THEME.colors.primary}; border-radius: 5px; }

          /* Skip link styles */
          .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: ${THEME.colors.primary};
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            font-weight: bold;
          }
          .skip-link:focus {
            top: 6px;
          }

          /* Focus visible styles for better keyboard navigation */
          .focus-visible:focus-visible {
            outline: 3px solid ${THEME.colors.primary};
            outline-offset: 2px;
          }

          /* Screen reader only text */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .dashboard-container {
              flex-direction: column !important;
            }

            .sidebar {
              width: 100% !important;
              height: auto !important;
              border-right: none !important;
              border-bottom: 3px solid #000 !important;
            }

            .main-content {
              padding: 20px !important;
            }

            .header-section {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 16px !important;
            }

            .tab-navigation {
              width: 100% !important;
              justify-content: flex-start !important;
            }

            .stats-grid {
              grid-template-columns: 1fr !important;
            }

            .charts-grid {
              grid-template-columns: 1fr !important;
            }

            .form-grid {
              grid-template-columns: 1fr !important;
            }

            .account-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 480px) {
            .sidebar {
              padding: 15px !important;
            }

            .main-content {
              padding: 15px !important;
            }

            .playful-card {
              padding: 16px !important;
              margin-bottom: 16px !important;
            }

            .playful-button {
              padding: 10px 16px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>

      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
      >
        {announcements}
      </div>

      {/* --- SIDEBAR (STICKER SHEET) --- */}
      <nav
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        className="sidebar"
        style={{
          width: '280px',
          background: '#fff',
          borderRight: '3px solid #000',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div
            role="img"
            aria-label="Member avatar"
            style={{
              fontSize: '40px',
              background: THEME.colors.secondary,
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              margin: '0 auto 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #000'
            }}
          >
            👤
          </div>
          <h1 style={{ margin: 0, fontWeight: '900', color: THEME.colors.text }}>Member Hub</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>{user?.name || 'Member'}</p>
        </div>

        <div role="tablist" aria-label="Dashboard sections" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              ref={(el) => menuRefs.current[item.id] = el}
              onClick={() => item.available && handleTabChange(item.id)}
              role="tab"
              aria-selected={activeView === item.id}
              aria-controls={`tabpanel-${item.id}`}
              aria-disabled={!item.available}
              tabIndex={item.available ? 0 : -1}
              className="focus-visible"
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                border: activeView === item.id ? `3px solid ${item.color}` : '3px solid transparent',
                background: activeView === item.id ? `${item.color}20` : 'transparent',
                borderRadius: '16px',
                cursor: item.available ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '800',
                color: item.available
                  ? (activeView === item.id ? item.color : '#888')
                  : '#ccc',
                transition: 'all 0.2s ease',
                opacity: item.available ? 1 : 0.5
              }}
            >
              <span role="img" aria-hidden="true" style={{ fontSize: '24px' }}>{item.icon}</span>
              <span>{item.name}</span>
              {!item.available && (
                <span
                  role="img"
                  aria-label="Service unavailable"
                  style={{ fontSize: '12px', marginLeft: '4px' }}
                >
                  ⚠️
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <PlayfulButton variant="danger" onClick={handleLogout} style={{ width: '100%' }}>
            Log Out 👋
          </PlayfulButton>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main
        id="main-content"
        ref={mainContentRef}
        tabIndex="-1"
        role="main"
        aria-labelledby="main-heading"
        className="main-content"
        style={{ flex: 1, padding: '30px', overflowY: 'auto' }}
      >

        {/* Header Ribbon */}
        <header className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2
            id="main-heading"
            style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.text, margin: 0 }}
          >
            <span aria-hidden="true">{menuItems.find(i => i.id === activeView)?.icon}</span>
            {menuItems.find(i => i.id === activeView)?.name}
          </h2>
          <time
            aria-label={`Current date: ${new Date().toLocaleDateString()}`}
            style={{ background: '#FFF', padding: '8px 16px', borderRadius: '20px', border: '2px solid #000', fontWeight: 'bold' }}
          >
            📅 {new Date().toLocaleDateString()}
          </time>
        </header>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: THEME.colors.danger,
            color: 'white',
            padding: '16px 24px',
            borderRadius: THEME.radius.card,
            marginBottom: '24px',
            border: '3px solid #000',
            boxShadow: THEME.shadows.card
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Dynamic Content Wrapper */}
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>

          {/* Account Balance Tab */}
          {activeView === 'balance' && (
            <section
              id="tabpanel-balance"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              aria-hidden={activeView !== 'balance'}
            >
              {!backendStatus.balance ? (
                <PlayfulCard color="#FFEBEE">
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Service Unavailable</h3>
                    <p style={{ fontSize: '16px', color: '#666' }}>Account balance service is currently down. Please try again later.</p>
                  </div>
                </PlayfulCard>
              ) : (
                <>
                  <PlayfulCard color="#E8F5E9">
                    <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Current Balance</h3>
                    <div style={{ fontSize: '48px', fontWeight: '900', color: THEME.colors.success, marginBottom: '10px' }}>
                      {formatCurrencyGHS(accountBalance?.account_balance || 0)}
                    </div>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Available Balance</p>
                  </PlayfulCard>

                  <PlayfulCard color="#FFF3E0">
                    <h3 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '900' }}>Recent Transactions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {transactions.slice(0, 5).map((transaction, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: '#f9f9f9',
                          borderRadius: '12px',
                          border: '2px solid #000'
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{transaction.description}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{
                            fontWeight: 'bold',
                            color: transaction.amount > 0 ? THEME.colors.success : THEME.colors.danger
                          }}>
                            {formatCurrencyGHS(transaction.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PlayfulCard>
                </>
              )}
            </section>
          )}

          {/* Account Types Tab */}
          {activeView === 'accounts' && (
            <section
              id="tabpanel-accounts"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              aria-hidden={activeView !== 'accounts'}
            >
              {!backendStatus.accounts ? (
                <PlayfulCard color="#FFEBEE">
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Service Unavailable</h3>
                    <p style={{ fontSize: '16px', color: '#666' }}>Account information service is currently down. Please try again later.</p>
                  </div>
                </PlayfulCard>
              ) : (
                <div className="account-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {accounts.map((account, index) => (
                    <PlayfulCard key={index} color={index % 2 === 0 ? '#E3F2FD' : '#F3E5F5'}>
                      <h4 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '900' }}>
                        {account.type} Account
                      </h4>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Account Number</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          ****{account.account_number?.slice(-4) || '****'}
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Balance</div>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: THEME.colors.primary }}>
                          {formatCurrencyGHS(account.balance || 0)}
                        </div>
                      </div>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: account.status === 'active' ? THEME.colors.success : THEME.colors.warning,
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {account.status}
                      </div>
                    </PlayfulCard>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Request Services Tab */}
          {activeView === 'services' && (
            <section
              id="tabpanel-services"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              aria-hidden={activeView !== 'services'}
            >
              <PlayfulCard color="#E1F5FE">
              {!backendStatus.services ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Service Unavailable</h3>
                  <p style={{ fontSize: '16px', color: '#666' }}>Service request system is currently down. Please try again later.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '900' }}>Request Services</h3>

                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>New Service Request</h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Request Type
                          </label>
                          <select
                            value={serviceRequestForm.request_type}
                            onChange={(e) => setServiceRequestForm(prev => ({ ...prev, request_type: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #000',
                              borderRadius: '12px',
                              fontSize: '16px'
                            }}
                          >
                            <option value="statement">Account Statement</option>
                            <option value="checkbook">Checkbook Request</option>
                            <option value="loan-info">Loan Information</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Delivery Method
                          </label>
                          <select
                            value={serviceRequestForm.delivery_method}
                            onChange={(e) => setServiceRequestForm(prev => ({ ...prev, delivery_method: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #000',
                              borderRadius: '12px',
                              fontSize: '16px'
                            }}
                          >
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                            <option value="mail">Physical Mail</option>
                          </select>
                          {serviceRequestForm.delivery_method === 'sms' && !twoFactorStatus.enabled && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px 12px',
                              background: '#FFF3CD',
                              border: '2px solid #856404',
                              borderRadius: '8px',
                              fontSize: '14px',
                              color: '#856404'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔐</span>
                                <span>2FA required for SMS delivery</span>
                                <PlayfulButton
                                  onClick={() => setActiveView('twofa')}
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    background: THEME.colors.warning
                                  }}
                                >
                                  Enable 2FA
                                </PlayfulButton>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                            Description (Optional)
                          </label>
                          <textarea
                            value={serviceRequestForm.description}
                            onChange={(e) => setServiceRequestForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Additional details..."
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #000',
                              borderRadius: '12px',
                              fontSize: '16px',
                              minHeight: '80px',
                              resize: 'vertical'
                            }}
                          />
                        </div>

                        {serviceRequestError && (
                          <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: THEME.colors.danger,
                            color: 'white',
                            borderRadius: '8px',
                            border: '2px solid #000',
                            fontSize: '14px'
                          }}>
                            ⚠️ {serviceRequestError}
                          </div>
                        )}

                        <PlayfulButton onClick={handleServiceRequest} style={{ width: '100%', marginTop: '16px' }}>
                          Submit Request 📋
                        </PlayfulButton>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Recent Requests</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {serviceRequests.length === 0 ? (
                          <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            background: '#f9f9f9',
                            borderRadius: '12px',
                            border: '2px solid #000'
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                            <p style={{ color: '#666' }}>No service requests yet</p>
                          </div>
                        ) : (
                          serviceRequests.map((request, index) => (
                            <div key={index} style={{
                              padding: '12px',
                              background: '#f9f9f9',
                              borderRadius: '12px',
                              border: '2px solid #000'
                            }}>
                              <div style={{ fontWeight: 'bold' }}>{request.request_type}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{request.status}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </PlayfulCard>
            </section>
          )}

          {/* Change Password Tab */}
          {activeView === 'password' && (
            <section
              id="tabpanel-password"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              aria-hidden={activeView !== 'password'}
            >
              <PlayfulCard color="#FFF3E0">
              {!backendStatus.password ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Service Unavailable</h3>
                  <p style={{ fontSize: '16px', color: '#666' }}>Password change service is currently down. Please try again later.</p>
                </div>
              ) : (
                <>
                  <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '900' }}>Change Password</h3>

                  <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #000',
                            borderRadius: '12px',
                            fontSize: '16px'
                          }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="new-password"
                          style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
                        >
                          New Password
                        </label>
                        <input
                          id="new-password"
                          type="password"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                          aria-describedby="new-password-help"
                          aria-required="true"
                          autoComplete="new-password"
                          className="focus-visible"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #000',
                            borderRadius: '12px',
                            fontSize: '16px'
                          }}
                        />
                        <div id="new-password-help" className="sr-only">
                          Enter a strong password with at least 8 characters
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="confirm-password"
                          style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
                        >
                          Confirm New Password
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                          aria-describedby="confirm-password-help"
                          aria-required="true"
                          autoComplete="new-password"
                          className="focus-visible"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #000',
                            borderRadius: '12px',
                            fontSize: '16px'
                          }}
                        />
                        <div id="confirm-password-help" className="sr-only">
                          Re-enter your new password to confirm
                        </div>
                      </div>

                      <PlayfulButton onClick={handleChangePassword} style={{ width: '100%', marginTop: '16px' }}>
                        Change Password 🔒
                      </PlayfulButton>
                    </div>
                  </div>
                </>
              )}
            </PlayfulCard>
            </section>
          )}

          {/* Activate 2FA Tab */}
          {activeView === 'twofa' && (
            <section
              id="tabpanel-twofa"
              role="tabpanel"
              aria-labelledby={`tab-${activeView}`}
              aria-hidden={activeView !== 'twofa'}
            >
              <PlayfulCard color="#FCE4EC">
              {!backendStatus.twofa ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚠️</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>Service Unavailable</h3>
                  <p style={{ fontSize: '16px', color: '#666' }}>Two-factor authentication service is currently down. Please try again later.</p>
                </div>
              ) : twoFactorStatus.enabled ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>2FA is Enabled</h3>
                  <p style={{ fontSize: '16px', color: '#666' }}>
                    Your account is protected with two-factor authentication.
                  </p>
                </div>
              ) : (
                <>
                  <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '900' }}>Activate Two-Factor Authentication</h3>

                  <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                      <p style={{ fontSize: '16px', color: '#666' }}>
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
                          Choose your 2FA method:
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                          <div style={{
                            padding: '12px 24px',
                            background: '#e8f5e8',
                            border: '2px solid #000',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}>
                            📱 SMS
                          </div>
                          <div style={{
                            padding: '12px 24px',
                            background: '#e3f2fd',
                            border: '2px solid #000',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}>
                            📧 Email
                          </div>
                          <div style={{
                            padding: '12px 24px',
                            background: '#f3e5f5',
                            border: '2px solid #000',
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}>
                            📱 Authenticator App
                          </div>
                        </div>
                      </div>

                      {!otpSent ? (
                        <PlayfulButton onClick={handleSendOTP} style={{ width: '100%' }}>
                          Send Verification Code 📱
                        </PlayfulButton>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label
                              htmlFor="otp-code"
                              style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
                            >
                              Enter 6-digit code
                            </label>
                            <input
                              id="otp-code"
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              aria-describedby="otp-help"
                              aria-required="true"
                              inputMode="numeric"
                              pattern="[0-9]{6}"
                              maxLength={6}
                              autoComplete="one-time-code"
                              className="focus-visible"
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #000',
                                borderRadius: '12px',
                                fontSize: '18px',
                                textAlign: 'center',
                                letterSpacing: '4px'
                              }}
                            />
                            <div id="otp-help" className="sr-only">
                              Enter the 6-digit verification code sent to your phone
                            </div>
                          </div>

                          <div style={{ textAlign: 'center', color: '#666' }}>
                            Code expires in: {Math.floor(otpExpiresIn / 60)}:{(otpExpiresIn % 60).toString().padStart(2, '0')}
                          </div>

                          <PlayfulButton onClick={handleVerifyOTP} style={{ width: '100%' }}>
                            Verify & Enable 2FA ✅
                          </PlayfulButton>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </PlayfulCard>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

export default MemberDashboard;