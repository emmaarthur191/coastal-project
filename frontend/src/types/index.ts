import type { Account } from '../api/models/Account';
import type { AccountAccountTypeEnum } from '../api/models/AccountAccountTypeEnum';
import type { CashAdvance } from '../api/models/CashAdvance';
import type { Loan } from '../api/models/Loan';
import type { Message } from '../api/models/Message';
import type { MessageThread } from '../api/models/MessageThread';
import type { Refund } from '../api/models/Refund';
import type { ServiceRequest } from '../api/models/ServiceRequest';
import type { Transaction } from '../api/models/Transaction';
import type { User } from '../api/models/User';

export type { Account, User, Transaction, ServiceRequest };
import type { Product } from '../api/models/Product';
import type { Promotion } from '../api/models/Promotion';
export type { Product as FinancialProduct, Promotion as PromotionType };
import type { AccountOpeningRequest as BaseAccountOpeningRequest } from '../api/models/AccountOpeningRequest';
export interface AccountOpeningRequest extends BaseAccountOpeningRequest {
  nationality?: string;
  gender?: string;
}


export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
}

/**
 * Standard paginated response.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Extended User interface for UI components.
 */
export interface UserExtended extends User {
  phone_number?: string;
  profile_photo?: string | null;
  branch?: string;
  department?: string;
  last_login?: string;
  full_name?: string;
  is_approved?: boolean;
  date_joined?: string;
  phone?: string;
  two_factor_phone?: string;
  otp_verified?: boolean;
  needs_verification?: boolean;
}

/**
 * Extended Account interface including expanded user details.
 */
export interface AccountUser {
  id: number | string;
  full_name: string;
  email: string;
  phone?: string;
  staff_id?: string;
  role?: string;
}

export interface AccountWithDetails extends Omit<Account, 'user' | 'account_type'> {
  user?: AccountUser;
  account_type?: AccountAccountTypeEnum | string;
}


/**
 * Payslip interface for payroll management.
 */
export interface Payslip {
  id: string | number;
  month: number;
  year: number;
  pay_period_start: string;
  pay_period_end: string;
  base_pay: string;
  allowances: string;
  gross_pay: string;
  ssnit_contribution: string;
  total_deductions: string;
  net_salary: string;
  is_paid: boolean;
  generated_at: string;
  pdf_file?: string;
  pdf_url?: string;
  period_display?: string;
  created_at?: string;
}

/**
 * Account Closure Request for Maker-Checker workflow.
 */
export interface AccountClosureRequest {
  id: string | number;
  account: string | number;
  account_number: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | number;
  processed_by?: string | number;
  created_at: string;
  rejection_reason?: string;
  user_name?: string;
}

/**
 * Chat Data Interfaces.
 */
