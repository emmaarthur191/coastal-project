import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { api } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../components/mobile/MobileTheme';
import MobileSidebar from '../components/mobile/MobileSidebar';
import MobileMetrics from '../components/mobile/MobileMetrics';
import ClientsTab from '../components/mobile/ClientsTab';
import VisitsTab from '../components/mobile/VisitsTab';
import MessagingTab from '../components/mobile/MessagingTab';
import FieldToolbox from '../components/mobile/FieldToolbox';
import ClientRegistrationTab from '../components/ClientRegistrationTab';

function MobileBankerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- STATE (Original Logic) ---
  const [activeTab, setActiveTab] = useState('client-registration');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
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
  const handleQuickAction = (action) => {
    switch (action) {
      case 'loan': setShowLoanModal(true); break;
      case 'payment': setShowPaymentModal(true); break;
      case 'deposit': setShowDepositModal(true); break;
      case 'withdrawal': setShowWithdrawalModal(true); break;
      case 'kyc': setShowKycModal(true); break;
      case 'visit': setShowVisitModal(true); break;
      default: break;
    }
  };

  // ... (Keeping all submit handlers exactly as provided in original code)
  const handleLoanSubmit = async (e) => { e.preventDefault(); alert('Loan application submitted!'); setShowLoanModal(false); };
  const handlePaymentSubmit = async (e) => { e.preventDefault(); alert('Payment collected!'); setShowPaymentModal(false); };
  const handleDepositSubmit = async (e) => { e.preventDefault(); try { const r = await api.post('operations/process_deposit/', depositForm); alert(`Deposit Success! Ref: ${r.data.reference}`); setShowDepositModal(false); } catch(e) { alert('Error'); } };
  const handleWithdrawalSubmit = async (e) => { e.preventDefault(); try { const r = await api.post('operations/process_withdrawal/', withdrawalForm); alert(`Withdrawal Success! Ref: ${r.data.reference}`); setShowWithdrawalModal(false); } catch(e) { alert('Error'); } };
  const handleMessageSubmit = async (e) => { e.preventDefault(); try { await api.post('operations/messages/', messageForm); alert('Sent!'); setShowMessageModal(false); fetchMessages(); } catch(e) { alert('Error'); } };
  const handleScheduleSubmit = async (e) => { e.preventDefault(); try { const r = await api.post('operations/schedule_visit/', scheduleForm); setScheduledVisits([...scheduledVisits, r.data]); alert('Scheduled!'); setShowScheduleModal(false); } catch(e) { alert('Error'); } };

  // --- DATA MOCKS ---
  const assignedClients = [
    { id: 1, name: 'Kwame Asare', location: 'East Legon', status: 'Due Payment', amountDue: formatCurrencyGHS(1500), nextVisit: 'Today 2:00 PM', priority: 'high' },
    { id: 2, name: 'Abena Mensah', location: 'Madina', status: 'Loan Application', amountDue: null, nextVisit: 'Tomorrow 10:00 AM', priority: 'medium' },
    { id: 3, name: 'Kofi Appiah', location: 'Tema', status: 'Account Opening', amountDue: null, nextVisit: 'Today 4:30 PM', priority: 'medium' },
    { id: 4, name: 'Ama Osei', location: 'Dansoman', status: 'Overdue Payment', amountDue: formatCurrencyGHS(2500), nextVisit: 'ASAP', priority: 'high' }
  ];

  const quickActionButtons = [
    { action: 'deposit', label: 'Deposit', icon: '📥', color: THEME.colors.success },
    { action: 'withdrawal', label: 'Withdraw', icon: '📤', color: THEME.colors.danger },
    { action: 'loan', label: 'New Loan', icon: '🤝', color: THEME.colors.secondary },
    { action: 'payment', label: 'Collect', icon: '💵', color: THEME.colors.primary },
    { action: 'kyc', label: 'KYC Doc', icon: '📸', color: THEME.colors.warning }
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

      <MobileSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>

        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: '900', fontSize: '28px', color: THEME.colors.text }}>Mobile Ops 🚁</h1>
            <p style={{ margin: 0, color: '#636e72', fontWeight: 'bold' }}>Hello, {(user as any)?.name}!</p>
          </div>
          <div style={{ background: THEME.colors.primary, color: 'white', padding: '5px 15px', borderRadius: '20px', border: '2px solid black', fontWeight: 'bold' }}>
            FIELD AGENT
          </div>
        </div>

        <MobileMetrics metrics={metrics} loadingMetrics={loadingMetrics} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* LEFT COLUMN: Dynamic Tab Content */}
          <div>
            {activeTab === 'client-registration' && (
              <div style={{ background: THEME.colors.white, borderRadius: '12px', padding: '20px', border: '2px solid #000' }}>
                <ClientRegistrationTab />
              </div>
            )}

            {activeTab === 'clients' && (
              <ClientsTab assignedClients={assignedClients} />
            )}

            {activeTab === 'visits' && (
              <VisitsTab
                scheduledVisits={scheduledVisits}
                onAddStop={() => setShowScheduleModal(true)}
              />
            )}

            {activeTab === 'messaging' && (
              <MessagingTab onOpenComms={() => {
                if (!hasMessagingAccess) {
                  alert('Access denied. Messaging is only for authorized staff.');
                  return;
                }
                alert('Opening secure messaging system...');
                navigate('/messaging');
              }} />
            )}
          </div>

          {/* RIGHT COLUMN: Field Toolbox */}
          <div>
            <FieldToolbox
              quickActionButtons={quickActionButtons}
              onQuickAction={handleQuickAction}
            />

            {/* Educational Diagram for Field Agents */}
            <div style={{ marginTop: '20px' }}>

               <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '5px' }}>
                 Remember: Verify ID before onboarding!
               </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default MobileBankerDashboard;