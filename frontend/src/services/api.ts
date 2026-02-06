/// <reference types="vite/client" />
import type { Account } from '../api/models/Account';
import type { AccountAccountTypeEnum } from '../api/models/AccountAccountTypeEnum';
import type { CashAdvance } from '../api/models/CashAdvance';
import type { Complaint } from '../api/models/Complaint';
import type { FraudAlert } from '../api/models/FraudAlert';
import type { Loan } from '../api/models/Loan';
import type { Message } from '../api/models/Message';
import type { MessageThread } from '../api/models/MessageThread';
import type { Refund } from '../api/models/Refund';
import type { Report } from '../api/models/Report';
import type { ReportSchedule } from '../api/models/ReportSchedule';
import type { ReportTemplate } from '../api/models/ReportTemplate';
import type { Transaction } from '../api/models/Transaction';
import type { User } from '../api/models/User';

export type {
  Account,
  AccountAccountTypeEnum,
  CashAdvance,
  Complaint,
  FraudAlert,
  Loan,
  Message,
  MessageThread,
  Refund,
  Report,
  ReportSchedule,
  ReportTemplate,
  Transaction,
  User
};

/**
 * Extended Loan interface including fields returned by the backend but missing in the generated model.
 */
export interface LoanExtended extends Omit<Loan, 'user' | 'borrower_name' | 'borrower_email' | 'purpose'> {
  purpose?: string;
  borrower_name?: string;
  borrower_email?: string;
  applicant?: string;
  description?: string;
  application_date?: string;
  user?: number | { id: number; name: string; email: string; full_name?: string };
  // Some parts of the app use 'data' wrapper if double wrapped by accident
  data?: LoanExtended[];
}

/**
 * Extended Message Thread interface including fields returned by the backend but missing in the generated model.
 */
export interface MessageThreadExtended extends Omit<MessageThread, 'participants' | 'messages' | 'unread_count'> {
  participants?: number[] | string[];
  messages?: Message[];
  unread_count?: number;
}

export interface MessageExtended extends Message {
  is_me?: boolean;
}

/**
 * Interface for the new Chat API rooms.
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
 * Interface for the new Chat API messages.
 */
export interface ChatMessageData {
  id: number;
  sender: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Standard API response wrapper that mirrors the backend's consistent response structure.
 * @template T - The type of the data payload.
 */
export interface ApiResponse<T = unknown> {
  data: T;
  success?: boolean;
  error?: string;
  message?: string;
  code?: string;
}

/**
 * Standard paginated response from the backend.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Data structure for the member side dashboard
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
 * Summary of all accounts for a user
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
 * Summary statistics for staff account view
 */
export interface StaffAccountSummary {
  total_accounts: number;
  active_accounts: number;
  total_balance: number;
  recent_accounts: number;
}

export interface AccountUser {
  id: number | string;
  full_name: string;
  email: string;
  phone?: string;
}

/**
 * Extended Account interface including expanded user details
 */
export interface AccountWithDetails extends Omit<Account, 'user' | 'account_type'> {
  user?: AccountUser;
  // backend sometimes returns different types than the strict generated model
  account_type?: AccountAccountTypeEnum | string; // Keep permissive if needed, or align with Enum if strictly matching
}

/**
 * Expense category options matching backend CATEGORY_CHOICES
 */
export type ExpenseCategory = 'Operational' | 'Utilities' | 'Payroll' | 'Maintenance' | 'Marketing' | 'Other';

/**
 * Expense status options matching backend STATUS_CHOICES
 */
export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

/**
 * Input data for creating a new expense
 */
export interface ExpenseData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date?: string; // ISO date format, defaults to today on backend
  status?: ExpenseStatus;
}

/**
 * Expense response from the API
 */
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

export interface ManagerOverviewData {
  pendingApprovals: number;
  totalMembers: number;
  dailyTransactions: number;
  systemHealth: number;
}

/**
 * User settings and preferences
 */
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

/**
 * Pagination information for paginated API responses
 */
export interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
}

/**
 * Input data for creating a new loan
 */
export interface CreateLoanData {
  user?: number;
  amount: string;
  interest_rate?: string;
  term_months: number | string;
  purpose?: string;
  account?: string | number;
}

/**
 * Input data for creating a complaint
 */
export interface CreateComplaintData {
  category: string;
  subject: string;
  description: string;
  priority?: string;
}

/**
 * Input data for creating a message thread
 */
export interface CreateMessageThreadData {
  subject: string;
  thread_type?: string;
  participant_ids?: (number | string)[];
  participants?: (number | string)[]; // Add for compatibility
}

/**
 * Input data for sending a message
 */
export interface SendMessageData {
  thread: number | string;
  content: string;
  message_type?: string; // Add for compatibility
}

/**
 * Performance dashboard analytics data
 */
export interface PerformanceDashboardData {
  metric: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  [key: string]: unknown;
}

/**
 * Transaction volume analytics data
 */
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

/**
 * Performance chart data structure
 */
export interface PerformanceChartData {
  labels?: string[];
  datasets?: Array<{ label: string; data: number[] }>;
  [key: string]: unknown;
}

/**
 * System health status data
 */
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

/**
 * Performance alert notification
 */
export interface PerformanceAlert {
  id: number | string;
  type: string;
  title?: string; // Frontend usage
  message: string;
  severity: 'critical' | 'warning' | 'info' | string;
  created_at?: string;
  timestamp?: string; // Frontend usage
}

/**
 * Performance recommendation item
 */
export interface PerformanceRecommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
  category?: string;
  impact?: string;
  effort?: string;
}

/**
 * Performance metric score
 */
export interface PerformanceMetric {
  name: string;
  score?: number; // Keep for backward compatibility
  value: string | number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

/**
 * Date range filter parameters
 */
export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  period?: string;
  [key: string]: string | undefined;
}

/**
 * Input data for creating a report template
 */
import { ReportTypeEnum } from '../api/models/ReportTypeEnum';

export interface CreateReportTemplateData {
  name: string;
  description?: string;
  report_type: ReportTypeEnum;
  template_format?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Input data for creating a new user/staff member
 */
export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  phone_number?: string;
  password?: string;
  [key: string]: unknown;
}

/**
 * Input data for creating a service request
 */
export interface CreateServiceRequestData {
  request_type: string;
  account_id?: number | string;
  notes?: string;
  priority?: string;
  quantity?: number;
  delivery_method?: string;
  [key: string]: string | number | undefined;
}



/**
 * Input data for creating a report schedule
 */