export interface ChatRoomData {
  id: number;
  name: string | null;
  display_name: string;
  is_group: boolean;
  members: User[];
  last_message: {
    content: string;
    sender_name: string;
    timestamp: string;
  } | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Call participant interface.
 */
export interface CallParticipant {
  id: string | number;
  first_name: string;
  last_name?: string;
  full_name?: string;
  role?: string;
}

/**
 * Active call state for WebRTC.
 */
export interface ActiveCall {
  id: string;
  type: 'video' | 'audio';
  participants: CallParticipant[];
  isInitiator: boolean;
}

/**
 * WebSocket signaling payload for WebRTC.
 */
export interface WebSocketSignal {
  type: 'call_offer' | 'call_answer' | 'new_ice_candidate' | 'call_end';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  sender_id: string;
  recipient_id?: string;
}

/**
 * Interface for EnhancedWebSocketManager to enable strict typing in components.
 */
export interface IWebSocketManager {
  sendOffer(offer: RTCSessionDescriptionInit, targetUserId: string | number): boolean;
  sendAnswer(answer: RTCSessionDescriptionInit, targetUserId: string | number): boolean;
  sendCandidate(candidate: RTCIceCandidateInit, targetUserId: string | number): boolean;
  sendEndCall(targetUserId: string | number): boolean;
  sendBusy(targetUserId: string | number): boolean;
  sendMessage(data: unknown): boolean;
}

export interface ChatMessageData {
  id: number;
  sender: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export type ExpenseCategory = 'Operational' | 'Utilities' | 'Payroll' | 'Maintenance' | 'Marketing' | 'Other';
export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

export interface ExpenseData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date?: string;
  status?: ExpenseStatus;
}

export interface Expense {
  id: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  transaction?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MobileBanker {
  id: number;
  name: string;
  staff_id: string;
  role?: string;
}

export interface MobileBankerMetrics {
  cash_collected: number;
  visits_completed: number;
  accounts_opened: number;
}

export interface ClientAssignment {
  id: number;
  client_name: string;
  location: string;
  status: string;
  priority: string;
  amount_due?: string;
  mobile_banker?: string | number;
}

export interface Member {
  id: number | string;
  name: string;
  email: string;
  current_assignment?: {
    id: number;
    banker: {
      id: number;
      name: string;
    } | null;
  } | null;
}

export interface NextOfKin {
  name: string;
  relationship: string;
  address: string;
  stakePercentage?: string;
  stake_percentage?: string;
}

export interface ManagerOverviewData {
  pendingApprovals: number;
  totalMembers: number;
  dailyTransactions: number;
  systemHealth: number;
}

export interface UserSettings {
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  notifications?: boolean;
  email_updates?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  two_factor_enabled?: boolean;
  timezone?: string;
  [key: string]: unknown;
}

export interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
}

export interface CreateLoanData {
  user: number;
  amount: number | string;
  interest_rate?: number | string;
  term_months: number | string;
  purpose: string;
  date_of_birth?: string;
  digital_address?: string;
  town?: string;
  city?: string;
  id_type: string;
  id_number: string;
  verification_notes?: string;
  
  // Next of Kin
  next_of_kin_1_name?: string;
  next_of_kin_1_relationship?: string;
  next_of_kin_1_phone?: string;
  next_of_kin_1_address?: string;
  
  // Guarantor
  guarantor_1_name?: string;
  guarantor_1_id_type?: string;
  guarantor_1_id_number?: string;
  guarantor_1_phone?: string;
  guarantor_1_address?: string;
}

export interface CreateComplaintData {
  category: string;
  subject: string;
  description: string;
  priority?: string;
  account_number?: string;
  related_transaction_id?: string | number;
}

export interface CreateMessageThreadData {
  subject: string;
  thread_type?: string;
  participant_ids?: (number | string)[];
  participants?: (number | string)[];
}

export interface SendMessageData {
  thread: number | string;
  content: string;
  message_type?: string;
}

export interface CreateAccountOpeningData {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number: string;
  date_of_birth?: string;
  id_type: string;
  id_number: string;
  account_type: string;
  initial_deposit?: number | string;
}

export interface PerformanceDashboardData {
  metric: string;
  value: string | number;
  unit?: string;
  icon?: string | React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  [key: string]: unknown;
}

export interface TransactionVolumeData {
  period: string;
  volume: number;
  count: number;
}

export interface TransactionVolumeSummary {
  total: number;
  success_rate: number;
  avg_response_time: number;
}

export interface PerformanceChartData {
  labels?: string[];
  datasets?: Array<{ label: string; data: number[] }>;
  [key: string]: unknown;
}

export interface SystemHealthComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  last_check: string;
}

export interface SystemHealthData {
  status: string;
  uptime: string;
  memory_usage: number;
  cpu_usage: number;
  database_connected: boolean;
  components?: SystemHealthComponent[];
}

export interface PerformanceAlert {
  id: number | string;
  type: string;
  title?: string;
  message: string;
  severity: 'critical' | 'warning' | 'info' | string;
  created_at?: string;
  timestamp?: string;
}

export interface PerformanceRecommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
  category?: string;
  impact?: string;
  effort?: string;
}

export interface PerformanceMetric {
  name: string;
  score?: number;
  value: string | number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

/**
 * Analytics data structures for reporting.
 */
export interface MonthlyReportData {
  month: string;
  loans: number;
  transactions: number;
  revenue: number;
  [key: string]: string | number | undefined;
}

export interface CategoryReportData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number | undefined;
}

export interface ReportsData {
  monthlyData: MonthlyReportData[];
  categoryData: CategoryReportData[];
}

