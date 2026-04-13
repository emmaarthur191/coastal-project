import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService as authService, MessageThreadExtended, OperationsMetrics } from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';


// Modular Operational Components (Unified Hub)
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import SecurityOversight from '../components/operational/SecurityOversight';
import OperationalOverview from '../components/operational/OperationalOverview';

import { MonthlyReportData, CategoryReportData, UserExtended, LoginAttemptRecord, AuditLogRecord } from '../types';
import AdministrativeHub from '../components/operational/AdministrativeHub';
import ProfileSettings from '../components/shared/ProfileSettings';
import StaffPayslipViewer from '../components/staff/StaffPayslipViewer';


import { 
  BarChart3, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Megaphone, 
  MessageSquare, 
  FileBadge, 
  User 
} from 'lucide-react';

import { FraudAlert } from '../api/models/FraudAlert';
import { Message } from '../api/models/Message';

type ActiveView = 'overview' | 'financial-requests' | 'administration' | 'security' | 'complaints' | 'messaging' | 'settings' | 'my-payslips';



function OperationsManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | number | null>(null);

  const [_dashboardData, setDashboardData] = useState<{
    metrics: OperationsMetrics | null;
  }>({
    metrics: null,
  });

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttemptRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  // Messaging state
  const [_messageThreads, setMessageThreads] = useState<MessageThreadExtended[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThreadExtended | null>(null);
  const [_messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Data for Overview charts (Performance Metrics)
  const [overviewStats, setOverviewStats] = useState<{
    monthlyData: MonthlyReportData[];
    categoryData: CategoryReportData[];
  }>({
    monthlyData: [],
    categoryData: []
  });


  // --- HANDLERS ---
  const handleLogout = useCallback(async () => { await logout(); navigate('/login'); }, [logout, navigate]);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        metricsRes, fraudRes, threadsRes, statsRes, loginRes, auditRes
      ] = await Promise.all([
        authService.getOperationalMetrics(),
        authService.getFraudAlerts(),
        authService.getMessageThreads(),
        authService.getServiceStats(),
        authService.getLoginAttempts(),
        authService.getAuditLogs()
      ]);

      setDashboardData({
        metrics: metricsRes.success && metricsRes.data ? metricsRes.data : null,
      });

      if (fraudRes.success) {
        const data = fraudRes.data;
        setFraudAlerts((Array.isArray(data) ? data : (data as { results?: FraudAlert[] })?.results || []) as FraudAlert[]);
      }
      if (threadsRes.success) {
        const data = threadsRes.data;
        setMessageThreads((Array.isArray(data) ? data : (data as { results?: MessageThreadExtended[] })?.results || []) as MessageThreadExtended[]);
      }

      if (statsRes.success && statsRes.data) {
        setOverviewStats({
          monthlyData: statsRes.data.monthly_volume || [],
          categoryData: statsRes.data.type_distribution || []
        });
      } else {
        setOverviewStats({
          monthlyData: [],
          categoryData: []
        });
      }

      if (loginRes.success) {
        setLoginAttempts(loginRes.data || []);
      }
      if (auditRes.success) {
        setAuditLogs(auditRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const _handleSelectThread = async (thread: MessageThreadExtended) => {
    setSelectedThread(thread);
    try {
      const res = await authService.getThreadMessages(String(thread.id));
      if (res.success) {
        const data = res.data as Message[] | { results: Message[] };
        setMessages(Array.isArray(data) ? data : (data as { results: Message[] }).results || []);
      }
    } catch (_err) {
      console.error('Failed to load thread');
    }
  };

  const _handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;
    setIsProcessing('sending');
    try {
      await authService.createMessage({
        thread_id: String(selectedThread.id),
        content: newMessage
      });
      setNewMessage('');
      const res = await authService.getThreadMessages(String(selectedThread.id));
      if (res.success) {
        const data = res.data as Message[] | { results: Message[] };
        setMessages(Array.isArray(data) ? data : (data as { results: Message[] }).results || []);
      }
    } finally {
      setIsProcessing(null);
    }
  };



  // --- MENU ---
  const menuItems = [
    { id: 'overview', name: 'Operations Overview', icon: <BarChart3 className="w-full h-full" /> },
    { id: 'financial-requests', name: 'Financial Hub', icon: <FileText className="w-full h-full" /> },
    { id: 'administration', name: 'Administrative Center', icon: <Settings className="w-full h-full" /> },
    { id: 'security', name: 'Security & Fraud', icon: <ShieldCheck className="w-full h-full" /> },
    { id: 'complaints', name: 'Support Desk', icon: <Megaphone className="w-full h-full" /> },
    { id: 'messaging', name: 'Staff Messenger', icon: <MessageSquare className="w-full h-full" /> },
    { id: 'my-payslips', name: 'My Payslips', icon: <FileBadge className="w-full h-full" /> },
    { id: 'settings', name: 'My Profile', icon: <User className="w-full h-full" /> }
  ];


  // --- CONTENT ---
  const renderContent = () => {
    // metrics extracted if needed, but not used in returned JSX here

    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-8">
             <OperationalOverview
              monthlyData={overviewStats.monthlyData}
              categoryData={overviewStats.categoryData}
              loading={loading}
            />
          </div>
        );
      
      case 'financial-requests':
        return <FinancialRequestsHub mode="manager" initialView="loans" />;

      case 'administration':
        return <AdministrativeHub mode="manager" initialTab="staff-ids" />;

      case 'complaints':
        return <SupportHub mode="manager" initialTab="complaints" />;

      case 'security':
        return (
          <SecurityOversight
            initialTab="alerts"
            alerts={fraudAlerts}
            loginAttempts={loginAttempts}
            auditLogs={auditLogs}
            onInvestigate={(_id) => navigate(`/fraud/alerts`)}
            onConfirmFraud={(id) => authService.reviewFraudAlert(String(id), 'confirmed').then(() => fetchData())}
            onDismissAlert={(id) => authService.reviewFraudAlert(String(id), 'dismissed').then(() => fetchData())}
          />
        );
      case 'my-payslips':
        return <StaffPayslipViewer />;
      case 'settings':

        return <ProfileSettings user={user} />;
      default: return <div className="text-black font-black p-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-300">Select a unified module from the sidebar.</div>;
    }
  };

  return (
    <DashboardLayout
      title="Coastal Operations Master"
      user={user as UserExtended | null}
      menuItems={menuItems}
      activeView={activeView}
       onNavigate={(id) => {
         if (id === 'messaging') {
           navigate('/messaging');
         } else {
           setActiveView(id as ActiveView);
         }
       }}
      onLogout={handleLogout}
    >
      <div className="max-w-[1400px] mx-auto">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
}

export default OperationsManagerDashboard;
