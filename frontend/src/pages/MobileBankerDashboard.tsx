import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS } from '../utils/formatters';
import { api } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import DashboardLayout from '../components/layout/DashboardLayout'; // Unified Layout
import MobileMetrics from '../components/mobile/MobileMetrics';
import ClientsTab from '../components/mobile/ClientsTab';
import VisitsTab from '../components/mobile/VisitsTab';
import MessagingTab from '../components/mobile/MessagingTab';
import FieldToolbox from '../components/mobile/FieldToolbox';
import ClientRegistrationTab from '../components/ClientRegistrationTab';
import {
  DepositModal, WithdrawalModal, PaymentModal, LoanModal, VisitModal, MessageModal, KycModal
} from '../components/mobile/MobileModals';
import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';

function MobileBankerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- MENU ITEMS CONFIG (For Sidebar) ---
  const menuItems = React.useMemo(() => [
    { id: 'client-registration', name: 'Registration', icon: '👤' },
    { id: 'clients', name: 'My Clients', icon: '👥' },
    { id: 'visits', name: 'Visits', icon: '🛵' },
    { id: 'messaging', name: 'Messaging', icon: '💬' },
    { id: 'my_payslips', name: 'My Payslips', icon: '💰' },
  ], []);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('client-registration');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Form states
  const [loanForm, setLoanForm] = useState({ applicant_name: '', date_of_birth: '', applicant_id_type: 'ghana_card', applicant_id_number: '', digital_address: '', town: '', city: '', next_of_kin_1_name: '', next_of_kin_1_relationship: '', next_of_kin_1_phone: '', next_of_kin_1_address: '', next_of_kin_2_name: '', next_of_kin_2_relationship: '', next_of_kin_2_phone: '', next_of_kin_2_address: '', guarantor_1_name: '', guarantor_1_id_type: 'ghana_card', guarantor_1_id_number: '', guarantor_1_phone: '', guarantor_1_address: '', guarantor_2_name: '', guarantor_2_id_type: 'ghana_card', guarantor_2_id_number: '', guarantor_2_phone: '', guarantor_2_address: '', loan_amount: '', loan_purpose: '', repayment_period_months: '', monthly_income: '', employment_status: '' });
  const [paymentForm, setPaymentForm] = useState({ member_id: '', amount: '', payment_type: 'cash' });
  const [depositForm, setDepositForm] = useState({ member_id: '', amount: '', deposit_type: 'daily_susu', account_number: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ member_id: '', amount: '', withdrawal_type: 'withdrawal_daily_susu', account_number: '' });
  const [messageForm, setMessageForm] = useState({ recipient: '', subject: '', content: '', priority: 'normal' });
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [metrics, setMetrics] = useState({ scheduled_visits: 0, completed_today: 0, collections_due: 0, new_applications: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ client_name: '', location: '', scheduled_date: '', scheduled_time: '', purpose: '', assigned_to: '' });

  // Assigned clients state (replaces mock data)
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // --- EFFECTS ---
  useEffect(() => { fetchMessages(); fetchVisits(); fetchMetrics(); fetchAssignedClients(); }, []);

  const fetchAssignedClients = async () => {
    setLoadingClients(true);
    try {
      const response = await api.get('operations/assignments/my_clients/');
      setAssignedClients(response.data || []);
    } catch (error) {
      console.error('Error fetching assigned clients:', error);
      setAssignedClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

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

  // --- HANDLERS ---
  const handleQuickAction = (action: any) => {
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

  const handleLoanSubmit = async (e: any) => {
    e.preventDefault();
    if (!loanForm.applicant_name || !loanForm.loan_amount || !loanForm.loan_purpose) {
      alert('Please fill in all required fields (Name, Amount, Purpose)');
      return;
    }
    alert('Loan application submitted!');
    setShowLoanModal(false);
  };
  const handlePaymentSubmit = async (e: any) => {
    e.preventDefault();
    if (!paymentForm.member_id || !paymentForm.amount) {
      alert('Please enter Member ID and Amount');
      return;
    }
    alert('Payment collected!');
    setShowPaymentModal(false);
  };
  const handleDepositSubmit = async (e: any) => {
    e.preventDefault();
    if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!depositForm.account_number && !depositForm.member_id) {
      alert('Please enter an account number or member ID');
      return;
    }
    try {
      const r = await api.post('operations/process_deposit/', depositForm);
      alert(`Deposit Success! Ref: ${r.data.reference}`);
      setShowDepositModal(false);
    } catch (e: any) {
      alert(e.message || 'Error processing deposit');
    }
  };
  const handleWithdrawalSubmit = async (e: any) => {
    e.preventDefault();
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!withdrawalForm.account_number && !withdrawalForm.member_id) {
      alert('Please enter an account number or member ID');
      return;
    }
    try {
      const r: any = await api.post('operations/process_withdrawal/', withdrawalForm);
      alert(`Withdrawal Success! Ref: ${r.data.reference}`);
      setShowWithdrawalModal(false);
    } catch (e: any) {
      alert(e.message || 'Error processing withdrawal');
    }
  };
  const handleMessageSubmit = async (e: any) => { e.preventDefault(); try { await api.post('operations/messages/', messageForm); alert('Sent!'); setShowMessageModal(false); fetchMessages(); } catch (e) { alert('Error'); } };
  const handleScheduleSubmit = async (e: any) => { e.preventDefault(); try { const r = await api.post('operations/schedule_visit/', scheduleForm); setScheduledVisits([...scheduledVisits, r.data] as any); alert('Scheduled!'); setShowScheduleModal(false); } catch (e) { alert('Error'); } };

  const quickActionButtons = [
    { action: 'deposit', label: 'Deposit', icon: '📥', variant: 'success' as const },
    { action: 'withdrawal', label: 'Withdraw', icon: '📤', variant: 'danger' as const },
    { action: 'loan', label: 'New Loan', icon: '🤝', variant: 'primary' as const },
    { action: 'payment', label: 'Collect', icon: '💵', variant: 'warning' as const },
    { action: 'kyc', label: 'KYC Doc', icon: '📸', variant: 'secondary' as const }
  ];

  return (
    <DashboardLayout
      title="Mobile Operations"
      user={user}
      menuItems={menuItems}
      activeView={activeTab}
      onNavigate={setActiveTab}
      onLogout={handleLogout}
    >
      {/* Mobile Header Ribbon removed - handled by DashboardLayout */}

      <MobileMetrics metrics={metrics} loadingMetrics={loadingMetrics} />

      {/* Main Grid: Content + Toolbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* LEFT COLUMN: Dynamic Tab Content (Spans 2 cols on Large) */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px]">
            {activeTab === 'client-registration' && <ClientRegistrationTab />}
            {activeTab === 'clients' && <ClientsTab assignedClients={assignedClients} />}
            {activeTab === 'visits' && (
              <VisitsTab
                scheduledVisits={scheduledVisits}
                onAddStop={() => setShowScheduleModal(true)}
              />
            )}
            {activeTab === 'messaging' && (
              <MessagingTab onOpenComms={() => {
                if (!hasMessagingAccess) { alert('Access blocked.'); return; }
                navigate('/messaging');
              }} />
            )}
            {activeTab === 'my_payslips' && <StaffPayslipViewer />}
          </Card>
        </div>

        {/* RIGHT COLUMN: Field Toolbox */}
        <div>
          <FieldToolbox
            quickActionButtons={quickActionButtons}
            onQuickAction={handleQuickAction}
          />

          <div className="mt-6 text-center">
            <p className="text-xs text-secondary-500 font-medium bg-secondary-50 py-2 rounded-lg border border-secondary-200">
              ⚠️ Verify ID before onboarding!
            </p>
          </div>
        </div>

      </div>

      {/* --- MODALS --- */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        formData={depositForm}
        setFormData={setDepositForm}
        onSubmit={handleDepositSubmit}
      />
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        formData={withdrawalForm}
        setFormData={setWithdrawalForm}
        onSubmit={handleWithdrawalSubmit}
      />
      <LoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        formData={loanForm}
        setFormData={setLoanForm}
        onSubmit={handleLoanSubmit}
      />
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        formData={paymentForm}
        setFormData={setPaymentForm}
        onSubmit={handlePaymentSubmit}
      />
      <VisitModal
        isOpen={showVisitModal || showScheduleModal}
        onClose={() => { setShowVisitModal(false); setShowScheduleModal(false); }}
        formData={scheduleForm}
        setFormData={setScheduleForm}
        onSubmit={handleScheduleSubmit}
      />
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        formData={messageForm}
        setFormData={setMessageForm}
        onSubmit={handleMessageSubmit}
      />
      <KycModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
      />
    </DashboardLayout>
  );
}

export default MobileBankerDashboard;