export interface ServiceStats {
  total_requests: number;
  pending: number;
  completed: number;
  in_progress: number;
  by_type: Record<string, number>;
  average_resolution_time: string | null;
  monthly_volume?: MonthlyReportData[];
  type_distribution?: CategoryReportData[];
}

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  period?: string;
  [key: string]: string | undefined;
}

export interface CreateReportTemplateData {
  name: string;
  description?: string;
  report_type: string;
  template_format?: string;
  parameters?: Record<string, unknown>;
}

export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  phone_number?: string;
  password?: string;
  [key: string]: unknown;
}

export interface CreateServiceRequestData {
  service_type: string;
  account_id?: number | string;
  notes?: string;
  priority?: string;
  quantity?: number;
  delivery_method?: string;
  [key: string]: string | number | undefined;
}

export interface ComplaintStats {
  total_complaints: number;
  open_complaints: number;
  investigating_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
  escalated_complaints: number;
  avg_resolution_time_days: number;
}

export interface CreateReportScheduleData {
  template: number | string;
  schedule_type: string;
  frequency?: string;
  next_run?: string;
  recipients?: string[];
  is_active?: boolean;
}

export interface ReportAnalytics {
  total_reports: number;
  reports_by_type: Record<string, number>;
  generation_stats: {
    total_generated: number;
    avg_generation_time: number;
  };
  [key: string]: unknown;
}

export interface GeneratedReport {
  id: number | string;
  report_url?: string;
  status: string;
  generated_at?: string;
}

export interface ApiUsageData {
  endpoint: string;
  method: string;
  count: number;
  avg_response_time?: number;
}

export interface RateLimitData {
  endpoint: string;
  limit: number;
  remaining: number;
  reset_time?: string;
}

export interface HealthCheckData {
  service: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  latency_ms?: number;
  last_checked?: string;
  message?: string;
}

export interface SystemSettingData {
  key: string;
  value: string | number | boolean;
  category?: string;
  description?: string;
}

export interface AuditData {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_user: Record<string, number>;
  recent_events: AuditLogRecord[];
}

export interface MemberLookupResult {
  id: number;
  member_number: string;
  name: string;
  first_name: string;
  last_name: string;
  email_masked: string;
  phone_masked: string;
  role: string;
  is_active: boolean;
  // Extended fields for form pre-filling
  email?: string;
  phone_number?: string;
  date_of_birth?: string;
  digital_address?: string;
  occupation?: string;
  work_address?: string;
  position?: string;
  id_type?: string;
  id_number?: string;
}

export interface ClientsForMappingResult {
  id: number;
  name: string;
  email: string;
  phone: string;
  member_number: string;
  assigned_banker: {
    id: number;
    name: string;
    readonly staff_id: string;
  } | null;
}

export interface AuditLogRecord {
  id: number;
  user: number | null;
  user_email: string;
  user_name: string;
  action: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, unknown> | string;
  ip_address: string;
  created_at: string;
}

export interface LoginAttemptRecord {
  id: number;
  email: string;
  ip_address: string;
  user_agent: string;
  device: string;
  location: string;
  success: boolean;
  failure_reason?: string;
  timestamp: string;
}

export interface AssignedClient {
  id: number;
  client_name: string;
  client_id: string;
  mobile_banker_name: string;
  priority: string;
  status: string;
  location: string;
  last_visit?: string;
  address?: string;
  amount_due?: number | string;
  balance?: number | string;
  next_visit?: string;
}

export interface ScheduleVisitResponse {
  id: number;
  status: string;
  message: string;
  visit_id?: number | string;
}

export interface MobileBankerMetric {
  total_clients: number;
  active_visits: number;
  completed_visits: number;
  total_collections: number;
  scheduled_visits?: number;
  completed_today?: number;
  collections_due?: number;
  new_applications?: number;
}

/**
 * Interface for staff performance metrics.
 */
export interface StaffPerformance {
  staff_id: number;
  staff_name: string;
  transactions_processed: number;
  total_value: number;
  avg_processing_time?: number;
  efficiency_score?: number;
}

/**
 * Interface for pending approval items in operations.
 */