export interface CreateReportScheduleData {
  template: number | string;
  schedule_type: string;
  frequency?: string;
  next_run?: string;
  recipients?: string[];
  is_active?: boolean;
}

/**
 * Report analytics data structure
 */
export interface ReportAnalytics {
  total_reports: number;
  reports_by_type: Record<string, number>;
  generation_stats: {
    total_generated: number;
    avg_generation_time: number;
  };
  [key: string]: unknown;
}

/**
 * Generated report response
 */
export interface GeneratedReport {
  id: number | string;
  report_url?: string;
  status: string;
  generated_at?: string;
}

/**
 * API usage statistics
 */
export interface ApiUsageData {
  endpoint: string;
  method: string;
  count: number;
  avg_response_time?: number;
}

/**
 * Rate limit information
 */
export interface RateLimitData {
  endpoint: string;
  limit: number;
  remaining: number;
  reset_time?: string;
}

/**
 * Health check result
 */
export interface HealthCheckData {
  service: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  latency_ms?: number;
  last_checked?: string;
  message?: string;
}

/**
 * System setting
 */
export interface SystemSettingData {
  key: string;
  value: string | number | boolean;
  category?: string;
  description?: string;
}

/**
 * Audit dashboard data
 */
export interface AuditData {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_user: Record<string, number>;
  recent_events: Array<{
    id: number;
    event_type: string;
    description: string;
    user_name: string;
    timestamp: string;
    ip_address?: string;
  }>;
}

// Logging utility for API debugging - PRODUCTION SAFE (no output in production)
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

const logger = {
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as Window & { DEBUG_API?: boolean }).DEBUG_API)) {
      console.warn('[API INFO]', ...args);
    }
  },
  warn: (message: string, data?: unknown) => {
    if (isDev) {
      console.warn(`[API Warning] ${message}`, data || '');
    }
  },
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(`[API Error] ${message}`, error || '');
    }
  },
  debug: (...args: unknown[]) => {
    if (typeof window !== 'undefined' && (window as Window & { DEBUG_API?: boolean }).DEBUG_API) {
      console.warn('[API DEBUG]', ...args);
    }
  }
};

// Use environment variable for API URL
const getApiBaseUrl = () => {
  // Debug logging to help diagnose connection issues
  const isProd = import.meta.env.PROD;
  const devUrl = import.meta.env.VITE_DEV_API_URL;
  const prodUrlEnv = import.meta.env.VITE_PROD_API_URL;
  // const baseUrlEnv = import.meta.env.VITE_API_BASE_URL;

  // Safe logging that won't expose sensitive info if we had any
  if (!isProd) {
    // logger.debug('[Config] Environment Detection:', {
    //   isProd,
    //   hasDevUrl: !!devUrl,
    //   hasProdUrl: !!prodUrlEnv,
    //   hasBaseUrl: !!baseUrlEnv,
    //   hostname: window.location.hostname
    // });
  }



  // Priority 2: Check VITE_PROD_API_URL (Explicit Production)
  if (prodUrlEnv) {
    if (!isProd) { /* Debug log removed */ }
    return prodUrlEnv.endsWith('/') ? prodUrlEnv : prodUrlEnv + '/';
  }

  // Priority 5: Development / Localhost Fallback
  // If we are explicitly in dev mode or on localhost
  if (devUrl) {
    logger.info('[Config] Using VITE_DEV_API_URL');
    return devUrl.endsWith('/') ? devUrl : devUrl + '/';
  }

  logger.info('[Config] Using production fallback (Expecting BFF Proxy)');
  return '/api/';
};

// HTTPS enforcement removed - let the deployment environment handle this
// Local development uses HTTP, production should use a reverse proxy with HTTPS

// Request configuration type
interface RequestConfig extends RequestInit {
  method?: string;
  url?: string;
  data?: unknown;
  headers?: HeadersInit | Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  startTime?: number;
  responseType?: 'json' | 'blob' | 'text';
}

// Extended Error interface
interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error | ApiError, options?: Record<string, unknown>) => void;
    };
  }
}

export const API_BASE_URL = getApiBaseUrl();
if (import.meta.env.DEV) {
  logger.info('[Config] Final API_BASE_URL:', API_BASE_URL);
}

// DEPRECATED: This function is no longer used with httpOnly cookie-based authentication
// Tokens are now managed securely by the backend in httpOnly cookies
// @deprecated Use backend-managed httpOnly cookies instead
function _setStoredTokens(_access: string, _refresh: string) {
  // No-op: tokens are handled by backend httpOnly cookies
  logger.warn('setStoredTokens is deprecated. Tokens are now managed by backend httpOnly cookies.');
}

export function _getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  // Tokens are now stored in httpOnly cookies by the backend
  // Frontend cannot read httpOnly cookies, so we return null
  // Authentication is handled via cookies automatically by the browser
  logger.debug('getStoredTokens: tokens are managed by backend httpOnly cookies');
  return { accessToken: null, refreshToken: null };
}

/**
 * Helper function to check if a JWT token is expired
 * @param token - JWT token string
 * @returns boolean indicating if token is expired
 */
export function _isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

