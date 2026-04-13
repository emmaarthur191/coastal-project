import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  api, apiService as authService
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Card } from '../components/ui/Card';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  Building2, 
  User, 
  Users, 
  CircleDollarSign, 
  Bike, 
  MessageSquare, 
  Settings,
  Handshake,
  Banknote,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import MobileMetrics from '../components/mobile/MobileMetrics';
import ClientsTab from '../components/mobile/ClientsTab';
import VisitsTab from '../components/mobile/VisitsTab';
// Removed inline MessagingTab import
import FieldToolbox from '../components/mobile/FieldToolbox';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import TellerOperationsHub from '../components/operational/TellerOperationsHub';
import {
  PaymentModal, ScheduleModal, MessageModal, KycModal, LoanModal
} from '../components/mobile/MobileModals';
import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';
import ProfileSettings from '../components/shared/ProfileSettings';
import type { 
  MobileBankerMetric, 
  VisitSchedule as Visit, 
  AssignedClient,
  MobileLoanFormData,
  MobilePaymentFormData,
  MobileScheduleFormData,
  MobileMessageFormData
} from '../types';

// Error Boundary Component
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Something went wrong in this section.</div>;
    return this.props.children;
  }
}

interface MappedClient extends AssignedClient {
  name: string;
  amountDue: string;
  nextVisit: string;
  priority: string;
}

function MobileBankerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const _hasMessagingAccess = ['manager', 'operations_manager', 'cashier', 'mobile_banker'].includes(user?.role || '');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- MENU ITEMS CONFIG (For Sidebar) ---
  const menuItems = React.useMemo(() => [
    { id: 'teller-operations', name: 'Teller Ops', icon: <Building2 className="w-full h-full" /> },
    { id: 'account-opening', name: 'Account Opening', icon: <User className="w-full h-full" /> },
    { id: 'clients', name: 'My Clients', icon: <Users className="w-full h-full" /> },
    { id: 'financial-requests', name: 'Fin. Requests', icon: <CircleDollarSign className="w-full h-full" /> },
    { id: 'visits', name: 'Visits', icon: <Bike className="w-full h-full" /> },
    { id: 'messaging', name: 'Messaging', icon: <MessageSquare className="w-full h-full" /> },
    { id: 'my_payslips', name: 'My Payslips', icon: <CircleDollarSign className="w-full h-full" /> },

    { id: 'profile_settings', name: 'Profile Settings', icon: <Settings className="w-full h-full" /> },
  ], []);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState('clients');
  const [initialView, setInitialView] = useState<'loans' | 'cash_advances' | 'refunds' | 'pending-loans'>('loans');
  const [initialShowForm, setInitialShowForm] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const initialLoanForm = {
    member_id: '', loan_amount: '', loan_purpose: '', term_months: '12', interest_rate: '10',
    date_of_birth: '', id_type: 'ghana_card', id_number: '', digital_address: '', town: '', city: '',
    next_of_kin_1_name: '', next_of_kin_1_relationship: '', next_of_kin_1_phone: '', next_of_kin_1_address: '',
    next_of_kin_2_name: '', next_of_kin_2_relationship: '', next_of_kin_2_phone: '', next_of_kin_2_address: '',
    guarantor_1_name: '', guarantor_1_id_type: 'ghana_card', guarantor_1_id_number: '', guarantor_1_phone: '', guarantor_1_address: '',
    guarantor_2_name: '', guarantor_2_id_type: 'ghana_card', guarantor_2_id_number: '', guarantor_2_phone: '', guarantor_2_address: '',
    monthly_income: '', employment_status: 'employed'
  };

  const [loanForm, setLoanForm] = useState<MobileLoanFormData>(initialLoanForm);
  const [paymentForm, setPaymentForm] = useState<MobilePaymentFormData>({ member_id: '', amount: '', payment_type: 'cash' });
  const [messageForm, setMessageForm] = useState<MobileMessageFormData>({ recipient: '', subject: '', content: '', priority: 'normal' });
  const [metrics, setMetrics] = useState<MobileBankerMetric | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [scheduledVisits, setScheduledVisits] = useState<Visit[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<MobileScheduleFormData>({ client_name: '', location: '', scheduled_time: '', purpose: '', notes: '' });

  // Assigned clients state
  const [assignedClients, setAssignedClients] = useState<MappedClient[]>([]);

  // --- EFFECTS ---
  useEffect(() => { fetchVisits(); fetchMetrics(); fetchAssignedClients(); }, []);

  const fetchAssignedClients = async () => {
    try {
      const response = await authService.getAssignments();
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
    } catch (_error) {
      setAssignedClients([]);
    }
  };


  const fetchVisits = async () => {
    try {
      const response = await authService.getVisits();
      const mappedVisits: Visit[] = (response.data || []).map((visit: Visit) => ({
        ...visit,
        scheduled_time: visit.scheduled_time || '09:00 AM',
        client: visit.client_name,
        type: visit.purpose || 'Collection',
        location: visit.location || 'Client Shop'
      }));
      setScheduledVisits(mappedVisits);
    } catch (_error) {
      console.error('Failed to fetch visits:', _error);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const response = await authService.getMobileBankerMetrics();
      setMetrics(response.data || null);
    } catch (_error) {
      console.error('Failed to fetch metrics:', _error);
    } finally {
      setLoadingMetrics(false);
    }
  };




  // --- HANDLERS ---
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'teller-operations': setActiveTab('teller-operations'); break;
      case 'loan': 
        setInitialView('loans');
        setInitialShowForm(true);
        setActiveTab('financial-requests'); 
        break;
      case 'payment': setShowPaymentModal(true); break;
      case 'kyc': setShowKycModal(true); break;
      case 'visit': setShowVisitModal(true); break;
      default: break;
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanForm.member_id || !loanForm.loan_amount) {
      return setMessage({ text: 'Member ID and Amount are required', type: 'error' });
    }
    setLoading(true);
    try {
      const response = await api.post<unknown>('banking/loans/', {
        ...loanForm,
        member: loanForm.member_id, // API expects member field
        amount: parseFloat(loanForm.loan_amount),
        status: 'pending'
      });
      // api utility returns { data: T }, and it throws on non-2xx
      if (response && response.data) {
        setMessage({ text: 'Loan Application Submitted!', type: 'success' });
        setShowLoanModal(false);
        setLoanForm(initialLoanForm);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      setMessage({ 
        text: axiosError.response?.data?.error || 'Loan submission failed', 
        type: 'error' 
      });
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
      await api.post('/mobile/repayment/', {
        member_id: paymentForm.member_id,
        amount: paymentForm.amount
      });
      alert('Payment collected successfully!');
      setShowPaymentModal(false);
      setPaymentForm({ member_id: '', amount: '', payment_type: 'cash' });
      fetchMetrics();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      alert(axiosError.response?.data?.error || 'Failed to process repayment.');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post('operations/messages/', messageForm); alert('Sent!'); setShowMessageModal(false); } catch { alert('Error'); } };
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
      if (result.success && result.data?.status === 'success') {
        const newVisit: Visit = {
          id: result.data.visit_id as number,
          client_name: scheduleForm.client_name,
          scheduled_time: scheduleForm.scheduled_time,
          purpose: scheduleForm.purpose || 'Collection',
          status: 'scheduled' as "completed" | "cancelled" | "scheduled"
        };
        setScheduledVisits([...scheduledVisits, newVisit]);
      }
      alert('Visit Scheduled Successfully!');
      setShowScheduleModal(false);
      fetchVisits(); // Refresh list
    } catch (_err) {
      alert('Error scheduling visit');
    } finally { setLoading(false); }
  };

  const handleVisitComplete = async (id: number) => {
    try {
      const res = await authService.completeVisit(id);
      if (res.success) {
        alert('Visit marked as completed!');
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
        alert('Assignment marked as completed!');
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
    const memberId = String(client.client_id || client.id);
    setPaymentForm(prev => ({ ...prev, member_id: memberId }));
    setLoanForm(prev => ({ ...prev, member_id: memberId }));
    alert(`Ready to process actions for ${client.name}. Use the toolbox on the right!`);
  };

  const quickActionButtons = [
    { action: 'teller-operations', label: 'Teller Ops', icon: <Building2 className="w-5 h-5 text-success-600" />, variant: 'success' as const },
    { action: 'loan', label: 'New Loan', icon: <Handshake className="w-5 h-5 text-primary-600" />, variant: 'primary' as const },
    { action: 'payment', label: 'Collect', icon: <Banknote className="w-5 h-5 text-warning-600" />, variant: 'warning' as const },
    { action: 'kyc', label: 'KYC Doc', icon: <Camera className="w-5 h-5 text-secondary-600" />, variant: 'secondary' as const }
  ];

  return (
    <DashboardLayout
      title="Field Operations Command"
      user={user}
      menuItems={menuItems}
      activeView={activeTab}
      onNavigate={(id) => {
        if (id === 'messaging') {
          navigate('/messaging');
        } else {
          setActiveTab(id);
        }
      }}
      onLogout={handleLogout}
    >

      {/* Toast Notification */}
      {message.text && (
        <div className={`fixed top-24 right-8 px-6 py-4 rounded-2xl shadow-2xl z-50 text-white font-bold flex items-center gap-3 animate-in slide-in-from-right duration-300 ${message.type === 'error' ? 'bg-error-600' : 'bg-success-600'
          }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />} {message.text}
        </div>
      )}

      <MobileMetrics metrics={metrics} loadingMetrics={loadingMetrics} />

      {/* Main Grid: Content + Toolbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* LEFT COLUMN: Dynamic Tab Content (Spans 2 cols on Large) */}
        <div className="lg:col-span-2">
          <Card className="min-h-[500px]">
            {activeTab === 'teller-operations' && <ErrorBoundary><TellerOperationsHub mode="mobile_banker" /></ErrorBoundary>}
            {activeTab === 'account-opening' && <ErrorBoundary><OnboardingHub mode="staff" /></ErrorBoundary>}
            {activeTab === 'financial-requests' && <ErrorBoundary><FinancialRequestsHub mode="staff" initialView={initialView} initialShowForm={initialShowForm} /></ErrorBoundary>}
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

            {activeTab === 'my_payslips' && <ErrorBoundary><StaffPayslipViewer /></ErrorBoundary>}
            {activeTab === 'profile_settings' && <ErrorBoundary><ProfileSettings user={user} /></ErrorBoundary>}
          </Card>
        </div>

        {/* RIGHT COLUMN: Field Toolbox */}
        <div>
          <FieldToolbox
            quickActionButtons={quickActionButtons}
            onQuickAction={handleQuickAction}
          />

        </div>

      </div>

      {/* --- MODALS --- */}
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
      <LoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        formData={loanForm}
        setFormData={setLoanForm}
        onSubmit={handleLoanSubmit}
        loading={loading}
      />
    </DashboardLayout>
  );
}

export default MobileBankerDashboard;