export interface PendingApprovalItem {
  id: string | number;
  type: 'loan' | 'cash_advance' | 'refund' | 'account_opening' | 'transaction';
  requested_by: string;
  amount: number;
  date: string;
  description?: string;
  status: string;
}

export interface OperationsMetrics {
  total_members: number;
  active_loans: number;
  total_deposits: number;
  pending_requests: number;
  daily_revenue: number;
  system_uptime?: string | number;
  financial_products?: number;
  transactions_today?: number;
  transaction_change?: number;
  failed_transactions?: number;
  total_transactions?: number;
  active_staff_count?: number;
  system_health?: 'healthy' | 'warning' | 'critical';
  failed_change?: number;
  staff_performance?: StaffPerformance[];
  pending_approvals?: PendingApprovalItem[];
  pending_items?: PendingApprovalItem[];
  daily_trends?: Array<{ date: string; value: number }>;
}

export interface BranchActivity {
  id: number;
  branch: string;
  activity_type: string;
  description: string;
  timestamp: string;
}

export interface SystemAlert {
  id: number;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
}

export interface WorkflowStatus {
  pending_tasks: number;
  in_progress: number;
  completed_today: number;
}

export interface MobileMessage {
  id: number;
  sender_name: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export interface RequestConfig extends RequestInit {
  method?: string;
  url?: string;
  data?: unknown;
  headers?: HeadersInit | Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  startTime?: number;
  responseType?: 'json' | 'blob' | 'text';
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Interface for dashboard metrics used in the Manager Dashboard charts and stats.
 */
export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string | React.ReactNode;
}

/**
 * Unified data structure for the Manager Dashboard.
 */
export interface ManagerDashboardData {
  branch_metrics?: DashboardMetric[];
  staff_performance?: StaffPerformance[];
  pending_approvals?: PendingApprovalItem[];
  recent_activities?: unknown[];
}

export interface ServiceCharge {
  id?: number;
  name: string;
  description: string;
  charge_type: 'percentage' | 'fixed' | string;
  rate: string | number;
  applicable_to: string[];
  is_active?: boolean;
  created_at?: string;
}

export interface CreateServiceChargeData {
  name: string;
  description: string;
  charge_type: string;
  rate: string | number;
  applicable_to: string[];
}

export interface VisitSchedule {
  id: number;
  client_name: string;
  scheduled_time: string;
  purpose: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  type?: string;
}

export interface InterestCalculationResult {
  principal: number;
  annual_rate: number;
  time_period_months: number;
  compounding_frequency: string;
  interest_amount: number;
  final_amount: number;
  account_type: string;
  monthly_payment?: number;
}

export interface CommissionCalculationResult {
  all_time_total: number;
  daily: { total: number; by_type: Record<string, string | number> };
  weekly: { total: number; by_type: Record<string, string | number> };
  monthly: { total: number; by_type: Record<string, string | number> };
}

export interface ServiceChargeCalculation {
  transaction_type?: string;
  amount?: number;
  transaction_amount?: number;
  total_service_charge?: number;
  net_amount?: number;
  commissionCalculation?: CommissionCalculationResult;
}

export interface MessageExtended extends Message {
  is_me?: boolean;
}

/**
 * Extended Message Thread interface.
 */
export interface MessageThreadExtended extends Omit<MessageThread, 'messages' | 'participants' | 'unread_count'> {
  participants?: number[] | string[];
  messages?: MessageExtended[];
  unread_count?: number | string;
}

/**
 * Extended Service Request interface.
 */
export interface ServiceRequestExtended extends ServiceRequest {
  service_type: string;
  member_name: string;
  member_id: string;
  member?: User; // Adding relative member user data
  priority?: string;
}

/**
 * Data structure for the member side dashboard.
 */
export interface MemberDashboardData {
  account_balance: number;
  recent_transactions: Transaction[];
  total_balance?: string | number;
  total_daily_susu?: string | number;
  available_balance?: string | number;
  loan_balance?: number;
  savings_balance?: number;
  available_tabs?: unknown[];
  user_permissions?: Record<string, boolean>;
  membership_status?: Record<string, unknown>;
}

/**
 * Summary of all accounts for a user.
 */
export interface AccountSummary {
  total_balance: number;
  accounts: Account[];
  total_savings?: number;
  total_loans?: number;
  available_balance?: number;
  monthly_contributions?: number;
}


/**
 * Data structure for resolving fraud alerts.
 */
export interface FraudAlertResolution {
  alert_id: number;
  resolution: 'genuine' | 'fraudulent' | 'investigating';
  notes: string;
  resolved_at?: string;
}

/**
 * Data structure for account closure requests.
 */
export interface AccountClosureData {
  account_id: number;
  reason: string;
  other_reason?: string;
  phone_number: string;
  otp_code: string;
}

/**
 * Result structure for report generation.
 */
export interface ReportGenerationResult {
  success: boolean;
  message: string;
  report_id?: string;
  download_url?: string;
}

/**
 * Summary statistics for staff account view.
 */
export interface StaffAccountSummary {
  total_accounts: number;
  active_accounts: number;
  total_balance: number;
  recent_accounts: number;
}
/**
 * Extended Cash Advance interface.
 */
export interface CashAdvanceExtended extends CashAdvance {
  borrower_name?: string;
  applicant_name?: string;
}

/**
 * Extended Loan interface.
 */
export interface LoanExtended extends Omit<Loan, 'user' | 'assigned_banker' | 'borrower_name' | 'borrower_email' | 'purpose'> {
  user: number | { id: number; name: string; email: string; full_name?: string };
  assigned_banker?: number | { id: number; name: string; email: string };
  borrower_name?: string;
  borrower_email?: string;
  applicant?: string;
  purpose?: string;
  balance?: number | string;
}

/**
 * Extended Refund interface.
 */
export interface RefundExtended extends Refund {
  member_name?: string;
  requested_amount?: number;
}

export interface StaffId {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  role: string;
  staff_id: string;
  employment_date?: string;
  is_active: boolean;
  is_approved: boolean;
  date_joined: string;
}

/**
 * Mobile Operations Form Types
 */
export interface MobileLoanFormData {
  member_id: string;
  loan_amount: string;
  loan_purpose: string;
  term_months: string;
  interest_rate: string;
  date_of_birth: string;
  id_type: string;
  id_number: string;
  digital_address: string;
  town: string;
  city: string;
  next_of_kin_1_name: string;
  next_of_kin_1_relationship: string;
  next_of_kin_1_phone: string;
  next_of_kin_1_address: string;
  next_of_kin_2_name: string;
  next_of_kin_2_relationship: string;
  next_of_kin_2_phone: string;
  next_of_kin_2_address: string;
  guarantor_1_name: string;
  guarantor_1_id_type: string;
  guarantor_1_id_number: string;
  guarantor_1_phone: string;
  guarantor_1_address: string;
  guarantor_2_name: string;
  guarantor_2_id_type: string;
  guarantor_2_id_number: string;
  guarantor_2_phone: string;
  guarantor_2_address: string;
  monthly_income: string;
  employment_status: string;
}

export interface MobilePaymentFormData {
  member_id: string;
  amount: string;
  payment_type: string;
}

export interface MobileScheduleFormData {
  client_name: string;
  location: string;
  scheduled_time: string;
  purpose: string;
  notes: string;
}

export interface MobileMessageFormData {
  recipient: string;
  subject: string;
  content: string;
  priority: string;
}

/**
 * Interface for monthly trend data points.
 */
export interface MonthlyReportData {
  month: string;
  loans: number;
  transactions: number;
  revenue: number;
}

/**
 * Interface for category distribution data points.
 */
export interface CategoryReportData {
  name: string;
  value: number;
  color: string;
}

/**
 * Machine Learning Fraud Detection types.
 */
export interface MLModelStatus {
  status: 'idle' | 'training' | 'ready' | 'error';
  last_trained: string | null;
  anomalies_detected: number;
  total_processed: number;
  accuracy_proxy?: number;
  model_type: string;
}

export interface MLFraudAnalysis {
  transaction_id: string | number;
  is_anomaly: boolean;
  anomaly_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  explanation?: string;
}


export interface ClientsForMappingResult {
  id: number;
  name: string;
  email: string;
  phone: string;
  member_number: string;
  assigned_banker: {
    id: number;
    name: string;
    readonly staff_id: string;
  } | null;
}
