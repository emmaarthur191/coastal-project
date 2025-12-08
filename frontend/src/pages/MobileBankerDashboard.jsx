import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { api } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#E0F7FA', // Cyan tint
    primary: '#00CEC9', // Robin's Egg
    secondary: '#6C5CE7', // Purple
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon
    warning: '#FDCB6E', // Mustard
    white: '#FFFFFF',
    text: '#2D3436',
    border: '#000000',
  },
  shadows: {
    card: '5px 5px 0px rgba(0,0,0,1)',
    button: '3px 3px 0px rgba(0,0,0,1)',
    pressed: '0px 0px 0px rgba(0,0,0,1)',
  },
  radius: {
    card: '20px',
    button: '15px',
    round: '50px'
  }
};

// --- STYLED COMPONENTS ---
const PlayfulCard = ({ children, color = '#FFFFFF', style, className }) => (
  <div className={className} style={{
    background: color,
    borderRadius: THEME.radius.card,
    border: `3px solid ${THEME.colors.border}`,
    boxShadow: THEME.shadows.card,
    padding: '20px',
    marginBottom: '20px',
    transition: 'transform 0.2s',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, color = THEME.colors.primary, style }) => (
  <button
    onClick={onClick}
    style={{
      background: color,
      color: 'white',
      border: `3px solid ${THEME.colors.border}`,
      borderRadius: THEME.radius.button,
      padding: '12px 20px',
      fontWeight: '900',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.1s',
      ...style
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'translate(3px, 3px)';
      e.currentTarget.style.boxShadow = THEME.shadows.pressed;
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'translate(0, 0)';
      e.currentTarget.style.boxShadow = THEME.shadows.button;
    }}
  >
    {children}
  </button>
);

function MobileBankerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  // --- STATE (Original Logic) ---
  const [activeTab, setActiveTab] = useState('clients');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Form states (kept intact but collapsed for brevity)
  const [loanForm, setLoanForm] = useState({ applicant_name: '', date_of_birth: '', applicant_id_type: 'ghana_card', applicant_id_number: '', digital_address: '', town: '', city: '', next_of_kin_1_name: '', next_of_kin_1_relationship: '', next_of_kin_1_phone: '', next_of_kin_1_address: '', next_of_kin_2_name: '', next_of_kin_2_relationship: '', next_of_kin_2_phone: '', next_of_kin_2_address: '', guarantor_1_name: '', guarantor_1_id_type: 'ghana_card', guarantor_1_id_number: '', guarantor_1_phone: '', guarantor_1_address: '', guarantor_2_name: '', guarantor_2_id_type: 'ghana_card', guarantor_2_id_number: '', guarantor_2_phone: '', guarantor_2_address: '', loan_amount: '', loan_purpose: '', repayment_period_months: '', monthly_income: '', employment_status: '' });
  const [paymentForm, setPaymentForm] = useState({ member_id: '', amount: '', payment_type: 'cash' });
  const [depositForm, setDepositForm] = useState({ member_id: '', amount: '', deposit_type: 'member_savings', account_number: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ member_id: '', amount: '', withdrawal_type: 'withdrawal_member_savings', account_number: '' });
  const [messageForm, setMessageForm] = useState({ recipient: '', subject: '', content: '', priority: 'normal' });
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [metrics, setMetrics] = useState({ scheduled_visits: 0, completed_today: 0, collections_due: 0, new_applications: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ client_name: '', location: '', scheduled_date: '', scheduled_time: '', purpose: '', assigned_to: '' });

  // --- EFFECTS (Original Logic) ---
  useEffect(() => { fetchMessages(); fetchVisits(); fetchMetrics(); }, []);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try { const response = await api.get('operations/messages/'); setMessages(response.data || []); } 
    catch (error) { console.error('Error fetching messages:', error); setMessages([]); } 
    finally { setLoadingMessages(false); }
  };

  const fetchVisits = async () => {
    setLoadingVisits(true);
    try { const response = await api.get('operations/visit_schedules/'); setScheduledVisits(response.data); } 
    catch (error) { console.error('Error fetching visits:', error); } 
    finally { setLoadingVisits(false); }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try { const response = await api.get('operations/mobile-banker-metrics/'); setMetrics(response.data); } 
    catch (error) { console.error('Error fetching metrics:', error); } 
    finally { setLoadingMetrics(false); }
  };

  // --- HANDLERS (Original Logic) ---

  // ... (Keeping all submit handlers exactly as provided in original code)
  const handleLoanSubmit = async (e) => { e.preventDefault(); alert('Loan application submitted!'); setShowLoanModal(false); };
  const handlePaymentSubmit = async (e) => { e.preventDefault(); alert('Payment collected!'); setShowPaymentModal(false); };
  const handleDepositSubmit = async (e) => { e.preventDefault(); try { const r = await api.post('operations/process_deposit/', depositForm); alert(`Deposit Success! Ref: ${r.data.reference}`); setShowDepositModal(false); } catch(e) { alert('Error'); } };
  const handleWithdrawalSubmit = async (e) => { e.preventDefault(); try { const r = await api.post('operations/process_withdrawal/', withdrawalForm); alert(`Withdrawal Success! Ref: ${r.data.reference}`); setShowWithdrawalModal(false); } catch(e) { alert('Error'); } };
  const handleMessageSubmit = async (e) => { e.preventDefault(); try { await api.post('operations/messages/', messageForm); alert('Sent!'); setShowMessageModal(false); fetchMessages(); } catch(e) { alert('Error'); } };
  const handleScheduleSubmit = async (e) => { e.preventDefault(); try { const r = await api.post('operations/schedule_visit/', scheduleForm); setScheduledVisits([...scheduledVisits, r.data]); alert('Scheduled!'); setShowScheduleModal(false); } catch(e) { alert('Error'); } };

  // --- DATA MOCKS ---
  const fieldMetrics = [
    { label: 'Visits', value: loadingMetrics ? '...' : metrics.scheduled_visits.toString(), icon: '🛵', color: THEME.colors.primary },
    { label: 'Done', value: loadingMetrics ? '...' : metrics.completed_today.toString(), icon: '✅', color: THEME.colors.success },
    { label: 'Collect', value: loadingMetrics ? '...' : formatCurrencyGHS(metrics.collections_due), icon: '💰', color: THEME.colors.warning },
    { label: 'New Apps', value: loadingMetrics ? '...' : metrics.new_applications.toString(), icon: '📝', color: THEME.colors.secondary }
  ];

  const assignedClients = [
    { id: 1, name: 'Kwame Asare', location: 'East Legon', status: 'Due Payment', amountDue: formatCurrencyGHS(1500), nextVisit: 'Today 2:00 PM', priority: 'high' },
    { id: 2, name: 'Abena Mensah', location: 'Madina', status: 'Loan Application', amountDue: null, nextVisit: 'Tomorrow 10:00 AM', priority: 'medium' },
    { id: 3, name: 'Kofi Appiah', location: 'Tema', status: 'Account Opening', amountDue: null, nextVisit: 'Today 4:30 PM', priority: 'medium' },
    { id: 4, name: 'Ama Osei', location: 'Dansoman', status: 'Overdue Payment', amountDue: formatCurrencyGHS(2500), nextVisit: 'ASAP', priority: 'high' }
  ];


  // --- RENDER ---
  return (
    <div style={{ display: 'flex', height: '100vh', background: THEME.colors.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
          /* Custom Scrollbar */
          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${THEME.colors.primary}; border-radius: 5px; border: 2px solid #fff; }
        `}
      </style>

      {/* --- SIDEBAR NAVIGATION --- */}
      <nav style={{
        width: '100px',
        background: '#fff',
        borderRight: '3px solid #000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        zIndex: 10
      }}>
        <div style={{ fontSize: '40px', marginBottom: '40px', cursor: 'pointer' }} title="Home">🐝</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
          {[
            { id: 'clients', icon: '👥', label: 'Clients' },
            { id: 'visits', icon: '📍', label: 'Visits' },
            { id: 'deposit', icon: '📥', label: 'Deposit' },
            { id: 'withdraw', icon: '📤', label: 'Withdraw' },
            { id: 'loan', icon: '🤝', label: 'New Loan' },
            { id: 'kyc', icon: '📸', label: 'KYC' },
            { id: 'messaging', icon: '💬', label: 'Chat' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                border: activeTab === tab.id ? '3px solid #000' : '3px solid transparent',
                background: activeTab === tab.id ? THEME.colors.warning : 'transparent',
                fontSize: '30px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {tab.icon}
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} style={{ fontSize: '30px', background: 'none', border: 'none', cursor: 'pointer' }} title="Logout">🚪</button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: '900', fontSize: '28px', color: THEME.colors.text }}>Mobile Ops 🚁</h1>
            <p style={{ margin: 0, color: '#636e72', fontWeight: 'bold' }}>Hello, {user?.name}!</p>
          </div>
          <div style={{ background: THEME.colors.primary, color: 'white', padding: '5px 15px', borderRadius: '20px', border: '2px solid black', fontWeight: 'bold' }}>
            FIELD AGENT
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          {fieldMetrics.map((m, i) => (
            <PlayfulCard key={i} color={m.color} style={{ color: 'white', borderColor: 'black', textAlign: 'center', padding: '15px' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>{m.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '900' }}>{m.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>{m.label}</div>
            </PlayfulCard>
          ))}
        </div>

        <div>
          
          {/* LEFT COLUMN: Dynamic Tab Content */}
          <div>
            {activeTab === 'clients' && (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '15px' }}>📋 My Clients</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {assignedClients.map((client) => (
                    <PlayfulCard key={client.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: client.priority === 'high' ? `8px solid ${THEME.colors.danger}` : `3px solid black` }}>
                      <div style={{ width: '50px', height: '50px', background: '#dfe6e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', border: '2px solid black' }}>
                        {client.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{client.name}</div>
                        <div style={{ fontSize: '14px', color: '#636e72' }}>📍 {client.location}</div>
                        {client.priority === 'high' && <span style={{ background: THEME.colors.danger, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>URGENT</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {client.amountDue && <div style={{ color: THEME.colors.danger, fontWeight: '900' }}>{client.amountDue}</div>}
                        <PlayfulButton style={{ padding: '5px 10px', fontSize: '12px', marginTop: '5px' }}>Visit</PlayfulButton>
                      </div>
                    </PlayfulCard>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'visits' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>🗓️ Today's Route</h2>
                  <PlayfulButton onClick={() => setShowScheduleModal(true)} color={THEME.colors.success}>+ Add Stop</PlayfulButton>
                </div>
                {scheduledVisits.length > 0 ? scheduledVisits.map(visit => (
                  <PlayfulCard key={visit.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{visit.client_name}</strong>
                      <div style={{ fontSize: '12px' }}>{visit.scheduled_time} • {visit.purpose}</div>
                    </div>
                    <div>{visit.status === 'completed' ? '✅' : '⏳'}</div>
                  </PlayfulCard>
                )) : (
                  <PlayfulCard style={{ textAlign: 'center', color: '#aaa' }}>No stops planned yet! Go exploring! 🗺️</PlayfulCard>
                )}
              </>
            )}

            {activeTab === 'deposit' && (
              <PlayfulCard color="#E8F5E8" style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px', textAlign: 'center' }}>💰 Process Deposit</h2>
                <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Member ID</label>
                    <input
                      type="text"
                      value={depositForm.member_id}
                      onChange={(e) => setDepositForm({...depositForm, member_id: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                      placeholder="Enter member ID"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Amount (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Deposit Type</label>
                    <select
                      value={depositForm.deposit_type}
                      onChange={(e) => setDepositForm({...depositForm, deposit_type: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                    >
                      <option value="member_savings">Member Savings</option>
                      <option value="fixed_deposit">Fixed Deposit</option>
                      <option value="voluntary_savings">Voluntary Savings</option>
                    </select>
                  </div>
                  <PlayfulButton type="submit" color={THEME.colors.success} style={{ marginTop: '10px' }}>
                    Process Deposit
                  </PlayfulButton>
                </form>
              </PlayfulCard>
            )}

            {activeTab === 'withdraw' && (
              <PlayfulCard color="#FFEBEE" style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px', textAlign: 'center' }}>💸 Process Withdrawal</h2>
                <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Member ID</label>
                    <input
                      type="text"
                      value={withdrawalForm.member_id}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, member_id: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                      placeholder="Enter member ID"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Amount (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Withdrawal Type</label>
                    <select
                      value={withdrawalForm.withdrawal_type}
                      onChange={(e) => setWithdrawalForm({...withdrawalForm, withdrawal_type: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                    >
                      <option value="withdrawal_member_savings">Member Savings</option>
                      <option value="withdrawal_fixed_deposit">Fixed Deposit</option>
                      <option value="withdrawal_voluntary_savings">Voluntary Savings</option>
                    </select>
                  </div>
                  <PlayfulButton type="submit" color={THEME.colors.danger} style={{ marginTop: '10px' }}>
                    Process Withdrawal
                  </PlayfulButton>
                </form>
              </PlayfulCard>
            )}

            {activeTab === 'loan' && (
              <PlayfulCard color="#E3F2FD" style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px', textAlign: 'center' }}>🤝 New Loan Application</h2>
                <form onSubmit={handleLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Applicant Name</label>
                      <input
                        type="text"
                        value={loanForm.applicant_name}
                        onChange={(e) => setLoanForm({...loanForm, applicant_name: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Date of Birth</label>
                      <input
                        type="date"
                        value={loanForm.date_of_birth}
                        onChange={(e) => setLoanForm({...loanForm, date_of_birth: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>ID Type</label>
                      <select
                        value={loanForm.applicant_id_type}
                        onChange={(e) => setLoanForm({...loanForm, applicant_id_type: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                      >
                        <option value="ghana_card">Ghana Card</option>
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver's License</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>ID Number</label>
                      <input
                        type="text"
                        value={loanForm.applicant_id_number}
                        onChange={(e) => setLoanForm({...loanForm, applicant_id_number: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                        placeholder="ID number"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Loan Amount (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={loanForm.loan_amount}
                      onChange={(e) => setLoanForm({...loanForm, loan_amount: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px' }}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Loan Purpose</label>
                    <textarea
                      value={loanForm.loan_purpose}
                      onChange={(e) => setLoanForm({...loanForm, loan_purpose: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #000', fontSize: '16px', minHeight: '60px' }}
                      placeholder="Describe the purpose of the loan"
                      required
                    />
                  </div>
                  <PlayfulButton type="submit" color={THEME.colors.secondary} style={{ marginTop: '10px' }}>
                    Submit Loan Application
                  </PlayfulButton>
                </form>
              </PlayfulCard>
            )}

            {activeTab === 'kyc' && (
              <PlayfulCard color="#FFF3E0" style={{ padding: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px', textAlign: 'center' }}>📸 KYC Verification</h2>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📱</div>
                  <p style={{ fontSize: '16px', color: '#666' }}>KYC verification process for new members</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <PlayfulButton color={THEME.colors.primary} onClick={() => setShowKycModal(true)}>
                    📷 Capture ID
                  </PlayfulButton>
                  <PlayfulButton color={THEME.colors.success} onClick={() => setShowKycModal(true)}>
                    👤 Facial Verification
                  </PlayfulButton>
                </div>
                <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '10px', border: '2px solid #000' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Recent KYC Submissions</h4>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    No recent submissions to display
                  </div>
                </div>
              </PlayfulCard>
            )}

            {activeTab === 'messaging' && (
              <PlayfulCard color="#E3F2FD" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '60px' }}>🔒</div>
                <h3>Secret Agent Chat</h3>
                <p>Talk to HQ securely.</p>
                <PlayfulButton onClick={() => navigate('/messaging')} style={{ margin: '0 auto' }}>Open Comms</PlayfulButton>
              </PlayfulCard>
            )}
          </div>


        </div>
      </main>
    </div>
  );
}

export default MobileBankerDashboard;