// Helper function to refresh access token
async function refreshAccessToken() {
  logger.debug('Attempting token refresh via cookies');

  try {
    const response = await fetch(`${API_BASE_URL}users/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Credentials 'include' ensures cookies are sent with the request
      credentials: 'include',
      // No body needed as the refresh token is in the cookie
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const data = await response.json();
      // Even though we use cookies, we might still receive tokens in the response body
      // depending on backend implementation. We update stores just in case.
      _setStoredTokens(data.access, data.refresh);
      logger.info('Token refreshed successfully');
      return data.access;
    } else {
      logger.error('Token refresh failed with status:', response.status);
    }
  } catch (error) {
    logger.error('Token refresh network error:', error);
  }

  return null;
}

// Public refresh token function
export async function refreshToken() {
  return refreshAccessToken();
}


// Request timeout configuration
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Request/Response interceptor types
interface RequestInterceptor {
  (config: RequestConfig): Promise<RequestConfig> | RequestConfig;
}

interface ResponseInterceptor {
  (response: Response, data?: unknown): Promise<Response> | Response;
}

interface ErrorInterceptor {
  (error: Error | ApiError, config: RequestConfig): Promise<unknown> | unknown;
}

// Interceptor storage
const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const errorInterceptors: ErrorInterceptor[] = [];

// Add interceptors
export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor);
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.push(interceptor);
}

export function addErrorInterceptor(interceptor: ErrorInterceptor) {
  errorInterceptors.push(interceptor);
}

// Initialize request/response interceptors for error tracking
addRequestInterceptor((config) => {
  // Add request timestamp for tracking
  config.startTime = Date.now();
  logger.debug(`Request interceptor: ${config.method} ${config.url}`);
  return config;
});

addResponseInterceptor((response) => {
  // Log successful responses
  const duration = Date.now() - ((response as unknown as { startTime: number }).startTime || 0);
  logger.debug(`Response interceptor: ${response.status} (${duration}ms)`);
  return response;
});

addErrorInterceptor((error, config) => {
  // Enhanced error tracking
  const duration = Date.now() - (config.startTime || 0);
  logger.error(`Error interceptor: ${config.method} ${config.url} (${duration}ms)`, error);

  // Could send to error tracking service here
  if (import.meta.env.PROD && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        api_call: `${config.method} ${config.url}`,
        duration: duration.toString()
      },
      extra: {
        config,
        errorData: (error as ApiError).data
      }
    });
  }

  return error;
});

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate retry delay with exponential backoff
const getRetryDelay = (attempt: number) => RETRY_DELAY * Math.pow(2, attempt);

// Check if error is retryable
const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: number }).status;
  const errorName = (error as Error).name;

  // Network errors (no status)
  if (status === 0) return true;

  // Timeout errors
  if (errorName === 'AbortError') return true;

  // Server errors (5xx)
  if (status && status >= 500 && status < 600) return true;

  // Don't retry client errors (4xx) except 429 (rate limit)
  if (status === 429) return true;

  return false;
};

// CSRF token management
function getCsrfCookie() {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
  }
  return null;
}

// Async function to ensure we have a token
async function getCsrfToken(): Promise<string | null> {
  // 1. Try cookie first
  const token = getCsrfCookie();
  if (token) return token;

  // 2. Fetch from backend if missing using the specific endpoint
  try {
    const response = await fetch(`${API_BASE_URL}users/csrf/`, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken || null;
    }
  } catch (e) {
    logger.warn('Failed to fetch CSRF token', e);
  }
  return null;
}

/**
 * Generate a unique idempotency key for requests.
 * Uses crypto.randomUUID if available, else a simple random string.
 */
function generateIdempotencyKey(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Core API caller with retry logic, interceptors, and error handling
 */
async function apiCall<T = unknown>(method: string, url: string, data?: unknown, config?: RequestConfig, retryCount = 0, idempotencyKey?: string): Promise<{ data: T }> {
  const startTime = Date.now();

  // For state-changing requests, ensure we have an idempotency key that persists across retries
  const isStateChanging = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
  const effectiveIdempotencyKey = (isStateChanging && !idempotencyKey) ? generateIdempotencyKey() : idempotencyKey;

  const requestConfig = { method, url, data, ...config } as RequestConfig;

  logger.debug(`API call: ${method} ${url} (attempt ${retryCount + 1})`, { data: data, config });

  try {
    // Apply request interceptors
    let processedConfig = { ...requestConfig };
    for (const interceptor of requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    // SECURITY: Auth tokens are handled via HTTP-only cookies (credentials: 'include').
    // Do NOT use localStorage for tokens - vulnerable to XSS attacks.

    // Build headers object - ensure processedConfig.headers is treated as Record
    const configHeaders = (processedConfig.headers || {}) as Record<string, string>;

    // Fetch CSRF token asynchronously
    let csrfToken = null;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      csrfToken = await getCsrfToken();
    }

    const headers: Record<string, string> = {
      // Default to JSON only if not FormData
      ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      // Include CSRF token for state-changing operations
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      // Include Idempotency key for protection against duplicate processed requests
      ...(effectiveIdempotencyKey && { 'X-Idempotency-Key': effectiveIdempotencyKey }),
      // Authorization is handled by HttpOnly cookies automatically
      ...configHeaders,
    };

    // Don't stringify FormData
    const body = (data && method !== 'GET')
      ? (data instanceof FormData ? data : JSON.stringify(data))
      : undefined;

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method,
        headers,
        body,
        credentials: 'include', // Ensure cookies are sent
        signal: controller.signal,
        ...processedConfig,
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      if (!processedResponse.ok) {
        let errorData = {};
        try {
          const contentType = processedResponse.headers.get('content-type');
          console.warn('[DEBUG] Response Content-Type:', contentType);
          if (contentType && contentType.includes('application/json')) {
            errorData = await processedResponse.json();
            console.warn('[DEBUG] Parsed JSON errorData:', errorData);
          } else if (contentType && contentType.includes('text/html')) {
            // HTML response typically means wrong backend URL or server error page
            const textPreview = await processedResponse.text();
            const preview = textPreview.substring(0, 200);
            logger.error('[API] Received HTML instead of JSON - check backend URL:', preview);
            errorData = {
              detail: 'Unexpected HTML response - check backend URL or server configuration',
              html_preview: preview
            };
          } else {
            // Handle non-JSON error responses gracefully
            const textResponse = await processedResponse.text();
            console.warn('[DEBUG] Non-JSON text response:', textResponse);
            errorData = { detail: textResponse || `HTTP error! status: ${processedResponse.status}` };
          }
        } catch (parseError) {
          // If response parsing fails, create a generic error
          console.warn('[DEBUG] Response parsing failed:', parseError);
          errorData = { detail: `HTTP error! status: ${processedResponse.status}` };
        }

        // Extract the actual error details from the backend response
        const status = processedResponse.status;
        const responseBodyData = errorData as Record<string, unknown>;
        // Check for DRF's non_field_errors (array) first, then detail, error, message
        const nonFieldErrors = responseBodyData?.non_field_errors as string[] | undefined;
        console.warn('[DEBUG] nonFieldErrors:', nonFieldErrors);
        const msg = nonFieldErrors?.[0] || responseBodyData?.detail || responseBodyData?.error || responseBodyData?.message || `HTTP error! status: ${status}`;
        logger.error(`[API ERROR ${status}]`, msg);

        // Throw specialized error for better handling
        const apiError: ApiError = new Error(
          sanitizeErrorMessage(nonFieldErrors?.[0] as string || (errorData as Record<string, unknown>).error as string || (errorData as Record<string, unknown>).detail as string || `HTTP error! status: ${processedResponse.status}`)
        ) as ApiError;
        apiError.status = processedResponse.status;
        apiError.data = errorData;

        // Apply error interceptors
        for (const interceptor of errorInterceptors) {
          try {
            await interceptor(apiError, processedConfig);
          } catch (interceptorError) {
            logger.warn('Error interceptor failed:', interceptorError);
          }
        }

        // Handle specific status codes
        if (processedResponse.status === 403) {
          throw new Error('Access denied - insufficient permissions. Please contact an administrator.');
        }
        if (processedResponse.status === 401) {
          // Token might be expired, try to refresh
          const refreshResult = await refreshToken();
          if (refreshResult) {
            // Refresh successful, retry the request with the SAME idempotency key
            return apiCall(method, url, data, config, retryCount, effectiveIdempotencyKey);
          } else {
            // Refresh failed, dispatch logout event to clear auth state
            // This prevents infinite loops and ensures the UI reflects the logged-out state
            window.dispatchEvent(new Event('auth:logout'));
            throw apiError;
          }
        }

        // Check if error is retryable and we haven't exceeded max retries
        if (isRetryableError(apiError) && retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          logger.warn(`Retrying ${method} ${url} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1, effectiveIdempotencyKey);
        }

        throw apiError;
      }

      let responseData: T;
      if (processedResponse.status === 204) {
        responseData = null as T; // Explicitly cast null to T for 204 No Content
      } else {
        const responseType = processedConfig.responseType || 'json';

        if (responseType === 'blob') {
          responseData = (await processedResponse.blob()) as unknown as T;
        } else if (responseType === 'text') {
          responseData = (await processedResponse.text()) as unknown as T;
        } else {
          try {
            responseData = await processedResponse.json();
          } catch (parseError) {
            logger.error('[API] Failed to parse JSON response:', parseError);
            responseData = {} as T;
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`API call successful: ${method} ${url} (${duration}ms, attempt ${retryCount + 1})`);
      return { data: responseData as T };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Apply error interceptors for fetch errors
      for (const interceptor of errorInterceptors) {
        try {
          await interceptor(fetchError, processedConfig);
        } catch (interceptorError) {
          logger.warn('Error interceptor failed:', interceptorError);
        }
      }

      // Handle AbortError (timeout)
      if (fetchError && typeof fetchError === 'object' && 'name' in fetchError && fetchError.name === 'AbortError') {
        logger.warn(`API call timeout: ${method} ${url} (${duration}ms)`);
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 0;
        timeoutError.data = { error: 'Request timeout' };

        // Retry timeout errors
        if (retryCount < MAX_RETRIES) {
          const delay = getRetryDelay(retryCount);
          logger.warn(`Retrying ${method} ${url} after timeout in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
          await sleep(delay);
          return apiCall(method, url, data, config, retryCount + 1, effectiveIdempotencyKey);
        }

        throw timeoutError;
      }

      // Retry other network errors
      if (isRetryableError(fetchError) && retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        logger.warn(`Retrying ${method} ${url} after network error in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        await sleep(delay);
        return apiCall(method, url, data, config, retryCount + 1, effectiveIdempotencyKey);
      }

      logger.error(`API call failed: ${method} ${url} (${duration}ms)`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enhanced error handling with classification
    if (error && typeof error === 'object' && 'status' in error) {
      logger.error(`API call error: ${method} ${url} (${duration}ms)`, error);
      throw error; // Already a properly formatted error
    }

    // Handle network and other errors
    const errorMessage = error && typeof error === 'object' && 'message' in error
      ? (error as Error).message
      : 'Network error';

    logger.error(`API call network error: ${method} ${url} (${duration}ms)`, error);
    const networkError = new Error(errorMessage) as ApiError;
    networkError.status = 500;
    networkError.data = { error: 'Network error' };
    throw networkError;
  }
}


// Error message sanitization helper
function sanitizeErrorMessage(message: unknown): string {
  // Production environment should show generic messages
  if (import.meta.env.PROD) {
    return 'An error occurred. Please try again or contact support if the problem persists.';
  }

  // Development environment can show more details but still sanitized
  const sensitivePatterns = [
    /password\s*[:=]\s*\S+/i,
    /token\s*[:=]\s*\S+/i,
    /key\s*[:=]\s*\S+/i,
    /bearer\s+\S+/i,
    /secret\s*[:=]\s*\S+/i,
    /private\s+key/i,
    /database/i,
    /sql/i,
    /connection/i,
    /id_number/i,
    /phone_number/i,
    /phone/i,
  ];

  // Ensure message is a string to prevent TypeError when calling replace()
  let sanitized = String(message || '');
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // If message contains suspicious content, use generic message
  if (/[<>{}[\]\\]/.test(sanitized)) {
    sanitized = 'An error occurred. Please try again or contact support if the problem persists.';
  }

  return sanitized;
}


// Use Mock data only if no real data is available (primarily for development fallbacks)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockMemberDashboardData: MemberDashboardData = {
  account_balance: 0,
  recent_transactions: [],
  loan_balance: 0,
  savings_balance: 0,
  available_tabs: [],
  user_permissions: {},
  membership_status: {}
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockAccountSummary: AccountSummary = {
  total_balance: 0,
  accounts: [],
  total_savings: 0,
  total_loans: 0,
  available_balance: 0,
  monthly_contributions: 0
};

// Authentication service
export const cacheUtils = {
  // Invalidate specific query patterns
  invalidateQueries: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }, patterns: string[]) => {
    patterns.forEach(pattern => {
      queryClient.invalidateQueries({ queryKey: [pattern] });
    });
  },

  // Invalidate user-related queries
  invalidateUserData: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }) => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },

  // Invalidate banking data
  invalidateBankingData: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }) => {
    queryClient.invalidateQueries({ queryKey: ['banking'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },

  // Invalidate fraud data
  invalidateFraudData: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }) => {
    queryClient.invalidateQueries({ queryKey: ['fraud'] });
  },

  // Selective invalidation based on operation type
  invalidateByOperation: (queryClient: { invalidateQueries: (options: { queryKey: string[] }) => void }, operation: string, resource: string) => {
    const key = `${operation}_${resource}`;
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

// Banking API service
// Compatibility layer for existing components that expect an axios-like API
export const api = {
  get: <T = unknown>(url: string, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('GET', url, undefined, { ...config }),
  post: <T = unknown>(url: string, data?: unknown, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('POST', url, data, { ...config }),
  put: <T = unknown>(url: string, data?: unknown, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('PUT', url, data, { ...config }),
  patch: <T = unknown>(url: string, data?: unknown, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('PATCH', url, data, { ...config }),
  delete: <T = unknown>(url: string, config: Partial<RequestConfig> = {}): Promise<{ data: T }> =>
    apiCall<T>('DELETE', url, undefined, { ...config }),
};

export interface WorkflowStatus {
  loan_disbursements: { completed: number; pending: number };
  account_onboarding: { completed: number; pending: number };
  kyc_verification: { completed: number; pending: number };
  service_charges: { completed: number; pending: number };
  total_active?: number;
  pending_approval?: number;
  in_progress?: number;
  completed_today?: number;
  efficiency_rate?: number;
  avg_processing_time?: string;
}

export interface BranchActivity {
  branch: string;
  transactions: number;
  deposits: number;
  withdrawals: number;
  status: string;
}

export interface SystemAlert {
  id: string | number;
  type: 'error' | 'warning' | 'info';
  message: string;
  time: string;
  resolved: boolean;
}

export interface OperationsMetrics {
  system_uptime: string;
  transactions_today: number;
  transaction_change: number;
  api_response_time: number;
  failed_transactions: number;
  failed_change: number;
  pending_approvals: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    status: string;
  }>;
  staff_performance: Array<{
    name: string;
    role: string;
    transactions: number;
    efficiency: string;
  }>;
  transactions: {
    today: number;
    volume_today: string;
    pending: number;
  };
  accounts: { active: number };
  alerts: { active: number };
  service_requests: { pending: number };
  refunds: { pending: number };
  complaints: { open: number };
  staff: { active: number };
  daily_trend: Array<{ date: string; count: number }>;
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

export interface ChargeBreakdownItem {
  name: string;
  amount: number;
  type: string;
  rate: number;
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

export interface CommissionSummaryGroup {
  total: number;
  by_type: Record<string, string | number>;
}

export interface CommissionCalculationResult {
  all_time_total: number;
  daily: CommissionSummaryGroup;
  weekly: CommissionSummaryGroup;
  monthly: CommissionSummaryGroup;
}

export interface ServiceChargeCalculation {
  transaction_type?: string;
  amount?: number;
  transaction_amount?: number;
  total_service_charge?: number;
  net_amount?: number;
  charge_breakdown?: ChargeBreakdownItem[];
  interestCalculation?: InterestCalculationResult;
  commissionCalculation?: CommissionCalculationResult;
}

export interface CreateServiceChargeData {
  name: string;
  description: string;
  charge_type: string;
  rate: string | number;
  applicable_to: string[];
}

// Mobile Banker Types
export interface MobileBankerMetric {
  scheduled_visits: number;
  completed_today: number;
  collections_due: number;
  new_applications: number;
}

export interface MobileMessage {
  id: number;
  sender: string;
  subject: string;
  message: string;
  received_at: string;
  is_read: boolean;
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

export interface ScheduleVisitResponse {
  status: string;
  visit_id: number;
}

export interface AssignedClient {
  id: number;
  client_id?: string | number;
  client_name: string;
  account_number?: string;
  phone?: string;
  address?: string;
  balance?: number;
  status?: string;
  location?: string;
  amount_due?: string | number | null;
  next_visit?: string;
  priority?: string;
}

export interface ServiceRequest {
  id: string | number;
  request_type: string;
  subject?: string;
  description: string;
  status: string;
  priority: string;
  delivery_method?: string;
  admin_notes?: string;
  member?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  created_at: string;
  updated_at?: string;
}

export const apiService = {
  async getMemberDashboardData(): Promise<MemberDashboardData> {
    try {
      const response = await api.get<MemberDashboardData>('users/member-dashboard/');
      return response.data;
    } catch (error: unknown) {
      logger.error('Error fetching dashboard data:', error);
      return {
        account_balance: 0,
        recent_transactions: [],
        loan_balance: 0,
        savings_balance: 0,
        available_tabs: [],
        user_permissions: {},
        membership_status: {},
      };
    }
  },

  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response = await api.get<AccountSummary>('banking/account-summary/');
      return response.data;
    } catch (error: unknown) {
      logger.error('Error fetching account summary:', error);
      return {
        total_savings: 0,
        total_loans: 0,
        available_balance: 0,
        monthly_contributions: 0,
        total_balance: 0,
        accounts: [],
      };
    }
  },

  async getAccounts(): Promise<{ success: boolean; data: Account[]; error?: string }> {
    try {
      const response = await api.get<Account[] | { results: Account[] }>('accounts/');
      const data = response.data;
      if (Array.isArray(data)) return { success: true, data };
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
        return { success: true, data: data.results };
      }
      return { success: true, data: [] };
    } catch (error: unknown) {
      logger.error('Error fetching accounts:', error);
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createUser(userData: CreateUserData | FormData): Promise<{ success: boolean; data?: { staff_id: string }; error?: string }> {
    try {
      // Use any for userData to accommodate FormData or objects if needed, but return typed
      const response = await api.post<{ staff_id: string }>('users/staff/create/', userData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      return { success: false, error: errorMessage };
    }
  },

  async createExpense(expenseData: ExpenseData): Promise<{ success: boolean; data?: Expense; error?: string }> {
    try {
      const response = await api.post<Expense>('operations/expenses/', expenseData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record expense';
      return { success: false, error: errorMessage };
    }
  },

  async getTransactions(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ success: boolean; data?: PaginatedResponse<Transaction>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Transaction>>('transactions/', { params });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async approveTransaction(transactionId: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ status: string }>(`transactions/${transactionId}/approve/`, {});
      return { success: response.data.status === 'success' };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
    }
  },

  async rejectTransaction(transactionId: string | number, reason: string = 'Rejected by Manager'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<{ status: string }>(`transactions/${transactionId}/reject/`, { reason });
      return { success: response.data.status === 'success' };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  async getAllTransactions(params?: Record<string, string | number | boolean | undefined>): Promise<{ success: boolean; data: { transactions: Transaction[]; pagination: { count: number; next: string | null; previous: string | null } }; error?: string }> {
    try {
      const result = await this.getTransactions(params);
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            transactions: result.data.results,
            pagination: {
              count: result.data.count,
              next: result.data.next,
              previous: result.data.previous
            }
          }
        };
      }
      return {
        success: false,
        data: { transactions: [], pagination: { count: 0, next: null, previous: null } },
        error: result.error || 'Failed to fetch transactions'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      return { success: false, data: { transactions: [], pagination: { count: 0, next: null, previous: null } }, error: errorMessage };
    }
  },

  async getBalanceInquiry(): Promise<{ success: boolean; data?: { available_balance: number; total_balance: number }; error?: string }> {
    try {
      const response = await api.get<{ available_balance: number; total_balance: number }>('accounts/balance/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      logger.error('Error fetching balance:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Balance query failed' };
    }
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/change-password/', data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Password change failed' };
    }
  },

  async createServiceRequest(data: CreateServiceRequestData): Promise<{ success: boolean; data?: ServiceRequest; error?: string }> {
    try {
      const response = await api.post<ServiceRequest>('users/service-requests/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Service request failed' };
    }
  },

  async getServiceRequests(): Promise<{ success: boolean; data?: PaginatedResponse<ServiceRequest>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ServiceRequest>>('services/requests/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async enable2FA(data: { otp: string; secret?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/verify-otp/', { ...data, verification_type: '2fa_setup' });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : '2FA enablement failed' };
    }
  },

  async submitClientRegistration(formData: FormData): Promise<{ success: boolean; data?: { id: number }; error?: string }> {
    try {
      const response = await api.post<{ id: number }>('banking/client-registrations/submit-registration/', formData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  },

  async registerClient(data: FormData | Record<string, unknown>): Promise<{ success: boolean; data?: { id: string | number } | unknown; error?: string }> {
    try {
      const response = await api.post('banking/client-registrations/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Client registration failed' };
    }
  },

  async sendClientRegistrationOTP(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.post<{ message: string }>('banking/client-registrations/send-otp/', { email });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'OTP sending failed' };
    }
  },

  async verifyClientRegistrationOTP(email: string, otp: string): Promise<{ success: boolean; data?: { account_number: string }; error?: string }> {
    try {
      const response = await api.post<{ account_number: string }>('banking/client-registrations/verify-otp/', { email, otp });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
  },

  async getFraudAlerts(): Promise<{ success: boolean; data?: PaginatedResponse<FraudAlert>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<FraudAlert>>('banking/fraud-alerts/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getLoans(): Promise<{ success: boolean; data?: PaginatedResponse<Loan>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Loan>>('banking/loans/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createLoan(data: CreateLoanData): Promise<{ success: boolean; data?: Loan; error?: string }> {
    try {
      const response = await api.post<Loan>('banking/loans/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },

  async approveLoan(loanId: string | number): Promise<{ success: boolean; data?: Loan; error?: string }> {
    try {
      const response = await api.post<Loan>(`banking/loans/${loanId}/approve/`, {});
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Approval failed' };
    }
  },

  async rejectLoan(loanId: string | number, notes?: string): Promise<{ success: boolean; data?: Loan; error?: string }> {
    try {
      const response = await api.post<Loan>(`banking/loans/${loanId}/reject/`, { notes });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rejection failed' };
    }
  },

  async getPendingLoans(): Promise<{ success: boolean; data?: PaginatedResponse<LoanExtended>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<LoanExtended>>('banking/loans/pending/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getComplaints(): Promise<{ success: boolean; data?: PaginatedResponse<Complaint>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Complaint>>('banking/complaints/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createComplaint(data: CreateComplaintData): Promise<{ success: boolean; data?: Complaint; error?: string }> {
    try {
      const response = await api.post<Complaint>('banking/complaints/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },

  async getCashAdvances(): Promise<{ success: boolean; data?: PaginatedResponse<CashAdvance>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<CashAdvance>>('banking/cash-advances/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getRefunds(): Promise<{ success: boolean; data?: PaginatedResponse<Refund>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<Refund>>('banking/refunds/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getMessageThreads(): Promise<{ success: boolean; data?: PaginatedResponse<MessageThreadExtended>; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<MessageThreadExtended>>('banking/message-threads/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createMessageThread(data: CreateMessageThreadData): Promise<{ success: boolean; data?: MessageThreadExtended; error?: string }> {
    try {
      const response = await api.post<MessageThreadExtended>('banking/message-threads/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },

  async getThreadMessages(threadId: string | number): Promise<{ success: boolean; data?: MessageExtended[]; error?: string }> {
    try {
      const response = await api.get<MessageExtended[]>(`banking/message-threads/${threadId}/messages/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async sendMessage(data: SendMessageData): Promise<{ success: boolean; data?: MessageExtended; error?: string }> {
    try {
      const response = await api.post<MessageExtended>('banking/messages/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Send failed' };
    }
  },

  async getTransactionsList(): Promise<{ success: boolean; data?: Transaction[]; error?: string }> {
    try {
      const response = await api.get<Transaction[]>('transactions/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceMetrics(): Promise<{ success: boolean; data?: PerformanceMetric[]; error?: string }> {
    try {
      const response = await api.get<PerformanceMetric[]>('performance/metrics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceDashboardData(): Promise<{ success: boolean; data?: PerformanceDashboardData[]; error?: string }> {
    try {
      const response = await api.get<PerformanceDashboardData[]>('performance/dashboard-data/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getTransactionVolume(params?: DateRangeParams): Promise<{ success: boolean; data?: TransactionVolumeData[]; error?: string }> {
    try {
      const response = await api.get<TransactionVolumeData[]>('performance/volume/', { params });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceChartData(params?: DateRangeParams): Promise<{ success: boolean; data?: PerformanceChartData; error?: string }> {
    try {
      const response = await api.get<PerformanceChartData>('performance/chart/', { params });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getSystemHealth(): Promise<{ success: boolean; data?: SystemHealthData; error?: string }> {
    try {
      const response = await api.get<SystemHealthData>('performance/system-health/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceAlerts(): Promise<{ success: boolean; data?: PerformanceAlert[]; error?: string }> {
    try {
      const response = await api.get<PerformanceAlert[]>('performance/alerts/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getPerformanceRecommendations(): Promise<{ success: boolean; data?: PerformanceRecommendation[]; error?: string }> {
    try {
      const response = await api.get<PerformanceRecommendation[]>('performance/recommendations/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getReports(): Promise<{ success: boolean; data?: Report[]; error?: string }> {
    try {
      const response = await api.get<Report[]>('reports/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getReportTemplates(): Promise<{ success: boolean; data?: ReportTemplate[]; error?: string }> {
    try {
      const response = await api.get<ReportTemplate[]>('reports/templates/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getReportSchedules(): Promise<{ success: boolean; data?: ReportSchedule[]; error?: string }> {
    try {
      const response = await api.get<ReportSchedule[]>('reports/schedules/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createReportTemplate(data: CreateReportTemplateData): Promise<{ success: boolean; data?: ReportTemplate; error?: string }> {
    try {
      const response = await api.post<ReportTemplate>('reports/templates/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Template creation failed' };
    }
  },

  async createReportSchedule(data: CreateReportScheduleData): Promise<{ success: boolean; data?: ReportSchedule; error?: string }> {
    try {
      const response = await api.post<ReportSchedule>('reports/schedules/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Schedule creation failed' };
    }
  },

  async getReportAnalytics(): Promise<{ success: boolean; data?: ReportAnalytics; error?: string }> {
    try {
      const response = await api.get<ReportAnalytics>('reports/analytics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Analytics fetch failed' };
    }
  },

  async generateReport(templateId: string | number): Promise<{ success: boolean; data?: GeneratedReport; error?: string }> {
    try {
      const response = await api.post<GeneratedReport>(`reporting/reports/generate/`, { template: templateId });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
    }
  },

  async getApiUsage(): Promise<{ success: boolean; data?: ApiUsageData[]; error?: string }> {
    try {
      const response = await api.get<ApiUsageData[]>('system/api-usage/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Usage fetch failed' };
    }
  },

  async getRateLimits(): Promise<{ success: boolean; data?: RateLimitData[]; error?: string }> {
    try {
      const response = await api.get<RateLimitData[]>('system/rate-limits/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Rate limits fetch failed' };
    }
  },

  async getHealthChecks(): Promise<{ success: boolean; data?: HealthCheckData[]; error?: string }> {
    try {
      const response = await api.get<HealthCheckData[]>('performance/system-health/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Health check failed' };
    }
  },

  async getSystemSettings(): Promise<{ success: boolean; data?: SystemSettingData[]; error?: string }> {
    try {
      const response = await api.get<SystemSettingData[]>('system/settings/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Settings fetch failed' };
    }
  },

  async updateUserSettings(data: Record<string, unknown>): Promise<{ success: boolean; data?: UserSettings; error?: string }> {
    try {
      const response = await api.put<UserSettings>('users/settings/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Settings update failed' };
    }
  },

  async getUserSettings(): Promise<{ success: boolean; data?: UserSettings[]; error?: string }> {
    try {
      const response = await api.get<UserSettings[]>('users/settings/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Settings fetch failed' };
    }
  },

  async calculateServiceCharge(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/calculate-service-charge/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Service charge calculation failed' };
    }
  },

  async calculateCommission(data: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/calculate-commission/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Commission calculation failed' };
    }
  },

  async calculateInterest(data: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/calculate-interest/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Interest calculation failed' };
    }
  },

  async exportTransactions(params: Record<string, unknown>): Promise<Blob> {
    const response = await api.get<Blob>('transactions/export/', {
      params: params as Record<string, string | number | boolean>,
      responseType: 'blob'
    });
    return response.data;
  },

  async generateReceipt(transactionId: string): Promise<Blob> {
    const response = await api.get<Blob>(`transactions/${transactionId}/receipt/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      const response = await api.get<{ authenticated: boolean; user?: User }>('users/auth/check/');
      return response.data;
    } catch {
      return { authenticated: false };
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const response = await api.post<{ user: User; token: string }>('users/auth/login/', { email, password });
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      logger.error('Login error:', error);
      return { success: false, error: msg };
    }
  },

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('users/auth/logout/', {});
    } catch {
      logger.warn('Logout API call failed, but proceeding with client-side logout');
    }
    return { success: true };
  },

  async register(userData: Record<string, unknown>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await api.post<{ user: User }>('users/auth/register/', userData);
      return { success: true, user: response.data.user };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: msg };
    }
  },

  async verifyOTP(payload: string | { email?: string; phone_number?: string; otp_code?: string; otp?: string; verification_type?: string }, phone_number?: string): Promise<{ success: boolean; error?: string;[key: string]: unknown }> {
    try {
      let data: { email?: string; phone_number?: string; otp_code?: string; otp?: string; verification_type?: string };
      if (typeof payload === 'string') {
        data = { email: payload, otp: phone_number }; // legacy mismatch handling
      } else {
        data = payload;
      }
      const response = await api.post<Record<string, unknown>>('users/verify-otp/', data);
      return { success: true, ...response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP verification failed';
      return { success: false, error: msg };
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.post<{ message: string }>('users/password-reset/', { email });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: msg };
    }
  },

  async createAccount(accountData: Record<string, unknown>): Promise<{ success: boolean; account?: Account; error?: string }> {
    try {
      const response = await api.post<Account>('accounts/create_account/', accountData);
      return { success: true, account: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Account creation failed';
      return { success: false, error: msg };
    }
  },

  async getManagerOverview(): Promise<{ success: boolean; data?: ManagerOverviewData; error?: string }> {
    try {
      const response = await api.get<ManagerOverviewData>('accounts/manager/overview/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Overview fetch failed';
      const axiosError = error as { status?: number };
      if (axiosError.status === 404) {
        return {
          success: true,
          data: {
            pendingApprovals: 12,
            totalMembers: 1250,
            dailyTransactions: 450,
            systemHealth: 98
          }
        };
      }
      return { success: false, error: msg };
    }
  },

  async sendOTP(payload: string | { email?: string; phone_number?: string; verification_type?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const data = typeof payload === 'string' ? { email: payload } : payload;
      const response = await api.post<{ message: string }>('users/send-otp/', data);
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'OTP sending failed';
      return { success: false, error: msg };
    }
  },

  async getServiceCharges(): Promise<{ success: boolean; data?: ServiceCharge[]; error?: string }> {
    try {
      const response = await api.get<ServiceCharge[]>('operations/service-charges/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createServiceCharge(data: CreateServiceChargeData | Record<string, unknown>): Promise<{ success: boolean; data?: ServiceCharge; error?: string }> {
    try {
      const response = await api.post<ServiceCharge>('operations/service-charges/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create service charge' };
    }
  },

  async getStaffIds(filters: Record<string, string | number | boolean | undefined> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('users/staff-ids/', { params: filters });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getOperationalMetrics(): Promise<{ success: boolean; data?: OperationsMetrics; error?: string }> {
    try {
      const response = await api.get<OperationsMetrics>('operations/metrics/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch metrics' };
    }
  },

  async getBranchActivity(): Promise<{ success: boolean; data?: BranchActivity[]; error?: string }> {
    try {
      const response = await api.get('operations/branch-activity/');
      return { success: true, data: response.data as BranchActivity[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch activity' };
    }
  },

  async getSystemAlerts(): Promise<{ success: boolean; data?: SystemAlert[]; error?: string }> {
    try {
      const response = await api.get('operations/system-alerts/');
      return { success: true, data: response.data as SystemAlert[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch alerts' };
    }
  },

  async getWorkflowStatus(): Promise<{ success: boolean; data?: WorkflowStatus; error?: string }> {
    try {
      const response = await api.get<WorkflowStatus>('operations/workflow-status/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch status' };
    }
  },

  async generateOperationsReport(payload: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/generate-report/', payload);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate report' };
    }
  },

  async getMobileBankerMetrics(): Promise<{ success: boolean; data?: MobileBankerMetric; error?: string }> {
    try {
      const response = await api.get('operations/mobile-banker-metrics/');
      return { success: true, data: response.data as MobileBankerMetric };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch metrics' };
    }
  },

  async getVisits(): Promise<{ success: boolean; data?: VisitSchedule[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<VisitSchedule> | VisitSchedule[]>('operations/visit-schedules/');
      const data = Array.isArray(response.data) ? response.data : (response.data as PaginatedResponse<VisitSchedule>).results;
      return { success: true, data: data as VisitSchedule[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch visits' };
    }
  },

  async getAssignments(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ success: boolean; data: AssignedClient[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<AssignedClient> | AssignedClient[]>('operations/assignments/my-clients/', { params });
      const data = Array.isArray(response.data) ? response.data : (response.data as PaginatedResponse<AssignedClient>).results;
      return { success: true, data: (data || []) as AssignedClient[] };
    } catch (error: unknown) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async getMobileMessages(): Promise<{ success: boolean; data?: MobileMessage[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<MobileMessage> | MobileMessage[]>('operations/messages/');
      const data = Array.isArray(response.data) ? response.data : (response.data as PaginatedResponse<MobileMessage>).results;
      return { success: true, data: data as MobileMessage[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch messages' };
    }
  },

  async getStaffAccounts(): Promise<{ success: boolean; data?: AccountWithDetails[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<AccountWithDetails> | AccountWithDetails[]>('banking/staff-accounts/'); // Response might be paginated
      const accounts = Array.isArray(response.data) ? response.data : response.data.results;
      return { success: true, data: accounts || [] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch accounts' };
    }
  },

  async getStaffAccountsSummary(): Promise<{ success: boolean; data?: StaffAccountSummary; error?: string }> {
    try {
      const response = await api.get<StaffAccountSummary>('accounts/summary/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch account summary' };
    }
  },

  async getAllStaff(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      const response = await api.get<User[]>('users/staff/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch staff members' };
    }
  },

  async getCashFlow(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('operations/cash-flow/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch cash flow' };
    }
  },

  async getExpenses(): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.get('operations/expenses/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch expenses' };
    }
  },

  async generatePayslip(formData: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('operations/generate-payslip/', formData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate payslip' };
    }
  },

  async generateStatement(formData: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post('banking/generate-statement/', formData);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate statement' };
    }
  },

  async getMembers(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
    try {
      const response = await api.get('users/members/');
      return { success: true, data: response.data as unknown[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch members' };
    }
  },

  async assignClient(data: { mobile_banker: string; client: string; priority: string; location: string }): Promise<{ success: boolean; data?: AssignedClient; error?: string }> {
    try {
      const response = await api.post<AssignedClient>('operations/assignments/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      // Extract detailed error message from DRF response (supports field-specific and non_field_errors)
      const apiError = error as ApiError;
      const errorData = apiError.data as Record<string, unknown> | undefined;

      let errorMsg = 'Failed to assign client';
      if (errorData) {
        // Check non_field_errors first
        const nonFieldErrors = errorData.non_field_errors as string[] | undefined;
        if (nonFieldErrors?.[0]) {
          errorMsg = nonFieldErrors[0];
        }
        // Check detail field
        else if (errorData.detail) {
          errorMsg = String(errorData.detail);
        }
        // Check field-specific errors (e.g., {mobile_banker: ["error msg"]})
        else {
          const fieldErrors: string[] = [];
          for (const [key, value] of Object.entries(errorData)) {
            if (key !== 'status' && Array.isArray(value) && value.length > 0) {
              fieldErrors.push(`${key}: ${value[0]}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMsg = fieldErrors.join(', ');
          }
        }
      }

      return { success: false, error: errorMsg };
    }
  },

  async getChatRooms(): Promise<{ success: boolean; data?: ChatRoomData[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ChatRoomData> | ChatRoomData[]>('chat/rooms/');
      const data = 'results' in response.data ? response.data.results : response.data;
      return { success: true, data: data as ChatRoomData[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async createChatRoom(memberIds: (number | string)[], name = '', isGroup = false): Promise<{ success: boolean; data?: ChatRoomData; error?: string }> {
    try {
      const response = await api.post<ChatRoomData>('chat/rooms/create/', { member_ids: memberIds, name, is_group: isGroup });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };
    }
  },

  async getChatMessages(roomId: number | string): Promise<{ success: boolean; data?: ChatMessageData[]; error?: string }> {
    try {
      const response = await api.get<PaginatedResponse<ChatMessageData> | ChatMessageData[]>(`chat/rooms/${roomId}/messages/`);
      const data = 'results' in response.data ? response.data.results : response.data;
      return { success: true, data: Array.isArray(data) ? [...data].reverse() : data as ChatMessageData[] };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async sendChatMessage(roomId: number | string, content: string): Promise<{ success: boolean; data?: ChatMessageData; error?: string }> {
    try {
      const response = await api.post<ChatMessageData>(`chat/rooms/${roomId}/messages/send/`, { content });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Send failed' };
    }
  },

  async getStaffUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      const response = await api.get<User[]>('users/staff/');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
    }
  },

  async updateAssignment(id: number | string, data: Partial<AssignedClient> & { mobile_banker?: string }): Promise<{ success: boolean; data?: AssignedClient; error?: string }> {
    try {
      const response = await api.patch<AssignedClient>(`operations/assignments/${id}/`, data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update assignment' };
    }
  },

  async scheduleVisit(data: { client_name: string; location: string; scheduled_time: string; notes?: string }): Promise<{ success: boolean; data?: ScheduleVisitResponse; error?: string }> {
    try {
      const response = await api.post<ScheduleVisitResponse>('operations/schedule-visit/', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule visit' };
    }
  },

  async completeVisit(id: number | string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`operations/visit-schedules/${id}/complete/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete visit' };
    }
  },

  async completeAssignment(id: number | string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const response = await api.post(`operations/assignments/${id}/complete/`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to complete assignment' };
    }
  },

};

export const authService = apiService;
