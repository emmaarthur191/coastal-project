import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyGHS as _formatCurrencyGHS } from '../utils/formatters';
import {
  api, authService, MobileMessage, MobileBankerMetric,
  VisitSchedule as Visit, AssignedClient
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Card } from '../components/ui/Card';
import DashboardLayout from '../components/layout/DashboardLayout'; // Unified Layout
import MobileMetrics from '../components/mobile/MobileMetrics';
import ClientsTab from '../components/mobile/ClientsTab';
import VisitsTab from '../components/mobile/VisitsTab';
import MessagingTab from '../components/mobile/MessagingTab';
import FieldToolbox from '../components/mobile/FieldToolbox';
import ClientRegistrationTab from '../components/ClientRegistrationTab';
import {
  DepositModal, WithdrawalModal, PaymentModal, LoanModal, ScheduleModal, MessageModal, KycModal
} from '../components/mobile/MobileModals';
import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';

interface MappedClient extends AssignedClient {
  name: string;
  amountDue: string;
  nextVisit: string;
  priority: string;
}

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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const initialLoanForm = {
    member_id: '',
    loan_amount: '',
    loan_purpose: '',
    term_months: '12',
    interest_rate: '10',
    date_of_birth: '',
    id_type: 'ghana_card',
    id_number: '',
    digital_address: '',
    town: '',
    city: '',
    next_of_kin_1_name: '',
    next_of_kin_1_relationship: '',
    next_of_kin_1_phone: '',
    next_of_kin_1_address: '',
    next_of_kin_2_name: '',
    next_of_kin_2_relationship: '',
    next_of_kin_2_phone: '',
    next_of_kin_2_address: '',
    guarantor_1_name: '',
    guarantor_1_id_type: 'ghana_card',
    guarantor_1_id_number: '',
    guarantor_1_phone: '',
    guarantor_1_address: '',
    guarantor_2_name: '',
    guarantor_2_id_type: 'ghana_card',
    guarantor_2_id_number: '',
    guarantor_2_phone: '',
    guarantor_2_address: '',
    monthly_income: '',
    employment_status: 'employed'
  };

  const [loanForm, setLoanForm] = useState(initialLoanForm);
  const [paymentForm, setPaymentForm] = useState({ member_id: '', amount: '', payment_type: 'cash' });
  const [depositForm, setDepositForm] = useState({ member_id: '', amount: '', account_type: 'daily_susu', account_number: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ member_id: '', amount: '', account_type: 'daily_susu', account_number: '' });
  const [messageForm, setMessageForm] = useState({ recipient: '', subject: '', content: '', priority: 'normal' });
  const [_messages, setMessages] = useState<MobileMessage[]>([]);
  const [_loadingMessages, setLoadingMessages] = useState(false);
  const [metrics, setMetrics] = useState<MobileBankerMetric | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState<Visit[]>([]);
  const [_loadingVisits, setLoadingVisits] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ client_name: '', location: '', scheduled_time: '', purpose: '', notes: '' });

  // Assigned clients state
  const [assignedClients, setAssignedClients] = useState<MappedClient[]>([]);
  const [_loadingClients, setLoadingClients] = useState(false);

  // --- EFFECTS ---
  useEffect(() => { fetchMessages(); fetchVisits(); fetchMetrics(); fetchAssignedClients(); }, []);

  const fetchAssignedClients = async () => {
    setLoadingClients(true);
    try {
      const response = await authService.getAssignments();
      // Map API data to ClientsTab interface
      const mappedClients: MappedClient[] = (response.data || []).map((client: AssignedClient) => ({
        ...client,
        name: client.client_name || 'Unknown Client',
        status: client.status || 'Active',
        location: client.location || client.address || 'Unknown',
        amountDue: (client.amount_due || client.balance || 0).toString(),
        nextVisit: client.next_visit || '2026-01-14',
        priority: (client.priority || 'Normal').toLowerCase()
      }));
      setAssignedClients(mappedClients);
    } catch (error) {
      console.error('Error fetching assigned clients:', error);
      setAssignedClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await authService.getMobileMessages();
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchVisits = async () => {
    setLoadingVisits(true);
    try {
      const response = await authService.getVisits();
      // Map to Visit interface (needs scheduled_time)
      const mappedVisits: Visit[] = (response.data || []).map((visit: Visit) => ({
        ...visit,
        scheduled_time: visit.scheduled_time || '09:00 AM', // Default
        client: visit.client_name, // Map client_name to client prop if needed
        type: visit.purpose || 'Collection',
        location: visit.location || 'Client Shop'
      }));
      setScheduledVisits(mappedVisits);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const response = await authService.getMobileBankerMetrics();
      setMetrics(response.data || null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };


  // --- HANDLERS ---
  const handleQuickAction = (action: string) => {
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

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.member_id || !loanForm.loan_amount || !loanForm.loan_purpose) {
      alert('Please fill in all required fields (Member ID, Amount, Purpose)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/loans/', {
        user: loanForm.member_id,
        amount: loanForm.loan_amount,
        purpose: loanForm.loan_purpose,
        term_months: loanForm.term_months,
        interest_rate: loanForm.interest_rate,
        date_of_birth: loanForm.date_of_birth || null,
        id_type: loanForm.id_type,
        id_number: loanForm.id_number,
        digital_address: loanForm.digital_address,
        town: loanForm.town,
        city: loanForm.city,
        next_of_kin_1_name: loanForm.next_of_kin_1_name,
        next_of_kin_1_relationship: loanForm.next_of_kin_1_relationship,
        next_of_kin_1_phone: loanForm.next_of_kin_1_phone,
        next_of_kin_1_address: loanForm.next_of_kin_1_address,
        next_of_kin_2_name: loanForm.next_of_kin_2_name,
        next_of_kin_2_relationship: loanForm.next_of_kin_2_relationship,
        next_of_kin_2_phone: loanForm.next_of_kin_2_phone,
        next_of_kin_2_address: loanForm.next_of_kin_2_address,
        guarantor_1_name: loanForm.guarantor_1_name,
        guarantor_1_id_type: loanForm.guarantor_1_id_type,
        guarantor_1_id_number: loanForm.guarantor_1_id_number,
        guarantor_1_phone: loanForm.guarantor_1_phone,
        guarantor_1_address: loanForm.guarantor_1_address,
        guarantor_2_name: loanForm.guarantor_2_name,
        guarantor_2_id_type: loanForm.guarantor_2_id_type,
        guarantor_2_id_number: loanForm.guarantor_2_id_number,
        guarantor_2_phone: loanForm.guarantor_2_phone,
        guarantor_2_address: loanForm.guarantor_2_address,
        monthly_income: loanForm.monthly_income || 0,
        employment_status: loanForm.employment_status
      });
      alert('Loan application submitted successfully! 📄');
      setShowLoanModal(false);
      setLoanForm(initialLoanForm);
    } catch (error: unknown) {
      console.error('Loan submission error:', error);
      const axiosError = error as AxiosError<{ user?: string; detail?: string }>;
      alert(axiosError.response?.data?.user || axiosError.response?.data?.detail || 'Failed to submit loan application.');
    } finally {
      setLoading(false);
    }
  };
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.member_id || !paymentForm.amount) {
      alert('Please enter Member ID and Amount');
      return;
    }
    setLoading(true);
    try {
      await api.post('/operations/process-repayment/', {
        member_id: paymentForm.member_id,
        amount: paymentForm.amount
      });
      alert('Payment collected successfully! 💰');
      setShowPaymentModal(false);
      setPaymentForm({ member_id: '', amount: '', payment_type: 'cash' });
      fetchMetrics();
    } catch (error: unknown) {
      console.error('Payment error:', error);
      const axiosError = error as AxiosError<{ error?: string }>;
      alert(axiosError.response?.data?.error || 'Failed to process repayment.');
    } finally {
      setLoading(false);
    }
  };
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!depositForm.account_number && !depositForm.member_id) {
      alert('Please enter an account number or member ID');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post<{ reference: string }>('operations/process-deposit/', {
        ...depositForm,
        account_type: depositForm.account_type // Correct key for backend
      });
      setMessage({ text: `Deposit Success! Ref: ${r.data.reference || 'N/A'}`, type: 'success' });
      setShowDepositModal(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        setMessage({ text: (err.response?.data as { message?: string })?.message || 'Transaction failed', type: 'error' });
      } else {
        setMessage({ text: 'Error processing deposit', type: 'error' });
      }
    } finally { setLoading(false); }
  };
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!withdrawalForm.account_number && !withdrawalForm.member_id) {
      alert('Please enter an account number or member ID');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post<{ reference: string }>('operations/process-withdrawal/', {
        ...withdrawalForm,
        account_type: withdrawalForm.account_type // Correct key for backend
      });
      setMessage({ text: `Withdrawal Success! Ref: ${r.data.reference || 'N/A'}`, type: 'success' });
      setShowWithdrawalModal(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        setMessage({ text: (err.response?.data as { message?: string })?.message || 'Withdrawal failed', type: 'error' });
      } else {
        setMessage({ text: 'Error processing withdrawal', type: 'error' });
      }
    } finally { setLoading(false); }
  };
  const handleMessageSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post('operations/messages/', messageForm); alert('Sent!'); setShowMessageModal(false); fetchMessages(); } catch { alert('Error'); } };
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.client_name || !scheduleForm.location || !scheduleForm.scheduled_time) {
      alert('Please fill in Name, Location, and Time');
      return;
    }
    setLoading(true);
    try {
      const result = await authService.scheduleVisit({
        client_name: scheduleForm.client_name,
        location: scheduleForm.location,
        scheduled_time: scheduleForm.scheduled_time, // Modal now provides full datetime string
        notes: scheduleForm.notes || scheduleForm.purpose
      });
      // Construct a valid Visit object for the UI state
      if (result.success && result.data?.status === 'success') {
        const newVisit: Visit = {
          id: result.data.visit_id,
          client_name: scheduleForm.client_name,
          scheduled_time: scheduleForm.scheduled_time,
          purpose: scheduleForm.purpose || 'Collection',
          status: 'scheduled'
        };
        setScheduledVisits([...scheduledVisits, newVisit]);
      }
      alert('Visit Scheduled Successfully!');
      setShowScheduleModal(false);
      fetchVisits(); // Refresh list
    } catch (err) {
      if (err instanceof AxiosError) {
        alert('Failed to schedule: ' + ((err.response?.data as { error?: string })?.error || 'Unknown error'));
      } else {
        alert('Error scheduling visit');
      }
    } finally { setLoading(false); }
  };

  const handleVisitComplete = async (id: number) => {
    try {
      const res = await authService.completeVisit(id);
      if (res.success) {
        alert('Visit marked as completed! ✅');
        fetchVisits();
        fetchMetrics();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch {
      alert('Error completing visit');
    }

  };

  const handleAssignmentComplete = async (id: number) => {
    try {
      const res = await authService.completeAssignment(id);
      if (res.success) {
        alert('Assignment marked as completed! ✅');
        fetchAssignedClients();
        fetchMetrics();
      } else {
        alert('Failed: ' + (res.error || 'Unknown error'));
      }
    } catch {
      alert('Error completing assignment');
    }

  };

  const handleClientVisit = (client: { id: number; client_id?: string | number; name: string }) => {
    // Populate form IDs if they exist - Ensure String to avoid type errors
    const memberId = String(client.client_id || client.id);
    setDepositForm(prev => ({ ...prev, member_id: memberId }));
    setWithdrawalForm(prev => ({ ...prev, member_id: memberId }));
    setPaymentForm(prev => ({ ...prev, member_id: memberId }));
    setLoanForm(prev => ({ ...prev, member_id: memberId }));

    // Open action toolbox or just show a message
    alert(`Ready to process actions for ${client.name}. Use the toolbox on the right! 🛠️`);
  };

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

      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-24 right-8 px-6 py-4 rounded-xl shadow-xl z-50 text-white font-bold animate-bounce ${message.type === 'error' ? 'bg-error-500' : 'bg-success-500'
          }`}>
          {message.type === 'error' ? '🚫 ' : '✅ '} {message.text}
        </div>
      )}

      <MobileMetrics metrics={metrics} loadingMetrics={loadingMetrics} />

      {/* Main Grid: Content + Toolbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* LEFT COLUMN: Dynamic Tab Content (Spans 2 cols on Large) */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px]">
            {activeTab === 'client-registration' && <ClientRegistrationTab />}
            {activeTab === 'clients' && (
              <ClientsTab
                assignedClients={assignedClients}
                onVisit={handleClientVisit}
                onComplete={handleAssignmentComplete}
              />
            )}
            {activeTab === 'visits' && (
              <VisitsTab
                scheduledVisits={scheduledVisits}
                onAddStop={() => setShowScheduleModal(true)}
                onComplete={handleVisitComplete}
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
        loading={loading}
      />
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        formData={withdrawalForm}
        setFormData={setWithdrawalForm}
        onSubmit={handleWithdrawalSubmit}
        loading={loading}
      />
      <LoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        formData={loanForm}
        setFormData={setLoanForm}
        onSubmit={handleLoanSubmit}
        loading={loading}
      />
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        formData={paymentForm}
        setFormData={setPaymentForm}
        onSubmit={handlePaymentSubmit}
      />
      <ScheduleModal
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
